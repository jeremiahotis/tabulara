# Test Framework Setup (Playwright)

## Setup

1. Install dependencies:
   - `npm install`
2. Copy environment template:
   - `cp .env.example .env`
3. Adjust values for your local environment (`BASE_URL`, `API_URL`).

## Run Tests

- E2E headless: `npm run test:e2e`
- E2E headed: `npm run test:e2e:headed`
- E2E debug: `npm run test:e2e:debug`
- E2E P0 only: `npm run test:e2e:p0`
- E2E P0 + P1: `npm run test:e2e:p1`
- API suite: `npm run test:api`
- API P0 only: `npm run test:api:p0`
- API P0 + P1: `npm run test:api:p1`

## Architecture Overview

- `tests/e2e/`: End-to-end specifications
- `tests/api/`: API/service-layer specifications
- `tests/support/fixtures/`: Merged fixtures and data factories
- `tests/support/helpers/`: API/network/auth helpers
- `tests/support/page-objects/`: Optional page object wrappers

## Best Practices

- Use `data-testid` selectors only for stable assertions.
- Keep tests isolated with factory-generated data.
- Route/intercept network traffic before triggering UI actions.
- Prefer API-driven setup over UI setup.
- Keep cleanup deterministic using fixture-owned lifecycle.

## CI Integration Notes

- Playwright config emits:
  - console list reporter
  - HTML report (`test-results/html-report`)
  - JUnit report (`test-results/junit.xml`)
- Artifacts use retain-on-failure policy for trace, screenshot, and video.

## Knowledge Base References Applied

- `_bmad/tea/testarch/knowledge/overview.md`
- `_bmad/tea/testarch/knowledge/fixtures-composition.md`
- `_bmad/tea/testarch/knowledge/auth-session.md`
- `_bmad/tea/testarch/knowledge/api-request.md`
- `_bmad/tea/testarch/knowledge/burn-in.md`
- `_bmad/tea/testarch/knowledge/network-error-monitor.md`
- `_bmad/tea/testarch/knowledge/data-factories.md`

## Troubleshooting

- If Playwright browsers are missing: run `npx playwright install`.
- If environment URLs are unreachable, confirm local service ports and `.env` values.
- If tests hang, check route/intercept patterns and remove accidental real-network dependencies.
