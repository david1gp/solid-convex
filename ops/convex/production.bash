#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
COMMAND="${1:-}"
case "$COMMAND" in
  env) exec bash "$SCRIPT_DIR/env_update.bash" production ;;
  deploy)
    shift
    cd "$SCRIPT_DIR/../.."
    exec bunx convex deploy --typecheck disable --env-file=.env.production "$@"
    ;;
  *)
    echo "Usage: $0 <env|deploy> [deploy options]" >&2
    exit 1
    ;;
esac
