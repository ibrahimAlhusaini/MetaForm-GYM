# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS dependencies
WORKDIR /workspace

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN npm ci

FROM dependencies AS build
COPY packages/shared-types packages/shared-types
COPY apps/api apps/api
RUN npm run build --workspace @metaform/shared-types \
    && DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build npm run prisma:generate --workspace @metaform/api \
    && npm run build --workspace @metaform/api

FROM node:22-bookworm-slim AS production-dependencies
WORKDIR /workspace
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN npm ci --omit=dev --omit=optional --omit=peer && npm cache clean --force

FROM node:22-bookworm-slim AS migration-dependencies
WORKDIR /opt/migration
COPY apps/api/migration-runtime/package.json apps/api/migration-runtime/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:22-bookworm-slim AS migration
ENV NODE_ENV=production
WORKDIR /workspace/apps/api
COPY --from=migration-dependencies --chown=node:node /opt/migration/node_modules node_modules
COPY --chown=node:node apps/api/prisma prisma
COPY --chown=node:node apps/api/prisma.config.ts prisma.config.ts
COPY --chown=node:node apps/api/scripts/run-migrations.mjs scripts/run-migrations.mjs
RUN rm -rf /usr/local/lib/node_modules/npm \
    && rm -f /usr/local/bin/npm /usr/local/bin/npx
USER node
CMD ["node", "scripts/run-migrations.mjs"]

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /workspace

COPY --from=production-dependencies --chown=node:node /workspace/node_modules ./node_modules
COPY --from=build --chown=node:node /workspace/apps/api/dist ./apps/api/dist
COPY --from=build --chown=node:node /workspace/apps/api/package.json ./apps/api/package.json
COPY --from=build --chown=node:node /workspace/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=build --chown=node:node /workspace/packages/shared-types/package.json ./packages/shared-types/package.json

# The service starts directly with Node; package-management tooling is not
# required at runtime and would retain avoidable npm CLI dependencies.
RUN rm -rf /usr/local/lib/node_modules/npm \
    && rm -f /usr/local/bin/npm /usr/local/bin/npx

USER node
EXPOSE 3000
CMD ["node", "apps/api/dist/server.js"]
