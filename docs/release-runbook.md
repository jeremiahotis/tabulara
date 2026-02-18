# Release Runbook

## Required Checks on `main`
- `NFR Evidence Pipeline / Collect Raw NFR Evidence`
- `NFR Evidence Pipeline / Enforce NFR Evidence Gate`

## Standard Merge Flow
1. Create a feature branch from `main`.
2. Open a PR to `main`.
3. Wait for required checks to pass.
4. Merge PR (no direct pushes to `main`).

## Release Tag Flow
1. Ensure `main` is green and up to date.
2. Create annotated tag (example: `v0.1.0`).
3. Push tag to origin.
4. Verify `Main Release` workflow completes successfully.
5. Verify uploaded artifacts for the run:
   - `raw-nfr-evidence`
   - `normalized-nfr-evidence`

## Artifact Retention
- Workflow requests longer retention for tag builds.
- Effective retention is capped by repository settings.
- For this public repo, the cap is 90 days.

## Validation Checklist
- Required checks are still configured in branch protection.
- Tag-triggered run is green.
- Artifacts exist and have expected `expires_at` values.
