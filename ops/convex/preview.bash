#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
COMMAND="${1:-}"
case "$COMMAND" in
  env)
    cd "$SCRIPT_DIR/../.."
    bun --no-env-file scripts/previewConvexGuard.ts
    export CONVEX_TMPDIR="$PWD/node_modules/.cache/convex-tmp"
    mkdir -p "$CONVEX_TMPDIR"
    exec bash "$SCRIPT_DIR/env_update.bash" preview
    ;;
  deploy)
    shift
    cd "$SCRIPT_DIR/../.."
    bun --no-env-file scripts/previewConvexGuard.ts
    export CONVEX_TMPDIR="$PWD/node_modules/.cache/convex-tmp"
    mkdir -p "$CONVEX_TMPDIR"
    exec bun --no-env-file ./node_modules/convex/bin/main.js deploy --typecheck disable --env-file=.env.preview "$@"
    ;;
  *)
    echo "Usage: $0 <env|deploy>" >&2
    exit 1
    ;;
esac
