# The Express API.
#
# Build context is the workspace root, not api/ — the package depends on
# @portfolio/shared through a `workspace:*` link, so the lockfile and the
# sibling manifests have to be visible or pnpm cannot resolve it:
#
#     docker build -f api/Dockerfile .
#
# The runtime tree comes from `pnpm deploy`, not from a filtered install.
# `--filter` narrows which packages pnpm *builds*, not how it lays node_modules
# out — under a hoisted linker the whole workspace flattens into one root, which
# put 380MB of Next.js and React inside this Express image (935MB total).
# `pnpm deploy` resolves one package's production closure into a self-contained
# directory instead: 47MB, and no web dependencies at all.

FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /repo

# Manifests only, so a source edit doesn't invalidate the install layer.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared/package.json shared/
COPY api/package.json api/
COPY web/package.json web/
RUN pnpm install --frozen-lockfile --filter @portfolio/api...

FROM deps AS build
COPY tsconfig.base.json ./
COPY shared shared
COPY api api
# tsup bundles @portfolio/shared into the output, so the deployed tree needs
# third-party dependencies only — no workspace packages at runtime.
RUN pnpm --filter @portfolio/api build

# `--prod` drops tsup, vitest, eslint and drizzle-kit.
#
# Deliberately *not* `--config.node-linker=hoisted`: on pnpm 9.0.0 that
# combination writes .pnpm but never creates the top-level entries, so the tree
# looks plausible and the process dies at boot on "Cannot find package
# 'compression'". The default layout links top-level names at .pnpm relatively,
# which survives COPY --from as long as node_modules is copied whole.
RUN pnpm deploy --filter=@portfolio/api --prod /prod/api

FROM base AS runtime
ENV NODE_ENV=production \
    # 127.0.0.1 is the app's default and is wrong in a container: it would only
    # accept connections from inside this one.
    HOST=0.0.0.0 \
    PORT=4100 \
    DATABASE_URL=file:./data/portfolio.db \
    RESUME_PATH=./assets/resume.pdf

COPY --from=build /prod/api/node_modules ./node_modules
COPY --from=build /prod/api/dist ./dist
COPY --from=build /prod/api/package.json ./package.json
COPY --from=build /prod/api/assets ./assets

# The SQLite file is created on first boot, so the directory has to be writable
# by the unprivileged user. Compose mounts a named volume over it.
RUN mkdir -p /repo/data && chown -R node:node /repo/data
USER node

EXPOSE 4100

# No curl or wget assumptions — node is already here and always will be.
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4100)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Exec form, so the process is PID 1 and receives SIGTERM directly — index.ts
# has a graceful shutdown handler that a shell wrapper would swallow.
CMD ["node", "dist/index.js"]
