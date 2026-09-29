#!/bin/sh
set -e
cd /app

# Ingress path: from the Supervisor when running as an add-on, or INGRESS_ENTRY for local tests.
ENTRY="${INGRESS_ENTRY:-}"
if [ -z "$ENTRY" ] && [ -n "$SUPERVISOR_TOKEN" ]; then
  ENTRY=$(curl -fsS -H "Authorization: Bearer ${SUPERVISOR_TOKEN}" http://supervisor/addons/self/info \
    | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).data.ingress_entry||""))')
fi
[ -n "$ENTRY" ] || { echo "ingress entry not found"; exit 1; }
echo "[pascal] ingress entry: $ENTRY"

# fresh copy of the pristine build every start, then point it at this install's ingress path
rm -rf apps/editor/.next
cp -a /app/next-pristine apps/editor/.next
node /app/replace.mjs apps/editor/.next /__PASCAL_BASE__ "$ENTRY"

mkdir -p /data/pascal
# next.config.ts is evaluated again by `next start`: give it the real base path, not the build placeholder
export PASCAL_BASE_PATH="$ENTRY"
export PASCAL_DATA_DIR=/data/pascal
export NODE_ENV=production
export PORT=3000
export PASCAL_INTERNAL_URL="http://127.0.0.1:3000${ENTRY}"

sed "s#__ENTRY__#${ENTRY}#g" /etc/nginx/pascal.conf.template > /etc/nginx/http.d/default.conf
nginx
echo "[pascal] starting editor"
cd /app/apps/editor
# stop cleanly when the Supervisor sends SIGTERM (exit 0 instead of 143)
trap 'nginx -s quit 2>/dev/null; kill "$EDITOR_PID" 2>/dev/null; wait "$EDITOR_PID" 2>/dev/null; exit 0' TERM INT
bun run start -- -p 3000 -H 127.0.0.1 &
EDITOR_PID=$!
wait "$EDITOR_PID"
