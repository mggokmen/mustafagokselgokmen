#!/usr/bin/env bash
# Runs the contract tests (Hurl scenarios and Schemathesis) against the Spring Boot implementation,
# in an isolated Docker Compose project with a mock identity provider (docs/testing.md).
# Requires Docker. Usage: contract/run-tests.sh
set -euo pipefail
cd "$(dirname "$0")/.."

# Throwaway values for this run only; nothing is published on the host.
POSTGRES_PASSWORD="$(openssl rand -hex 16)"
JWT_SECRET="$(openssl rand -base64 48)"
export POSTGRES_PASSWORD JWT_SECRET
export GOOGLE_CLIENT_IDS=contract-tests
export ADMIN_EMAILS=admin@example.com

compose=(docker compose -p mustafagokselgokmen-contract -f docker-compose.yml -f contract/compose.contract.yml)

cleanup() {
  local status=$?
  if [ "$status" -ne 0 ]; then
    echo "Contract tests failed; last API log lines:" >&2
    "${compose[@]}" logs api --tail 80 >&2 || true
  fi
  "${compose[@]}" down --volumes --remove-orphans >/dev/null 2>&1 || true
  exit "$status"
}
trap cleanup EXIT

# Start from nothing: a database volume left by an interrupted run has a different password.
"${compose[@]}" down --volumes --remove-orphans >/dev/null 2>&1 || true
"${compose[@]}" up --detach --build --wait api mock-oidc
"${compose[@]}" run --rm hurl
"${compose[@]}" run --rm schemathesis
