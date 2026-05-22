FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS deps
COPY bun.lock package.json ./
COPY apps ./apps
COPY packages ./packages
COPY scripts ./scripts
COPY evals ./evals
COPY tsconfig.json ./
RUN bun install --frozen-lockfile

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=deps /app /app
USER bun
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 CMD bun -e "const r = await fetch('http://127.0.0.1:3000/healthz'); process.exit(r.ok ? 0 : 1)"
CMD ["bun", "run", "apps/bot/src/server.ts"]
