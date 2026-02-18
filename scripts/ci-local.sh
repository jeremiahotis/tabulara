#!/usr/bin/env bash

set -euo pipefail

TOTAL_SHARDS="${TOTAL_SHARDS:-4}"
RUN_BURN_IN="${RUN_BURN_IN:-false}"
BURN_IN_ITERATIONS="${BURN_IN_ITERATIONS:-10}"

echo "Running local CI parity checks"
echo " - Shards: ${TOTAL_SHARDS}"
echo " - Burn-in: ${RUN_BURN_IN}"

npm run lint --if-present

for shard in $(seq 1 "$TOTAL_SHARDS"); do
  echo "Executing shard ${shard}/${TOTAL_SHARDS}"
  CI=true npm run test:e2e -- --shard="${shard}/${TOTAL_SHARDS}"
done

if [[ "$RUN_BURN_IN" == "true" ]]; then
  TEST_COMMAND="CI=true npm run test:e2e" scripts/burn-in.sh "$BURN_IN_ITERATIONS"
fi

echo "Local CI parity checks completed successfully."
