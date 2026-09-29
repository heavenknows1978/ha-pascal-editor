// Replace the build-time placeholder with the real ingress path inside a built Next output.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const [dir, from, to] = process.argv.slice(2)
if (!dir || !from || !to) throw new Error('usage: replace.mjs <dir> <from> <to>')
const exts = /\.(js|mjs|cjs|json|html|css|rsc|body|txt)$/
let files = 0
let changed = 0
const walk = (d) => {
  for (const name of readdirSync(d)) {
    const p = join(d, name)
    const st = statSync(p)
    if (st.isDirectory()) {
      if (name === 'cache') continue
      walk(p)
      continue
    }
    if (!exts.test(name)) continue
    files++
    const src = readFileSync(p, 'utf8')
    if (!src.includes(from)) continue
    writeFileSync(p, src.split(from).join(to))
    changed++
  }
}
walk(dir)
console.log(`replaced ${from} -> ${to} in ${changed}/${files} files`)
