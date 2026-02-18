#!/usr/bin/env bash

set -euo pipefail

ITERATIONS="${1:-10}"
TEST_COMMAND="${TEST_COMMAND:-npm run test:e2e}"

if ! [[ "$ITERATIONS" =~ ^[0-9]+$ ]] || [[ "$ITERATIONS" -lt 1 ]]; then
  echo "ITERATIONS must be a positive integer."
  exit 1
fi

echo "Starting burn-in loop: ${ITERATIONS} iteration(s)"
for i in $(seq 1 "$ITERATIONS"); do
  echo "Burn-in iteration ${i}/${ITERATIONS}"
  bash -lc "$TEST_COMMAND" || exit 1
done
echo "Burn-in passed: ${ITERATIONS}/${ITERATIONS}"
