# Story 1.1: Set Up Initial Project from Starter Template

Status: ready-for-dev

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

- [ ] Scaffold desktop and API foundation from starter template (AC: 1)
- [ ] Implement command envelope validation and deterministic error responses (AC: 2)
- [ ] Add automated checks for startup health and invalid command envelope rejection (AC: 1, 2)

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

### Completion Notes List

### File List
