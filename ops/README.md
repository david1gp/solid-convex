# ops — env files, services

Same scheme as allgroups-chat and dcc-app (see allgroups-chat's
`ops/README.md` + `docs/ops-restructure-plan.md` for the rationale).
The production UI deploys to `adaptive-solid-convex.pages.dev` and uses the
self-hosted production Convex deployment at `solid-convex-backend.contentoren.de`
(HTTP actions: `solid-convex-api.contentoren.de`).

## Machine

- **david (local)** — dev. Routing goes through the Project Registry;
  no ad-hoc Caddy vhosts live in this repo. Localhost direct origins are
  available: UI `http://localhost:3012`, Convex backend
  `http://127.0.0.1:3240`, and Convex HTTP actions/API
  `http://127.0.0.1:3241`.

## Env files (all gitignored; template: `ops/convex/env.docker.example`)

- **`.env.development`** (repo root) — app env for the demo UI and tests,
  **and** the Convex CLI credentials (`CONVEX_SELF_HOSTED_URL` +
  `CONVEX_SELF_HOSTED_ADMIN_KEY`) of this machine's deployment. Bun auto-loads
  it in dev.
- **`.env.production`** (repo root) — production app configuration and the
  production self-hosted Convex CLI credentials. Never commit this file.
  Development and production currently share the `solid-convex` R2 bucket;
  its enabled `r2.dev` URL makes uploaded objects publicly readable.
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
  rsbuild, port from `PORT`, else `PREVIEW_WEB_PORT`, else `:5173`).

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
  `CONVEX_SELF_HOSTED_*`). This is separate from frontend deployment; for
  configuration changes, run `bun run convex:env:upload:development` explicitly.
- Production env sync: `bun run convex:env:upload:production` reads
  `.env.production`. Production function deployment is a separate step:
  `bun run convex:deploy:production` (typecheck disabled, Convex schema validation
  still runs). Neither command deploys the frontend.
- `export_zip.bash` / `import_zip.bash` — snapshot export/import

## MCP access

The Convex HTTP API exposes `POST /mcp` over stateless Streamable HTTP (no
sessions or SSE). Clients authenticate with `Authorization: Bearer <API-key-or-JWT>`.
Read tools are `org-list/get`, `team-list/get`, `project-list/get`,
`note-list/get`, `resource-list/get`, and `file-get`. Write tools are
`project-create/update`, `note-create/update`, `resource-create/update/delete`,
`resource-file-add/remove`, `r2-upload-url-get`, and `file-create`; `ping` and
`server-info` are also available. Tools inherit the credential owner's existing
permissions.

## HTTP API and CLI

Use the Convex HTTP actions origin as the API base URL: local development uses
`http://127.0.0.1:3241`; production uses the configured HTTP API domain (currently
`https://solid-convex-api.contentoren.de`). Send
`Authorization: Bearer <API-key-or-JWT>` on every request. The API is stateless
(no sessions or SSE); the server validates the Bearer credential and applies
the existing permission checks.

| Batch | Routes |
| --- | --- |
| Organizations, members, invites, teams | `GET /api/orgs`, `/api/orgs/get`, `/api/orgs/page`, `/api/orgs/handle-available`, `/api/orgs/members`, `/api/orgs/members/get`, `/api/orgs/invites`, `/api/orgs/invites/get`, `/api/teams`, `/api/teams/get`; `POST /api/orgs/create`, `/api/orgs/update`, `/api/orgs/members/create`, `/api/orgs/members/update`, `/api/orgs/members/delete`, `/api/orgs/leave`, `/api/orgs/invites/initiate`, `/api/orgs/invites/resend`, `/api/orgs/invites/accept`, `/api/orgs/invites/dismiss`, `/api/teams/create`, `/api/teams/update` |
| Projects, notes, resources, files, R2 | `GET /api/projects`, `/api/projects/get`, `/api/notes`, `/api/notes/get`, `/api/resources/list`, `/api/resources/get`, `/api/resources/delete-preview`, `/api/resources/files`, `/api/files/list`, `/api/files/get`, `/api/r2/uploadUrl`; `POST /api/projects/create`, `/api/projects/update`, `/api/notes/create`, `/api/notes/update`, `/api/resources/create`, `/api/resources/update`, `/api/resources/delete`, `/api/resources/file-add`, `/api/resources/file-remove`, `/api/files/create`, `/api/files/edit`, `/api/files/delete` |
| API keys and account | `GET /api/keys`; `POST /api/keys/create`, `/api/keys/rename`, `/api/keys/revoke`, `/api/keys/rotate`, `/api/profile/update`, `/api/password/change-request`, `/api/password/change-confirm`, `/api/email/change-request`, `/api/email/change-confirm` |

