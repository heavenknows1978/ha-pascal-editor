// Patches applied to the pinned upstream Pascal editor source so it can run behind Home Assistant ingress.
// Each patch fails the build loudly if upstream changed and the anchor text is gone.
import { readFileSync, writeFileSync } from 'node:fs'

const root = process.argv[2] || '/app'
const BASE = '/__PASCAL_BASE__'

const edit = (file, anchor, replacement) => {
  const path = `${root}/${file}`
  const before = readFileSync(path, 'utf8')
  if (!before.includes(anchor)) throw new Error(`anchor not found in ${file}: ${anchor}`)
  writeFileSync(path, before.replace(anchor, () => replacement))
  console.log('patched', file)
}

// 1. Next basePath is fixed at build time but the ingress path is only known at runtime:
//    build with a placeholder, replace it in the built files when the add-on starts.
edit(
  'apps/editor/next.config.ts',
  'const nextConfig: NextConfig = {\n',
  'const nextConfig: NextConfig = {\n  basePath: process.env.PASCAL_BASE_PATH || undefined,\n',
)

// 1b. The /_next/image optimiser does not work behind the ingress rewrite; serve the original public files.
edit('apps/editor/next.config.ts', '    unoptimized:\n      portableBuild ||', '    unoptimized:\n      true ||')

// 2. Server components fetch their own API. Behind ingress the public host is not reachable from the
//    container, so use the internal URL when it is provided.
for (const f of ['apps/editor/app/scenes/page.tsx', 'apps/editor/app/scene/[id]/page.tsx']) {
  edit(
    f,
    'async function resolveBaseUrl(): Promise<string> {\n',
    'async function resolveBaseUrl(): Promise<string> {\n  if (process.env.PASCAL_INTERNAL_URL) {\n    return process.env.PASCAL_INTERNAL_URL\n  }\n',
  )
}

// 3. Root-relative URLs written in code (fetch("/api/..."), textures, audio) do not get the basePath from
//    Next. A tiny shim prefixes them in the browser.
const shim = readFileSync(new URL('./ingress-shim.js', import.meta.url), 'utf8')
  .replace(/^\s*\/\/.*$/gm, '')
  .replace(/\s*\n\s*/g, ' ')
edit(
  'apps/editor/app/layout.tsx',
  '      <body className="font-sans">\n',
  `      <head>\n        <script dangerouslySetInnerHTML={{ __html: ${JSON.stringify(shim)} }} />\n      </head>\n      <body className="font-sans">\n`,
)
