# ops — env files, services

Same scheme as allgroups-chat and dcc-app (see allgroups-chat's
`ops/README.md` + `docs/ops-restructure-plan.md` for the rationale).
This project is **dev-only**: the demo UI deploys to Cloudflare Pages, there
is no self-hosted prod Convex deployment.

## Machine

- **david (local)** — dev. Domains
  `app./convex./api./dash.solid-convex.dev` (+ `.com` variants, in `/etc/hosts`,
  behind david's user Caddy which imports `ops/caddy/Caddyfile`). Localhost
  direct origins are also available: UI `http://localhost:3012`, Convex
  backend `http://127.0.0.1:3240`, and Convex HTTP actions/API
  `http://127.0.0.1:3241`.

## Env files (all gitignored; template: `ops/convex/env.docker.example`)

- **`.env.development`** (repo root) — app env for the demo UI and tests,
  **and** the Convex CLI credentials (`CONVEX_SELF_HOSTED_URL` +
  `CONVEX_SELF_HOSTED_ADMIN_KEY`) of this machine's deployment. Bun auto-loads
  it in dev.
- **`ops/convex/.env.docker`** — the backend container env of this machine's
  deployment (quadlets).
- **`.env.local`** — NOT ours: the Convex CLI regenerates it with
  `VITE_CONVEX_URL`/`VITE_CONVEX_SITE_URL` on every `convex dev` (no opt-out,
  see convex-js#93). The app reads neither var. Never put secrets in it.

## Services (`ops/systemd/`, installed via `bash ops/systemd/install.bash`)

Units reference `%h/solid-convex`, a symlink to the repo checkout that
`install.bash` creates. The backend + dashboard are **Podman quadlets**
(`ops/convex/*.container` + `*.volume`); `install.bash` symlinks them into
`~/.config/containers/systemd/`. The two bun processes are plain
`~/.config/systemd/user` units.

- **`solid-convex-backend.service`** — self-hosted Convex backend, published on
  `127.0.0.1:3240`/`:3241` (container ports 3210/3211; other local services
  own adjacent host ports).
  `Notify=healthy` keeps it "activating" until its healthcheck passes.
- **`solid-convex-dashboard.service`** — Convex dashboard on `127.0.0.1:6793`.
  `Requires=`/`After=` the backend.
- **`solid-convex-dev.service`** — Convex dev watcher (`convex dev
  --env-file=.env.development`): compiles `convex/` and pushes to this
  machine's backend. `Wants=` starts the backend.
- **`solid-convex-ui.service`** — demo frontend dev server (`bun run dev` →
  rsbuild, `:3012` from `.env.development`; `:3016` is the standalone fallback).

Quadlet services auto-enable on boot via their `[Install]` section — just
`start` them (the two bun units still need `enable --now`).
Start/stop: `systemctl --user start|stop|restart <unit>`.
Logs: `journalctl --user -u <unit> -f`.

## Convex ops (`ops/convex/`)

- backend/dashboard lifecycle: `bun run convex:backend:up|down`. Image
  updates: `podman auto-update` (or `bun run convex:backend:update`) — the
  containers carry `AutoUpdate=registry`. Container env comes from `./.env.docker`.
- `get_admin_key.bash` — mint the admin key of the running backend (`podman exec`)
- `env_update.bash` — push app env vars into the deployment env (skips
  `CONVEX_SELF_HOSTED_*`)
- `export_zip.bash` / `import_zip.bash` — snapshot export/import
