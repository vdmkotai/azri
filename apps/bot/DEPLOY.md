# Azri Bot Deployment

## Required runtime

- Bun >= 1.1.0

## Required env vars

- `GITHUB_APP_ID` — GitHub App ID
- `GITHUB_PRIVATE_KEY` — full PEM contents (newlines included)
- `GITHUB_WEBHOOK_SECRET` — webhook HMAC secret used for `X-Hub-Signature-256` verification
- `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GOOGLE_API_KEY` — at least one must match `AZRI_LLM_PROVIDER`

## Optional env vars

- `PORT` (default `3000`)
- `AZRI_DATA_DIR` (default `./pages-data`)
- `AZRI_PUBLIC_BASE_URL` — base URL for generated page links
- `GITHUB_WEBHOOK_ADDITIONAL_SECRETS` — comma-separated extra secrets for rotation
- `AZRI_LLM_PROVIDER` — `anthropic` | `openai` | `google` (default `anthropic`)
- `AZRI_LOG_LEVEL` — `trace` | `debug` | `info` | `warn` | `error` (default `info`)
- `AZRI_SELF_BOOTSTRAP` — `true` to enable Azri to explain itself

## Run

```bash
bun run apps/bot/src/server.ts
```

Always use `bun run`. Do **not** use `bun build` (see [oven-sh/bun#25630](https://github.com/oven-sh/bun/issues/25630)).

The server sets `idleTimeout: 0` on `Bun.serve` so that long-running webhook processing does not get killed mid-flight.

## Verify

```bash
curl http://localhost:3000/healthz
```

Expected response:

```json
{ "status": "ok", "engineVersion": "0.1.0", "uptimeMs": 1234 }
```

## Webhook signature verification

The bot reads the raw POST body (via `HttpServerRequest.text`) **before** parsing JSON, so HMAC SHA-256 verification against `X-Hub-Signature-256` is byte-accurate. Missing or invalid signatures return `401`. Missing `GITHUB_WEBHOOK_SECRET` returns `500`.

## Static page serving

`GET /r/*` serves files from `<AZRI_DATA_DIR>/r/...`. Path traversal is blocked. Responses include strict security headers:

- `Content-Security-Policy: default-src 'self'; script-src 'none'; style-src 'self' 'unsafe-inline'; img-src data: 'self' https://github.com`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
- `Cache-Control: public, max-age=300`

## Docker (Railway / Fly.io / self-host)

Use `oven/bun:latest` as the base image:

```dockerfile
FROM oven/bun:latest
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile
EXPOSE 3000
CMD ["bun", "run", "apps/bot/src/server.ts"]
```
