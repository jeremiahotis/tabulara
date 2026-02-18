# Security AuthZ Negative Report

Date: 2026-02-18
Scope: Lock and authorization abuse-path checks
Result: PASS

## Checks

- Locked session mutation attempt -> `409` with `SESSION_LOCKED`
- Unauthorized mutation attempt -> rejected with deterministic auth error code
- Transition violation mutation attempt -> rejected with deterministic transition error code

## Summary

All critical authz-negative checks passed for gate criteria.
