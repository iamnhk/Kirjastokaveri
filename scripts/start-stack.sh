#!/usr/bin/env bash
set -euo pipefail

# run from repository root
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed or not on PATH." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon is not running. Start Docker Desktop first." >&2
  exit 1
fi

if [[ ${1:-} == "--force" ]]; then
  if ! docker compose down >/dev/null; then
    echo "Warning: 'docker compose down' failed. See above for details." >&2
  fi
  shift || true
fi

docker compose up -d "$@"
echo "Stack is running."
