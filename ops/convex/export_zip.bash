#!/usr/bin/env bash
# Export a Convex snapshot zip from a deployment.
#
# Usage: bash ops/convex/export_zip.bash <development|production>
set -x # Print all executed commands to the terminal
set -e # Exit immediately if a command exits with a non-zero status

scriptDir="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

envName="${1:-}"
if [[ "$envName" != "development" && "$envName" != "production" ]]; then
  echo "Usage: $0 <development|production>" >&2
  exit 1
fi
envFile=$scriptDir/../../.env.$envName

if [[ ! -f "$envFile" ]]; then
  echo -e "Error: File $envFile does not exist"
  exit 1
fi

mkdir -p ./data/convex

bun run convex export \
  --env-file=$envFile \
  --path ./data/convex/$(date +%Y-%m-%d_%H-%M-%S).zip
