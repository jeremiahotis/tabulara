# CI Secrets Checklist

Use this checklist before enabling required branch protections for the test pipeline.

## Required Secrets

- [ ] None required for baseline test execution

## Optional Secrets

- [ ] `CI_SLACK_WEBHOOK` (enables Slack notification on pipeline failure)

## Verification Steps

1. Open repository settings in GitHub.
2. Navigate to `Secrets and variables` -> `Actions`.
3. Add optional secrets if notification integrations are needed.
4. Re-run workflow and verify notification behavior.

## Security Notes

- Never store secrets in workflow YAML files.
- Rotate webhook tokens when team members or channels change.
- Keep notification payloads free of sensitive test data.
