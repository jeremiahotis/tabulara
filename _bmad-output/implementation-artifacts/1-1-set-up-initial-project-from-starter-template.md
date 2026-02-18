# Story 1.1: Set Up Initial Project from Starter Template

Status: done

## Story

As an operations user,
I want the desktop app and local API to initialize reliably,
so that I can start processing documents in a secure offline environment.

## Acceptance Criteria

1.
**Given** a clean repository,
**When** the project is scaffolded from `create-tauri-app` (React + TypeScript), dependencies are installed, baseline local configuration is committed, and it is launched in development mode,
**Then** the desktop shell starts successfully with frontend and local backend process health checks passing,
**And** a versioned `/api/v1` route group is available for command-based mutation endpoints.

2.
**Given** a command payload entering the dispatcher,
**When** required envelope fields are missing (`command_id`, `type`, `actor`, `timestamp`, `payload`),
**Then** the command is rejected with deterministic machine-readable error codes,
**And** no domain state mutation or event append occurs.

## Tasks / Subtasks

- [x] Scaffold desktop and API foundation from starter template (AC: 1)
- [x] Implement command envelope validation and deterministic error responses (AC: 2)
- [x] Add automated checks for startup health and invalid command envelope rejection (AC: 1, 2)

## Dev Notes

- Keep command mutation routing under `/api/v1` and avoid direct mutation outside command handlers.
- Enforce deterministic error payload shape for missing envelope fields.
- Preserve offline/local-first assumptions from architecture constraints.

### Project Structure Notes

- Create or update files in established Tauri + React + TypeScript structure.
- Keep mutation entrypoints versioned and centralized.

### References

- /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/epics.md
- /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/architecture.md

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References
- 2026-02-18: RED phase confirmed with `npm run test:api -- --grep "Story 1.1 API automation coverage"` (all Story 1.1 API automation tests failed with 502 before implementation).
- 2026-02-18: GREEN/regression checks passed with `npm run test:api` and `npm run test:e2e`.
- 2026-02-18: Review remediation checks passed with `npx playwright test tests/api/story-1-1-initial-project.automation.spec.ts --project=api` and `npx playwright test tests/e2e/story-1-1-initial-project.automation.spec.ts --project=chromium-e2e`.
- 2026-02-18: Full regression reruns passed with `npm run test:api`, `npm run test:e2e`, and `npm run build:web`.

### Completion Notes List
- Replaced legacy static shell with a Vite React + TypeScript scaffold (`index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles.css`, `vite.config.ts`, TypeScript configs) to align with starter-template requirements.
- Split runtime into a local API process and React frontend process; `/api/v1/commands/dispatch` now routes through `scripts/command-dispatcher.mjs` instead of inline handler logic.
- Implemented frontend process health probing in `/api/v1/health` by checking frontend reachability from API runtime and preserving deterministic response structure.
- Hardened Playwright startup with dedicated app/api ports and stable webServer env configuration; kept Story 1.1 automation coverage passing.
- Resolved git/story drift by updating story documentation to match actual changed files and removing transient review artifacts from git status.

### File List
- .gitignore
- package.json
- package-lock.json
- playwright.config.ts
- vite.config.ts
- tsconfig.json
- tsconfig.app.json
- tsconfig.node.json
- index.html
- src/
- src/main.tsx
- src/App.tsx
- src/styles.css
- scripts/dev-server.mjs
- scripts/local-api-server.mjs
- scripts/command-dispatcher.mjs
- src-tauri/tauri.conf.json
- tests/api/story-1-1-initial-project.automation.spec.ts
- web/index.html (removed)
- web/app.js (removed)
- _bmad-output/implementation-artifacts/1-1-set-up-initial-project-from-starter-template.md
- _bmad-output/implementation-artifacts/sprint-status.yaml

### Change Log
- 2026-02-18: Completed Story 1.1 implementation for starter runtime bootstrap, `/api/v1` health and command dispatch endpoints, deterministic envelope validation, and automation coverage enablement.
- 2026-02-18: Completed code-review remediation for Story 1.1 (React+TS scaffold migration, dispatcher extraction, real frontend/backend startup health checks, Playwright reproducibility hardening, and story/git sync).

### Senior Developer Review (AI)
- 2026-02-18: Resolved all six high/medium review findings and closed git/story discrepancies.
- Outcome: Approved. Story moved to `done`.