Run the HTTP CLI with Bun; supply a JSON object or `--field value` arguments
after the command:

```sh
bun run cli -- --baseUrl http://127.0.0.1:3241 --key "$API_KEY" orgs.list --orgHandle acme
bun run cli -- --baseUrl https://solid-convex-api.contentoren.de --key "$API_KEY" keys.list
```

Key creation and rotation return a plaintext credential once only. Store the
returned value securely immediately; it cannot be retrieved later.

## Self-hosted troubleshooting: Node actions & container networking

- **Node action execution & callbacks:** Node SDK actions (`"use node"`) require both a working executor **and** container reachability to the configured public cloud origin (`CONVEX_CLOUD_ORIGIN`) for `runQuery` and `runMutation`. Node action callbacks dispatch HTTP fetches back to `CONVEX_CLOUD_ORIGIN`.
- **Embedded executor vs `NODE_EXECUTOR_URL`:** An earlier read-only project ops agent speculated that the Node executor was missing, but actual live evidence demonstrates the backend's embedded Node executor is running. Do not assert that `NODE_EXECUTOR_URL` is always required since the current embedded executor works.
- **Root cause of callback `fetch failed`:** The observed failure on initial `ctx.runMutation` was caused by the container's inability to reach the public `CONVEX_CLOUD_ORIGIN` from Podman's `pasta` network (`--no-map-gw`) when router hairpinning is absent or DNS loopback fails.
- **Public origin loopback fix via Quadlet drop-in:** When container egress cannot resolve or reach its own public origin FQDN, map the domain name to the host gateway (`host-gateway` / `host.containers.internal`, resolving to `169.254.1.2`). This directs egress traffic to the host reverse proxy (e.g. Caddy), preserving public HTTPS/TLS with valid certificates while avoiding hairpin NAT failures. Use a systemd Quadlet drop-in snippet:
  ```ini
  # ~/.config/containers/systemd/solid-convex-convex-preview.container.d/30-public-origin-loopback.conf
  [Container]
  PodmanArgs=--add-host=solid-convex-backend.wonder1.de:host-gateway
  ```
  *(Note: `PodmanArgs=--add-host=...` is verified in the live preview runtime; Quadlet's native `AddHost=solid-convex-backend.wonder1.de:host-gateway` is an optional equivalent. Do not modify the repo base container `ops/convex/solid-convex-backend.container` to hardcode deployment-specific hostnames universally, as public origins differ by deployment and not all environments require a loopback override.)*
- **Public client URL must stay public:** `CONVEX_CLOUD_ORIGIN` and public client URLs must remain publicly accessible for external clients and SSO callbacks; do not point public client endpoints to internal-only addresses to work around container egress.
- **Diagnostics without secrets:** Test container loopback and egress using a minimal `curl` or secret-free Node `fetch` against the origin URL rather than testing through credential-bearing Zitadel or storage actions.
- **Pre-flight setup test recommendation:** Run a lightweight setup/connectivity test before executing destructive hierarchy deletion cascades or Zitadel admin sync to verify that Node action mutation callbacks succeed end-to-end.
