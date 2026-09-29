# Matches upstream: bun 1.3.14 (a skew makes --frozen-lockfile fail) and a real node for `next build`.
FROM oven/bun:1.3.14-alpine
RUN apk add --no-cache nodejs git nginx curl
WORKDIR /app

# Pinned upstream commit of https://github.com/pascalorg/editor (MIT)
ARG PASCAL_REF=64fc7d8b6809ea1df253e17ec9da84391582da06
RUN git init -q . && git remote add origin https://github.com/pascalorg/editor.git \
 && git fetch -q --depth 1 origin ${PASCAL_REF} && git checkout -q FETCH_HEAD

COPY patches /patches
RUN node /patches/apply.mjs /app

# copyfile backend: hardlinks from bun's cache fail on some overlay filesystems (seen on a HA OS host);
# one retry covers a transient tarball download failure.
RUN bun install --frozen-lockfile --backend=copyfile || bun install --frozen-lockfile --backend=copyfile
ENV PASCAL_BASE_PATH=/__PASCAL_BASE__ \
    NEXT_TELEMETRY_DISABLED=1
RUN ./node_modules/.bin/turbo run build --filter=editor --env-mode=loose \
 && cp -a apps/editor/.next /app/next-pristine

COPY replace.mjs /app/replace.mjs
COPY nginx.conf.template /etc/nginx/pascal.conf.template
COPY run.sh /run.sh
RUN chmod +x /run.sh && rm -f /etc/nginx/http.d/default.conf
EXPOSE 8099
CMD ["/run.sh"]
