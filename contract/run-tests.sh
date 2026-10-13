#!/usr/bin/env bash
# Runs the contract tests (Hurl scenarios and Schemathesis) against the Spring Boot implementation,
# in an isolated Docker Compose project with a mock identity provider (docs/testing.md).
# Requires Docker. Usage: contract/run-tests.sh
set -euo pipefail
cd "$(dirname "$0")/.."

# Throwaway values for this run only; nothing is published on the host.
POSTGRES_PASSWORD="$(openssl rand -hex 16)"
NOTIFICATION_DB_PASSWORD="$(openssl rand -hex 16)"
JWT_SECRET="$(openssl rand -base64 48)"
export POSTGRES_PASSWORD NOTIFICATION_DB_PASSWORD JWT_SECRET
export WEB_GOOGLE_CLIENT_ID=unused WEB_GOOGLE_CLIENT_SECRET=unused
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

# Schemathesis exits non-zero when a check fails, which covers wrong answers. It does not cover
# coverage going quiet: if authentication stopped working for real, the stateful phase would still
# report "passed" while chaining nothing at all. So the run must also have exercised every API link
# it found, because those chains are the authenticated ones (docs/testing.md#contract-tests).
report="$(mktemp)"
set -o pipefail
"${compose[@]}" run --rm schemathesis 2>&1 | tee "$report"

links="$(sed -nE 's#.*API Links:[[:space:]]+([0-9]+) covered / ([0-9]+) selected.*#\1 \2#p' "$report" | head -1)"
covered="${links%% *}"
selected="${links##* }"
rm -f "$report"

if [ -z "$links" ] || [ "$covered" -lt 1 ] || [ "$covered" != "$selected" ]; then
  echo "Contract tests: the stateful phase covered ${covered:-no} of ${selected:-?} API links." >&2
  echo "Those chains are what prove the authenticated operations are reached, so this counts as a" >&2
  echo "failure even though every check passed." >&2
  exit 1
fi

echo "Contract tests: $covered of $selected API links covered by the stateful phase."
