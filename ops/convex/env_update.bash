#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
ENV_NAME="${1:-}"
if [[ "$ENV_NAME" != "development" && "$ENV_NAME" != "production" ]]; then
  echo "Usage: $0 <development|production>" >&2
  exit 1
fi

ENV_FILE="$SCRIPT_DIR/../../.env.$ENV_NAME"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "error: $ENV_FILE was not found" >&2
  exit 2
fi

# Bash read would silently discard NUL bytes before framing the selected values.
if IFS= read -r -d '' nul_prefix <"$ENV_FILE"; then
  echo "error: Environment file contains unsupported NUL bytes" >&2
  exit 1
fi
unset nul_prefix

trim() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  printf '%s' "$value"
}

required_env_value() {
  local required_key="$1" line key value
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="$(trim "$line")"
    [[ -z "$line" || "$line" == \#* || "$line" != *=* ]] && continue
    [[ "$line" == export\ * ]] && line="$(trim "${line#export }")"

    key="$(trim "${line%%=*}")"
    [[ "$key" == "$required_key" ]] || continue
    value="$(trim "${line#*=}")"
    if [[ "$value" == \"* && "$value" == *\" ]]; then
      value="${value:1:${#value}-2}"
    elif [[ "$value" == \'* && "$value" == *\' ]]; then
      value="${value:1:${#value}-2}"
    fi
    [[ -n "$value" ]] && return 0
  done <"$ENV_FILE"

  echo "error: $ENV_FILE must define a non-empty $required_key" >&2
  exit 3
}

if [[ "$ENV_NAME" == "production" ]]; then
  required_env_value CONVEX_SELF_HOSTED_URL
  required_env_value CONVEX_SELF_HOSTED_ADMIN_KEY
fi

declare -a KEYS=()
declare -a VALUES=()
while IFS= read -r line || [[ -n "$line" ]]; do
  line="$(trim "$line")"
  [[ -z "$line" || "$line" == \#* || "$line" != *=* ]] && continue
  [[ "$line" == export\ * ]] && line="$(trim "${line#export }")"

  key="$(trim "${line%%=*}")"
  value="$(trim "${line#*=}")"
  [[ -z "$key" || ! "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] && continue
  [[ "$key" == CONVEX_DEPLOY_KEY || "$key" == CONVEX_DEPLOYMENT || "$key" == CONVEX_DEPLOYMENT_TOKEN || "$key" == CONVEX_SELF_HOSTED_* || "$key" == CONVEX_URL || "$key" == CONVEX_SITE_URL || "$key" == PUBLIC_CONVEX_URL || "$key" == PUBLIC_CONVEX_SITE_URL || "$key" == NEXT_PUBLIC_CONVEX_URL || "$key" == NEXT_PUBLIC_CONVEX_SITE_URL || "$key" == VITE_CONVEX_URL || "$key" == VITE_CONVEX_SITE_URL || "$key" == REACT_APP_CONVEX_URL || "$key" == REACT_APP_CONVEX_SITE_URL || "$key" == EXPO_PUBLIC_CONVEX_URL || "$key" == EXPO_PUBLIC_CONVEX_SITE_URL ]] && continue

  if [[ "$value" == \"* && "$value" == *\" ]]; then
    value="${value:1:${#value}-2}"
  elif [[ "$value" == \'* && "$value" == *\' ]]; then
    value="${value:1:${#value}-2}"
  fi

  KEYS+=("$key")
  VALUES+=("$value")
done <"$ENV_FILE"

if [[ "${#KEYS[@]}" -eq 0 ]]; then
  echo "Convex env sync complete (0 variables)"
  exit 0
fi

umask 077
UPLOAD_FILE="$(mktemp "${TMPDIR:-/tmp}/convex-env.XXXXXX")"
trap 'rm -f -- "$UPLOAD_FILE"' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# Keep the existing parser's strings; send values only over stdin, never argv.
for index in "${!KEYS[@]}"; do
  printf '%s\0%s\0' "${KEYS[$index]}" "${VALUES[$index]}"
done | bun "$SCRIPT_DIR/envPayloadEncode.ts" >"$UPLOAD_FILE"

if bun convex env set --force --from-file "$UPLOAD_FILE" --env-file="$ENV_FILE" >/dev/null 2>&1; then
  echo "Convex env sync complete (${#KEYS[@]} assignments)"
else
  status=$?
  echo "error: Convex env sync failed" >&2
  exit "$status"
fi
