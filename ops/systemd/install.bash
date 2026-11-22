#!/usr/bin/env bash
# Install the solid-convex Podman quadlets on THIS machine.
#
# 1. Symlinks ~/solid-convex -> this repo checkout (units reference it via %h)
# 2. Symlinks the Podman quadlets (.container/.volume) into
#    ~/.config/containers/systemd (the podman-user-generator turns them into
#    .service units on daemon-reload; [Install] auto-creates the enable symlink)
# 3. daemon-reload + enable lingering
#
# Idempotent — safe to re-run after pulling unit changes.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}"
QUADLET_DIR="$CONFIG_DIR/containers/systemd"

# The stable per-machine repo entrypoint the units use.
if [[ "$REPO_DIR" != "$HOME/solid-convex" ]]; then
  ln -sfn "$REPO_DIR" "$HOME/solid-convex"
  echo "linked ~/solid-convex -> $REPO_DIR"
fi

# Podman quadlets — the Convex backend + dashboard containers and their volume.
mkdir -p "$QUADLET_DIR"
for quadlet in solid-convex-backend.container solid-convex-dashboard.container solid-convex-data.volume solid-convex-convex-preview.container solid-convex-convex-preview-data.volume; do
  ln -sf "$REPO_DIR/ops/convex/$quadlet" "$QUADLET_DIR/$quadlet"
  echo "linked $quadlet"
done

systemctl --user daemon-reload

# Keep user services running after logout (needs to be done once per machine).
loginctl enable-linger "$USER" || true

cat <<'USAGE'

Installed. Usage (quadlet services auto-enable via [Install]; just start them.
No frontend or watcher units are installed here):

  systemctl --user start solid-convex-backend solid-convex-dashboard

  # Logs:
  journalctl --user -u solid-convex-backend -f
  journalctl --user -u solid-convex-dashboard -f
USAGE
