# Azri Operator Guide

This guide covers deploying and operating Azri as a GitHub App bot. It assumes you have a GitHub account and access to a hosting platform.

For contributor setup, see [../CONTRIBUTING.md](../CONTRIBUTING.md).

---

## Table of contents

- [Quickstart: Railway in 5 minutes](#quickstart-railway-in-5-minutes)
- [Required environment variables](#required-environment-variables)
- [GitHub App setup](#github-app-setup)
- [Webhook URL configuration](#webhook-url-configuration)
- [Webhook secret rotation](#webhook-secret-rotation)
- [GitHub App private-key rotation](#github-app-private-key-rotation)
- [Deployment options](#deployment-options)
  - [Railway (primary)](#railway-primary)
  - [Fly.io (alternative)](#flyio-alternative)
  - [Self-host VPS (alternative)](#self-host-vps-alternative)
  - [Render (alternative)](#render-alternative)
  - [Ruled out](#ruled-out)
  - [v1.5 deferred: split deployment](#v15-deferred-split-deployment)
- [Monitoring](#monitoring)

---

## Quickstart: Railway in 5 minutes

This gets you a running bot with zero local tooling beyond a browser.

**Step 1 — Create a GitHub App**

Go to [github.com/settings/apps/new](https://github.com/settings/apps/new) (or your org's equivalent). Fill in:

- **GitHub App name**: anything unique, e.g. `azri-yourname`
- **Homepage URL**: your Railway URL (you'll get this in step 3; use a placeholder for now)
- **Webhook URL**: leave blank for now; you'll fill it in after Railway gives you a URL
- **Webhook secret**: generate a random string, e.g. `openssl rand -hex 32`
- **Permissions**: Pull requests (read), Contents (read), Issues (write), Checks (write)
- **Subscribe to events**: Pull request, Issue comment
- **Where can this GitHub App be installed?**: Only on this account (or Any account for public bots)

Click **Create GitHub App**. On the next page, note the **App ID** and click **Generate a private key**. Download the `.pem` file.

**Step 2 — Deploy on Railway**

1. Go to [railway.app](https://railway.app) and sign in.
2. Click **New Project** > **Deploy from GitHub repo**.
3. Select your fork of `azri`. Railway auto-detects the Dockerfile at `docs/Dockerfile`.
4. Click **Deploy**. Railway builds and starts the container.
5. Go to **Settings** > **Networking** > **Generate Domain**. Copy the URL (e.g. `https://azri-production.up.railway.app`).

**Step 3 — Set environment variables**

In Railway, go to your service > **Variables** and add:

```
GITHUB_APP_ID=<your App ID from step 1>
GITHUB_PRIVATE_KEY=<contents of the .pem file, with literal \n for newlines>
GITHUB_WEBHOOK_SECRET=<the secret you generated in step 1>
ANTHROPIC_API_KEY=<your Anthropic API key>
AZRI_PUBLIC_BASE_URL=https://azri-production.up.railway.app
AZRI_DATA_DIR=/data
```

Railway restarts the container automatically after you save variables.

**Step 4 — Configure the webhook URL**

Go back to your GitHub App settings at [github.com/settings/apps](https://github.com/settings/apps). Edit the app and set:

- **Webhook URL**: `https://azri-production.up.railway.app/webhook`

Save.

**Step 5 — Install the app**

On your GitHub App page, click **Install App** and choose the repos you want Azri to watch. Open a PR in one of those repos. Azri will post a sticky comment with a link to the generated explainer page.

---

## Required environment variables

See [../.env.example](../.env.example) for the full list with comments. The minimum required set:

| Variable                          | Required | Description                                                            |
| --------------------------------- | -------- | ---------------------------------------------------------------------- |
| `GITHUB_APP_ID`                   | Yes      | Numeric App ID from GitHub App settings                                |
| `GITHUB_PRIVATE_KEY`              | Yes      | RSA private key PEM. Base64-encode it or use literal `\n` for newlines |
| `GITHUB_WEBHOOK_SECRET`           | Yes      | HMAC secret for webhook signature verification                         |
| `ANTHROPIC_API_KEY`               | Yes\*    | Anthropic API key. Required if `AZRI_LLM_PROVIDER=anthropic` (default) |
| `OPENAI_API_KEY`                  | Yes\*    | OpenAI API key. Required if `AZRI_LLM_PROVIDER=openai`                 |
| `GOOGLE_API_KEY`                  | Yes\*    | Google API key. Required if `AZRI_LLM_PROVIDER=google`                 |
| `AZRI_PUBLIC_BASE_URL`            | Yes      | Public HTTPS URL of this deployment. Used in sticky-comment links      |
| `AZRI_DATA_DIR`                   | Yes      | Directory for cache and hosted pages. Use `/data` on Railway/Fly       |
| `AZRI_LLM_PROVIDER`               | No       | `anthropic` (default), `openai`, or `google`                           |
| `AZRI_WEBHOOK_SECRETS_ADDITIONAL` | No       | Comma-separated extra secrets for rotation (see below)                 |
| `AZRI_LOG_LEVEL`                  | No       | `debug`, `info` (default), `warn`, or `error`                          |
| `AZRI_SELF_BOOTSTRAP`             | No       | Set to `true` to let Azri process its own PRs. Off by default          |

\*Exactly one LLM provider key is required.

---

## GitHub App setup

Full step-by-step for creating the GitHub App:

1. Go to [github.com/settings/apps/new](https://github.com/settings/apps/new).
   For an organization, go to `github.com/organizations/<org>/settings/apps/new`.

2. Fill in the form:
   - **GitHub App name**: must be globally unique on GitHub
   - **Homepage URL**: your deployment URL (required by GitHub, not used by Azri)
   - **Webhook URL**: `https://<your-domain>/webhook`
   - **Webhook secret**: run `openssl rand -hex 32` and paste the output here. Save it; you'll need it as `GITHUB_WEBHOOK_SECRET`.

3. Set permissions:
   - Repository permissions:
     - **Contents**: Read
     - **Pull requests**: Read & write
     - **Issues**: Read & write
     - **Checks**: Read & write
   - Account permissions: none needed

4. Subscribe to events:
   - **Pull request**
   - **Issue comment**

5. Click **Create GitHub App**.

6. On the app detail page, note the **App ID** (a number like `12345`). Set this as `GITHUB_APP_ID`.

7. Scroll to **Private keys** and click **Generate a private key**. A `.pem` file downloads automatically.

   To use it as an environment variable, base64-encode it:

   ```sh
   base64 -i path/to/private-key.pem | tr -d '\n'
   ```

   Set the output as `GITHUB_PRIVATE_KEY`. Alternatively, paste the raw PEM with `\n` replacing actual newlines.

8. Click **Install App** and choose which repos to enable.

---

## Webhook URL configuration

The webhook URL must be:

```
https://<your-domain>/webhook
```

Azri verifies the `X-Hub-Signature-256` header on every request. Requests without a valid signature return 401.

To test that the webhook is reachable:

```sh
curl -s https://<your-domain>/healthz
# Expected: {"status":"ok"}
```

---

## Webhook secret rotation

Azri supports zero-downtime secret rotation via `AZRI_WEBHOOK_SECRETS_ADDITIONAL`.

**Procedure:**

1. Generate a new secret: `openssl rand -hex 32`
2. In GitHub App settings, update the **Webhook secret** to the new value.
3. Set `AZRI_WEBHOOK_SECRETS_ADDITIONAL=<old-secret>` in your deployment environment. Azri will accept webhooks signed with either the primary secret (`GITHUB_WEBHOOK_SECRET`) or any secret in the additional list.
4. Deploy the updated environment. GitHub may retry recent failed deliveries; Azri will accept them with the old secret.
5. Once you're confident no in-flight webhooks use the old secret (usually a few minutes), remove `AZRI_WEBHOOK_SECRETS_ADDITIONAL`.
6. Set `GITHUB_WEBHOOK_SECRET=<new-secret>` and redeploy.

---

## GitHub App private-key rotation

GitHub Apps can have multiple active private keys simultaneously.

**Procedure:**

1. In GitHub App settings > **Private keys**, click **Generate a private key**. A new `.pem` downloads.
2. Add the new key as `GITHUB_PRIVATE_KEY` in your deployment. Keep the old key active in GitHub for now.
3. Deploy. Azri starts using the new key for JWT signing.
4. Verify the bot is working (open a test PR or check recent webhook deliveries in GitHub App settings).
5. In GitHub App settings, delete the old private key.

---

## Deployment options

### Railway (primary)

Railway is the recommended deployment target. It supports Docker containers, auto-deploys from GitHub, and provides persistent volumes for `AZRI_DATA_DIR`.

**Using the provided template:**

Copy `docs/railway.json` to the repo root as `railway.json`. Railway picks it up automatically.

```sh
cp docs/railway.json railway.json
```

The template configures:

- Dockerfile path: `docs/Dockerfile`
- Restart policy: on-failure, max 3 retries
- Health check: `GET /healthz`

**Persistent volume:**

In Railway, add a volume mounted at `/data` and set `AZRI_DATA_DIR=/data`. Without a volume, cached pages are lost on restart.

**Full walkthrough:**

1. Fork or push the repo to GitHub.
2. In Railway: **New Project** > **Deploy from GitHub repo** > select your repo.
3. Railway detects the Dockerfile and starts building.
4. Add a volume: **Service** > **Volumes** > **Add Volume** > mount path `/data`.
5. Set all required environment variables under **Variables**.
6. Generate a public domain under **Settings** > **Networking**.
7. Update your GitHub App's webhook URL to `https://<railway-domain>/webhook`.

### Fly.io (alternative)

Fly.io is a good choice for multi-region deployments or if you prefer `flyctl`.

Copy `docs/fly.toml` to the repo root:

```sh
cp docs/fly.toml fly.toml
```

Edit `fly.toml` and replace `azri-app` with your app name and adjust the region if needed.

**Deploy:**

```sh
# Install flyctl: https://fly.io/docs/hands-on/install-flyctl/
flyctl auth login
flyctl launch --no-deploy   # creates the app, skips first deploy
flyctl volumes create azri_data --size 1 --region iad
flyctl secrets set \
  GITHUB_APP_ID=12345 \
  GITHUB_PRIVATE_KEY="$(base64 -i private-key.pem | tr -d '\n')" \
  GITHUB_WEBHOOK_SECRET=your-secret \
  ANTHROPIC_API_KEY=sk-ant-... \
  AZRI_PUBLIC_BASE_URL=https://azri-app.fly.dev \
  AZRI_DATA_DIR=/data
flyctl deploy
```

Check status:

```sh
flyctl status
flyctl logs
```

The `fly.toml` template sets `auto_stop_machines = false` because webhook bots need a persistent process. Do not enable auto-stop.

### Self-host VPS (alternative)

Any VPS with Docker works. This example uses Caddy for TLS and systemd for process management.

**Prerequisites:** Docker, Caddy, a domain pointing to your server.

**1. Build and push the image (or pull from your registry):**

```sh
docker build -f docs/Dockerfile -t azri:latest .
docker tag azri:latest registry.example.com/azri:latest
docker push registry.example.com/azri:latest
```

**2. Create a data directory:**

```sh
sudo mkdir -p /var/lib/azri/data
sudo chown 1001:1001 /var/lib/azri/data
```

**3. Create `/etc/systemd/system/azri.service`:**

```ini
[Unit]
Description=Azri GitHub bot
After=docker.service
Requires=docker.service

[Service]
Restart=on-failure
RestartSec=5s
ExecStartPre=-/usr/bin/docker stop azri
ExecStartPre=-/usr/bin/docker rm azri
ExecStart=/usr/bin/docker run --rm --name azri \
  -p 127.0.0.1:3000:3000 \
  -v /var/lib/azri/data:/data \
  --env-file /etc/azri/env \
  registry.example.com/azri:latest
ExecStop=/usr/bin/docker stop azri

[Install]
WantedBy=multi-user.target
```

Put your environment variables in `/etc/azri/env` (one `KEY=value` per line, no quotes needed).

**4. Configure Caddy (`/etc/caddy/Caddyfile`):**

```
azri.example.com {
    reverse_proxy localhost:3000
}
```

Caddy handles TLS automatically via Let's Encrypt.

**5. Start everything:**

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now azri
sudo systemctl reload caddy
```

For Traefik instead of Caddy, add the standard Traefik labels to the `docker run` command and configure a Let's Encrypt resolver.

### Render (alternative)

Render supports Docker services and works with Azri. Create a **Web Service**, point it at your repo, and set the Dockerfile path to `docs/Dockerfile`.

**Important:** Render's free tier spins down services after 15 minutes of inactivity. A webhook bot needs to be running at all times to receive events. Use a paid Render plan (Starter or above) to disable sleep. The free tier is not compatible with webhook bots.

---

## Ruled out

**Vercel / Netlify:** Both platforms are designed for serverless functions with short execution windows (Vercel's default function timeout is 10 seconds on the Hobby plan, 60 seconds on Pro). Azri's pipeline can take up to 5 minutes for a large PR. There's no way to keep state between requests, and the bot needs a persistent process to handle webhook retries and deduplication. These platforms are not suitable.

**Cloudflare Workers:** Workers have a 30-second CPU time limit per request and no persistent disk. Azri's Stage 3 (parallel dynamic section production) can take up to 120 seconds on large PRs. Workers also can't run Bun or Node.js natively. Not suitable for v1.

---

## v1.5 deferred: split deployment

A future architecture splits the bot from page serving:

- **Bot process**: Railway or Fly.io (handles webhooks, runs pipeline, uploads pages)
- **Page serving**: Cloudflare R2 + Workers Static Assets (serves generated HTML at the edge)

This reduces bot memory usage and improves page load times globally. It's out of scope for v1. The `AZRI_PUBLIC_BASE_URL` env var is designed to support this: point it at the R2/Workers domain when the split is implemented.

---

## Monitoring

Azri emits structured JSON logs to stdout. Each line is a JSON object with at minimum `event`, `level`, and `ts` fields.

**Key events to watch:**

| Event                        | Meaning                                                        |
| ---------------------------- | -------------------------------------------------------------- |
| `orchestrator.failed`        | Pipeline failed for a PR. Check `cause` field for details      |
| `webhook.failed`             | Webhook handler threw an unhandled error                       |
| `stage-3.error`              | Section generation failed for one or more sections             |
| `bot.webhook-secret-missing` | `GITHUB_WEBHOOK_SECRET` not set; all webhooks will be rejected |
| `bot.started`                | Bot started successfully; shows port, dataDir, llmProvider     |

**Grep examples:**

```sh
# Railway: stream logs and filter for failures
railway logs | grep '"orchestrator.failed"'

# Fly.io
flyctl logs | grep -E '"(orchestrator|webhook|stage-3)\.(failed|error)"'

# Docker / systemd
journalctl -u azri -f | grep '"level":"error"'
```

**Health check:**

```sh
curl https://<your-domain>/healthz
# {"status":"ok"}
```

A non-200 response or connection refused means the bot is down.

**Log level:** Set `AZRI_LOG_LEVEL=debug` to see per-stage timing and token usage. Keep it at `info` in production to avoid log volume.
