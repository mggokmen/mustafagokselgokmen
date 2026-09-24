#!/usr/bin/env bash
# Runs the web end-to-end tests against the real backend and a mock identity provider
# (docs/testing.md). Requires Docker. Usage: frontend/nextjs/e2e/run-tests.sh [playwright args]
set -euo pipefail
cd "$(dirname "$0")/../../.."
root="$PWD"

# Throwaway values for this run only.
POSTGRES_PASSWORD="$(openssl rand -hex 16)"
NOTIFICATION_DB_PASSWORD="$(openssl rand -hex 16)"
JWT_SECRET="$(openssl rand -base64 48)"
export POSTGRES_PASSWORD NOTIFICATION_DB_PASSWORD JWT_SECRET
export GOOGLE_CLIENT_IDS=web-e2e

# Absolute paths: the Playwright run below changes directory, and the trap still needs these.
compose=(docker compose -p mustafagokselgokmen-web-e2e
  --project-directory "$root"
  -f "$root/docker-compose.yml"
  -f "$root/frontend/nextjs/e2e/compose.e2e.yml")

cleanup() {
  local status=$?
  if [ "$status" -ne 0 ]; then
    echo "Web end-to-end tests failed; last API log lines:" >&2
    "${compose[@]}" logs api --tail 60 >&2 || true
  fi
  "${compose[@]}" down --volumes --remove-orphans >/dev/null 2>&1 || true
  exit "$status"
}
trap cleanup EXIT

# Start from nothing: a database volume left by an interrupted run has a different password.
"${compose[@]}" down --volumes --remove-orphans >/dev/null 2>&1 || true
"${compose[@]}" up --detach --build --wait api mock-oidc

cd "$root/frontend/nextjs"
# Built once here: Playwright starts two instances of it, on two ports.
API_BASE_URL=http://localhost:18080 \
  APP_URL=http://localhost:3100 \
  GOOGLE_CLIENT_ID=web-e2e \
  GOOGLE_CLIENT_SECRET=web-e2e-secret \
  npm run build
npx playwright test "$@"
