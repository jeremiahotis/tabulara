# Test Framework Setup (Playwright)

## Setup

1. Install dependencies:
   - `npm install`
2. Copy environment template:
   - `cp .env.example .env`
3. Adjust values for your local environment (`BASE_URL`, `API_URL`).

## Run Tests

- Headless: `npm run test:e2e`
- Headed: `npm run test:e2e:headed`
- Debug: `npm run test:e2e:debug`

## Architecture Overview

- `tests/e2e/`: End-to-end specifications
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
