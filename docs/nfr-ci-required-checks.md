# NFR CI Required Check

This repository enforces the NFR quality gate on pull requests to `main`.

Required status check:
- `NFR Evidence Pipeline / Enforce NFR Evidence Gate`

Expected flow:
1. Open a pull request to `main`.
2. Let `NFR Evidence Pipeline` complete.
3. Merge only after the required check is green.

Direct pushes to `main` bypass protection and should be avoided.
