#!/usr/bin/env bash
set -x # Print all executed commands to the terminal
set -e # Exit immediately if a command exits with a non-zero status

podman exec solid-convex-backend ./generate_admin_key.sh
