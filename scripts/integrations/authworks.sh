#!/usr/bin/env bash
# Provision the fixed Solid Convex Authworks clients and organization handoff.
# This only reconciles Authworks and local mode-600 provisioning state; it never
# deploys Solid Convex application source or edits a runtime environment.
#
# Mirror of multichat/scripts/integrations/authworks.sh, adapted to the
# Solid Convex boundary (see authworks oidcProjectBoundaryRegistry: slug
# "solid-convex"). There is no per-project organization-id-sync route for this
# slug; production realm/organization resolution is embedded in the ensure
# commands. The AUTHWORKS_ORGANIZATION_ID below is recorded once the live
# ensures run where the production Authworks environment is readable
# (/home/authworks, as required by the authworks CLI).
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CHECKOUT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
STATE_DIR="${SOLID_CONVEX_STATE_DIR:-$CHECKOUT_DIR/state}"
STATE_FILE="$STATE_DIR/oidc.env"

AUTHWORKS_ISSUER="https://authworks.contentoren.de"
AUTHWORKS_PRODUCTION_REDIRECT_URI="https://solid-convex.contentoren.de/api/auth/oidc/authworks/callback"
AUTHWORKS_DEVELOPMENT_REDIRECT_URI="http://127.0.0.1:3241/api/auth/oidc/authworks/callback"
AUTHWORKS_PREVIEW_REDIRECT_URI="https://solid-convex.leonardomora.de/api/auth/oidc/authworks/callback"

MODE="${1:-}"
case "$MODE" in
  check|apply) ;;
  *) echo "usage: $0 check|apply" >&2; exit 1 ;;
esac

log() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
die() { printf '\033[1;31mERROR\033[0m %s\n' "$*" >&2; exit 1; }

require_private_file() {
  [[ -f "$STATE_FILE" && ! -L "$STATE_FILE" ]] || die "missing regular state file: $STATE_FILE"
  [[ "$(stat -c '%a' "$STATE_FILE")" == "600" ]] || die "state file must have mode 600: $STATE_FILE"
}

env_get() {
  local key="$1"
  STATE_PATH="$STATE_FILE" STATE_KEY="$key" python3 - <<'PY'
import os

path = os.environ["STATE_PATH"]
wanted = os.environ["STATE_KEY"]
try:
    with open(path, encoding="utf-8") as source:
        for line in source:
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or "=" not in stripped:
                continue
            key, _, value = stripped.partition("=")
            if key.strip() == wanted:
                value = value.strip()
                if len(value) >= 2 and value[0] == value[-1] and value[0] in ("'", '"'):
                    value = value[1:-1]
                print(value)
                break
except FileNotFoundError:
    pass
PY
}

state_set() {
  local key="$1" value="$2"
  STATE_PATH="$STATE_FILE" STATE_KEY="$key" STATE_VALUE="$value" python3 - <<'PY'
import os
import re

path = os.environ["STATE_PATH"]
key = os.environ["STATE_KEY"]
value = os.environ["STATE_VALUE"]
with open(path, encoding="utf-8") as source:
    text = source.read()
if not text.endswith("\n"):
    text += "\n"
line = f"{key}={value}"
pattern = rf"(?m)^{re.escape(key)}=.*$"
if re.search(pattern, text):
    text = re.sub(pattern, line, text)
else:
    text += line + "\n"
with open(path, "w", encoding="utf-8") as target:
    target.write(text)
PY
}

uuid_require() {
  local key="$1" value
  value="$(env_get "$key")"
  [[ "$value" =~ ^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$ ]] \
    || die "$key is missing or is not a UUIDv7"
}

secret_require() {
  local key="$1" value
  value="$(env_get "$key")"
  [[ "$value" =~ ^[A-Za-z0-9_-]{43}$ ]] || die "$key is missing or invalid"
}

