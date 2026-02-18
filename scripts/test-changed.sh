#!/usr/bin/env bash

set -euo pipefail

BASE_BRANCH="${BASE_BRANCH:-origin/main}"
TEST_REGEX="${TEST_REGEX:-\\.(spec|test)\\.(ts|tsx|js|jsx)$}"
DEFAULT_COMMAND="${DEFAULT_COMMAND:-npm run test:e2e}"

if ! git rev-parse --verify "$BASE_BRANCH" >/dev/null 2>&1; then
  echo "Base branch '$BASE_BRANCH' not found locally. Fetching remotes..."
  git fetch --quiet origin main || true
fi

CHANGED_TESTS="$(git diff --name-only "$BASE_BRANCH"...HEAD | rg "$TEST_REGEX" || true)"

if [[ -z "$CHANGED_TESTS" ]]; then
  echo "No changed test files. Running default test command."
  bash -lc "$DEFAULT_COMMAND"
  exit 0
fi

echo "Changed test files:"
echo "$CHANGED_TESTS" | sed 's/^/ - /'

# shellcheck disable=SC2086
npm run test:e2e -- $CHANGED_TESTS
