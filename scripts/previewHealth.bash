#!/usr/bin/env bash
set -euo pipefail
for attempt in {1..20}; do
  if curl -fsS https://solid-convex.wonder1.de/__preview/health >/dev/null && page=$(curl -fsS https://solid-convex.wonder1.de/) && ! grep -Eq '@vite/client|rsbuild/client|__webpack_hmr' <<<"$page"; then
    echo 'Preview health and document OK'
    exit 0
  fi
  sleep 1
done
echo 'Preview health check failed' >&2
exit 1
