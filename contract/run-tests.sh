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
# Schemathesis exits non-zero when a check fails, which covers wrong answers. It does not cover
# coverage going quiet: if authentication stopped working for real, the stateful phase would still
# report "passed" while chaining nothing at all. So the run must also have exercised every API link
# it found, because those chains are the authenticated ones (docs/testing.md#contract-tests).
covered_all_links() {
  local links covered selected
  links="$(sed -nE 's#.*API Links:[[:space:]]+([0-9]+) covered / ([0-9]+) selected.*#\1 \2#p' "$1" | head -1)"
  [ -n "$links" ] || return 1
  covered="${links%% *}"
  selected="${links##* }"
  [ "$covered" -ge 1 ] && [ "$covered" = "$selected" ]
}

# Four lines of shell deciding whether a run counted is not worth trusting unchecked, and these
# cases cost milliseconds. They run before the suite, so a broken guard fails here rather than
# waving a broken run through later.
check_the_guard() {
  local tmp
  tmp="$(mktemp)"
  printf '     API Links:    6 covered / 6 selected / 6 total (6 inferred)\n' > "$tmp"
  if ! covered_all_links "$tmp"; then echo "The link guard rejects a healthy run." >&2; return 1; fi
  printf '     API Links:    0 covered / 6 selected / 6 total\n' > "$tmp"
  if covered_all_links "$tmp"; then echo "The link guard accepts a run that chained nothing." >&2; return 1; fi
  printf '     API Links:    3 covered / 6 selected / 6 total\n' > "$tmp"
  if covered_all_links "$tmp"; then echo "The link guard accepts half the links." >&2; return 1; fi
  printf 'a run with no stateful phase at all\n' > "$tmp"
  if covered_all_links "$tmp"; then echo "The link guard accepts a run with no stateful phase." >&2; return 1; fi
  rm -f "$tmp"
  echo "Contract tests: the link guard passes its four cases."
}

check_the_guard

"${compose[@]}" run --rm hurl

report="$(mktemp)"
set -o pipefail
"${compose[@]}" run --rm schemathesis 2>&1 | tee "$report"

if ! covered_all_links "$report"; then
  echo "Contract tests: the stateful phase did not cover every API link it selected." >&2
  echo "Those chains are what prove the authenticated operations are reached, so this counts as a" >&2
  echo "failure even though every check passed." >&2
  rm -f "$report"
  exit 1
fi

echo "Contract tests: $(sed -nE 's#.*API Links:[[:space:]]+([0-9]+ covered / [0-9]+ selected).*#\1#p' "$report" | head -1) by the stateful phase."
rm -f "$report"
