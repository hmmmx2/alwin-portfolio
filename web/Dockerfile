# The Next.js front end.
#
# Build context is the workspace root, as with the API:
#
#     docker build -f web/Dockerfile .
#
# NEXT_PUBLIC_* are build args rather than runtime env. Next inlines them into
# the client bundle at build time, so setting them in compose's `environment:`
# would do nothing — the value the browser uses is whatever was compiled in.
# API_INTERNAL_URL is the opposite: no NEXT_PUBLIC_ prefix, read at runtime by
# the server only, so it stays configurable without a rebuild.

FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared/package.json shared/
COPY api/package.json api/
COPY web/package.json web/
# Hoisted for the same reason as the API image: Next traces real files into
# .next/standalone, and a symlink farm traces badly.
RUN pnpm install --frozen-lockfile --config.node-linker=hoisted --filter @portfolio/web...

FROM deps AS build
ARG NEXT_PUBLIC_API_URL=http://localhost:4100
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3100
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_TELEMETRY_DISABLED=1

COPY tsconfig.base.json ./
COPY shared shared
COPY web web

# The API is not running during an image build, so the prerender falls back to
# the content bundled in @portfolio/shared and logs a warning. That is the
# designed behaviour, not a failure: every page carries `revalidate`, so the
# first request after startup refreshes it from the live API.
RUN pnpm --filter @portfolio/web build

FROM base AS runtime
ENV NODE_ENV=production \
    # Next's server reads these; 0.0.0.0 so the port is reachable from outside
    # the container.
    HOSTNAME=0.0.0.0 \
    PORT=3100 \
    NEXT_TELEMETRY_DISABLED=1

# `output: "standalone"` mirrors the tracing root, which next.config.ts pins to
# the workspace — so the server lands at web/server.js with node_modules beside
# it, and nothing needs installing here.
COPY --from=build --chown=node:node /repo/web/.next/standalone ./
COPY --from=build --chown=node:node /repo/web/.next/static ./web/.next/static
COPY --from=build --chown=node:node /repo/web/public ./web/public

USER node
EXPOSE 3100

HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3100)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "web/server.js"]
