# syntax=docker/dockerfile:1

# Build context is the repository root, because the build reads contract/openapi.yaml:
#   docker build -f frontend/nextjs/Dockerfile .

FROM node:24-alpine AS build
WORKDIR /workspace/frontend/nextjs

# Dependencies in their own layer, so it's cached until the lock file changes.
COPY frontend/nextjs/package.json frontend/nextjs/package-lock.json ./
RUN npm ci

# The API types are generated from the contract by the prebuild script.
COPY contract/openapi.yaml /workspace/contract/openapi.yaml
COPY frontend/nextjs/ ./

# No configuration is passed here. The same image runs in every environment, so if a build ever
# needed a secret to succeed, that would be the bug (docs/devops.md#configuration-and-secrets).
RUN npm run build


FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system app && adduser --system --ingroup app app \
    # The runtime needs node, not a package manager. Removing npm and corepack takes their bundled
    # dependencies — and the vulnerabilities reported against them — out of the image with them.
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
       /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack

# Everything the standalone server needs, and nothing else: no package manager, no sources.
COPY --from=build --chown=app:app /workspace/frontend/nextjs/.next/standalone ./
COPY --from=build --chown=app:app /workspace/frontend/nextjs/.next/static ./.next/static

USER app
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0

# /healthz says this process is serving. It makes no backend call, so a backend outage doesn't get
# the web app restarted.
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
    CMD node -e "fetch('http://127.0.0.1:3000/healthz').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
