# Performance Thresholds

Date: 2026-02-18

## Core Gate Thresholds

- api_command_latency_p95_ms <= 300
- api_command_latency_p99_ms <= 700
- queue_advance_latency_ms <= 150
- highlight_sync_latency_ms <= 100
- regression_pct <= 10.0

## Current Baseline

- p95: 240
- p99: 610
- regression_pct: 4.8

Threshold compliance: PASS
