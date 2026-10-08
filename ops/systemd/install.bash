#!/usr/bin/env bash
# Install the solid-convex systemd --user units on THIS machine.
#
# 1. Symlinks ~/solid-convex -> this repo checkout (units reference it via %h)
# 2. Symlinks the plain .service units into ~/.config/systemd/user
# 3. Symlinks the Podman quadlets (.container/.volume) into
#    ~/.config/containers/systemd (the podman-user-generator turns them into
#    .service units on daemon-reload; [Install] auto-creates the enable symlink)
# 4. daemon-reload + enable lingering
#
# Idempotent — safe to re-run after pulling unit changes.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}"
USER_UNIT_DIR="$CONFIG_DIR/systemd/user"
QUADLET_DIR="$CONFIG_DIR/containers/systemd"

# The stable per-machine repo entrypoint the units use.
if [[ "$REPO_DIR" != "$HOME/solid-convex" ]]; then
  ln -sfn "$REPO_DIR" "$HOME/solid-convex"
  echo "linked ~/solid-convex -> $REPO_DIR"
fi

# Plain systemd --user units (bun processes).
mkdir -p "$USER_UNIT_DIR"
for unit in solid-convex-dev.service solid-convex-ui.service; do
  ln -sf "$SCRIPT_DIR/$unit" "$USER_UNIT_DIR/$unit"
  echo "linked $unit"
done

# Podman quadlets — the Convex backend + dashboard containers and their volume.
mkdir -p "$QUADLET_DIR"
for quadlet in solid-convex-backend.container solid-convex-dashboard.container solid-convex-data.volume; do
  ln -sf "$REPO_DIR/ops/convex/$quadlet" "$QUADLET_DIR/$quadlet"
  echo "linked $quadlet"
done

systemctl --user daemon-reload

# Keep user services running after logout (needs to be done once per machine).
loginctl enable-linger "$USER" || true

cat <<'USAGE'

Installed. Usage (quadlet services auto-enable via [Install]; just start them.
The plain bun units still need enable --now to persist across boots):

  systemctl --user start solid-convex-backend solid-convex-dashboard
  systemctl --user enable --now solid-convex-dev solid-convex-ui

  # Logs:
  journalctl --user -u solid-convex-backend -f
  journalctl --user -u solid-convex-dashboard -f
  journalctl --user -u solid-convex-dev -f
  journalctl --user -u solid-convex-ui -f
USAGE
