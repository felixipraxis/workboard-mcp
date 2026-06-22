# syntax=docker/dockerfile:1.7
FROM node:22-bookworm-slim AS base

WORKDIR /app

# Copy workspace and file dependency manifests before installing so Docker can
# reuse the npm layer when source files change.
COPY package.json package-lock.json ./
COPY .api/apis/workboard-v1/package.json .api/apis/workboard-v1/package.json
COPY .api/apis/workboard-v2/package.json .api/apis/workboard-v2/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/functions/package.json packages/functions/package.json
COPY packages/scripts/package.json packages/scripts/package.json

RUN npm install \
    --omit=dev \
    --ignore-scripts \
    --legacy-peer-deps \
    --workspace=@workboard-mcp/functions \
    --include-workspace-root=false

COPY .api/apis .api/apis
COPY packages/core packages/core
COPY packages/functions packages/functions

WORKDIR /app/packages/functions
EXPOSE 3000
ENTRYPOINT ["node", "--import", "tsx", "src/local.ts"]
