# 🌐 cluster-pulse

Self-hosted status page for a homelab. Watches a list of URLs and reports **uptime, latency and TLS-certificate expiry** on a live dashboard, and pings **Telegram** when a target flips up/down or a cert is about to expire.

Built for the exact failure mode a GitOps homelab hits: an ingress that ArgoCD reports as "Synced" but is actually returning 5xx, or a `wildcard-tls` cert quietly counting down to expiry.

## Features
- HTTP uptime + latency with a rolling uptime % and sparkline history.
- TLS leaf-cert expiry per https target (raw TLS socket, no external API).
- Telegram alert **only on state transition** (no spam) + one-shot TLS-expiry warning.
- Zero database — in-memory ring buffer, ephemeral by design. Stateless pod.
- Single dependency (`hono`); ~200 LOC.

## Run
```bash
bun install
cp .env.example .env   # set TARGETS
bun start              # http://localhost:3000
bun test
```

## Config (env)
| var | default | meaning |
|-----|---------|---------|
| `TARGETS` | `""` | `url` or `Label=url`, comma-separated |
| `CHECK_INTERVAL_MS` | `60000` | poll period |
| `CHECK_TIMEOUT_MS` | `10000` | per-request timeout |
| `TLS_WARN_DAYS` | `14` | warn when cert has ≤ N days |
| `HISTORY_LEN` | `60` | samples kept per target |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | — | optional alerts |

## API
- `GET /` — dashboard
- `GET /api/status` — JSON snapshot
- `GET /health` — liveness

## Deploy
GitHub push → GHCR image `ghcr.io/juninmd/cluster-pulse:latest` → ArgoCD from `app-charts/cluster-pulse`. Exposed at `https://cluster-pulse.antonio-code.duckdns.org`.

MIT.
