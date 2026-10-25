# AGENTS.md

## Stack
Bun + TypeScript (sem build step) + Hono. Única dependência de runtime: `hono`. Sem banco: estado em memória (ring buffer), pod stateless.

## Estrutura
- `src/index.ts`: rotas Hono (`/`, `/api/status`, `/health`); só sobe o servidor se for entrypoint (`import.meta.main`).
- `src/config.ts`: parse de env (`TARGETS`, `CHECK_*`, `TLS_WARN_DAYS`, `HISTORY_LEN`, `PORT`, `TELEGRAM_*`).
- `src/checks.ts`: checagem HTTP e expiração TLS. `src/monitor.ts`: loop e transições. `src/telegram.ts`: alertas. `src/dashboard.ts`: HTML.
- `tests/`: testes `bun:test`.

## Comandos
- `bun install`
- `bun start` (servidor em `:3000`), `bun run dev` (watch)
- `bun test`
- Não há script de lint nem de build; a imagem sai do `Dockerfile`.

## Gates de CI
`validate.yml` (PR/main: segredos, testes, auditoria de deps), `security.yml` (scan semanal e em main), `docker.yml` (imagem GHCR em main). Todos reutilizam `juninmd/base-actions`.

## Não fazer
- Não commitar `.env`, token do Telegram ou chat id; use só os nomes em `.env.example`.
- Não adicionar banco ou estado persistente: o design é efêmero de propósito.
- Não iniciar o loop do monitor em import (quebra os testes); mantenha em `import.meta.main`.
- Não editar `bun.lock` à mão; use `bun install`.

<!-- base-actions-main-policy -->
## GitHub Actions — padrão obrigatório (@main)

- Referencie as actions internas sempre pelo branch, nunca por SHA:
  - `uses: juninmd/base-actions/<action>@main`
  - `uses: juninmd/base-actions/.github/workflows/<arquivo>.yml@main`
- Não fixe `@<sha>` em `juninmd/base-actions`: a atualização é centralizada no
  `main` e passa a valer no próximo run.
- PRs cujos checks não iniciam por billing/spending limit são mesclados pelo bot central
  `juninmd/base-actions/.github/workflows/auto-merge-billing-blocked.yml`.
  Para impedir o merge automático de um PR, aplique a label `do-not-merge`.