# Merge one credential envelope (stdout of an *-ensure command) into the
# state file. Prints only key names, never secret values.
envelope_merge() {
  local envelope_file="$1" environment="$2"
  ENVELOPE_PATH="$envelope_file" ENVELOPE_ENV="$environment" STATE_PATH="$STATE_FILE" python3 - <<'PY'
import json
import os
import re

path = os.environ["STATE_PATH"]
with open(os.environ["ENVELOPE_PATH"], encoding="utf-8") as source:
    raw = source.read().strip()
if not raw:
    raise SystemExit(0)
data = json.loads(raw.splitlines()[-1])
kind = data.get("kind", "")
expected = f"authworks.solid-convex-{os.environ['ENVELOPE_ENV']}-oidc-credential"
if kind != expected:
    raise SystemExit(f"unexpected envelope kind: {kind}")
with open(path, encoding="utf-8") as source:
    text = source.read()
if not text.endswith("\n"):
    text += "\n"
for key, field in (
    ("AUTHWORKS_" + os.environ["ENVELOPE_ENV"].upper() + "_CLIENT_ID", "clientId"),
    ("AUTHWORKS_" + os.environ["ENVELOPE_ENV"].upper() + "_CLIENT_SECRET", "clientSecret"),
):
    value = data.get(field, "")
    if not value:
        raise SystemExit(f"envelope is missing field: {field}")
    line = f"{key}={value}"
    pattern = rf"(?m)^{re.escape(key)}=.*$"
    if re.search(pattern, text):
        text = re.sub(pattern, line, text)
    else:
        text += line + "\n"
with open(path, "w", encoding="utf-8") as target:
    target.write(text)
print(f"merged envelope keys for {os.environ['ENVELOPE_ENV']}")
PY
}

check_authworks() {
  require_private_file
  [[ "$(env_get AUTHWORKS_ISSUER)" == "$AUTHWORKS_ISSUER" ]] || die "Authworks issuer is not canonical"
  [[ "$(env_get AUTHWORKS_PRODUCTION_REDIRECT_URI)" == "$AUTHWORKS_PRODUCTION_REDIRECT_URI" ]] \
    || die "Authworks production callback is not canonical"
  [[ "$(env_get AUTHWORKS_DEVELOPMENT_REDIRECT_URI)" == "$AUTHWORKS_DEVELOPMENT_REDIRECT_URI" ]] \
    || die "Authworks development callback is not canonical"
  [[ "$(env_get AUTHWORKS_PREVIEW_REDIRECT_URI)" == "$AUTHWORKS_PREVIEW_REDIRECT_URI" ]] \
    || die "Authworks preview callback is not canonical"
  uuid_require AUTHWORKS_ORGANIZATION_ID
  uuid_require AUTHWORKS_PRODUCTION_CLIENT_ID
  secret_require AUTHWORKS_PRODUCTION_CLIENT_SECRET
  uuid_require AUTHWORKS_DEVELOPMENT_CLIENT_ID
  secret_require AUTHWORKS_DEVELOPMENT_CLIENT_SECRET
  log "dedicated Solid Convex Authworks clients and organization handoff are ready"
}

prepare_state_file() {
  [[ ! -L "$STATE_DIR" ]] || die "state directory must not be a symlink: $STATE_DIR"
  install -d -m 700 "$STATE_DIR"
  chmod 700 "$STATE_DIR"
  if [[ ! -e "$STATE_FILE" ]]; then
    (umask 077; : >"$STATE_FILE")
    chmod 600 "$STATE_FILE"
  fi
  require_private_file
}

apply_authworks() {
  prepare_state_file
  state_set AUTHWORKS_ISSUER "$AUTHWORKS_ISSUER"
  state_set AUTHWORKS_PRODUCTION_REDIRECT_URI "$AUTHWORKS_PRODUCTION_REDIRECT_URI"
  state_set AUTHWORKS_DEVELOPMENT_REDIRECT_URI "$AUTHWORKS_DEVELOPMENT_REDIRECT_URI"
  state_set AUTHWORKS_PREVIEW_REDIRECT_URI "$AUTHWORKS_PREVIEW_REDIRECT_URI"
  # The authworks CLI prints a one-time credential envelope to stdout only when
  # it creates a client. Capture it straight into the mode-600 state file so
  # secrets never pass through the terminal or logs.
  production_envelope="$(mktemp)"
  development_envelope="$(mktemp)"
  chmod 600 "$production_envelope" "$development_envelope"
  trap 'rm -f "$production_envelope" "$development_envelope"' EXIT
  authworks oidc authworks-solid-convex-production-ensure >"$production_envelope"
  envelope_merge "$production_envelope" production
  authworks oidc authworks-solid-convex-development-ensure >"$development_envelope"
  envelope_merge "$development_envelope" development
  check_authworks
}

case "$MODE" in
  check) check_authworks ;;
  apply) apply_authworks ;;
esac
