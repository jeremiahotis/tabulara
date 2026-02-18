---
stepsCompleted:
  - 1
  - 2
  - 3
  - 4
  - 5
  - 6
  - 7
  - 8
inputDocuments:
  - /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/tabulara-prd-command-event-model.md
  - /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/ux-design-specification.md
  - /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/tabulara-state-transition-invariant-spec.md
  - /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/tabulara-command-dispatcher-guard-layer-tech-design.md
  - /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/tabulara-command-type-catalog.md
  - /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/tabulara-full-system-architecture.md
workflowType: 'architecture'
canonical: true
lastStep: 8
status: 'complete'
completedAt: '2026-02-18'
project_name: 'Tabulara'
user_name: 'Jeremiah'
date: '2026-02-18'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
Tabulara requires a strict command-event architecture where all backend mutation occurs through typed commands and every accepted command emits immutable append-only events. Session lock boundaries must reject all mutating commands deterministically. The platform must support full lifecycle command groups across session lifecycle, import/preprocess, extraction, mapping, anchors/learning, review, validation, and export. Correction sessions must replay base session events and apply only new deltas, preserving immutable prior history. Command handling must be atomic and ordered through validation, state mutation, event append, review-task updates, and validation triggers.

**Non-Functional Requirements:**
The system must be deterministic (equivalent state from identical replay), auditable (state-to-event causal trace), secure at rest (encrypted local vault), and responsive enough for workstation-grade interaction loops. UX-imposed NFRs add keyboard-first operation, continuous provenance visibility, deterministic navigation/recovery, and non-blocking background operations. Accessibility requirements include WCAG AA plus operational guarantees (no keyboard traps, stable focus behavior, explicit non-color-only state signaling).

**Scale & Complexity:**
Tabulara is a high-complexity local desktop platform combining document processing, structured data mapping, command-sourced auditability, and immutable lifecycle control.

- Primary domain: Desktop full-stack data processing platform
- Complexity level: High
- Estimated architectural components: 14-18 major components (UI workflow shell, queue orchestration, evidence viewer, command API, dispatcher/guards, handlers, transition policy, validation engine, extraction adapters, preprocessing pipeline, SQLCipher repository, blob store, backup/recovery service, export subsystem, telemetry/audit readers)

### Technical Constraints & Dependencies

- Fully offline operation; no runtime network dependency
- Deterministic processing expectations for replay and user trust
- Tauri desktop shell with local API service
- SQLCipher-backed encrypted SQLite vault and encrypted blob storage
- OCR/HTR and image preprocessing libraries running locally on CPU-class office laptops
- Optional OS keychain integration for unlock ergonomics
- Session lock immutability and correction-session model are hard constraints, not optional features

### Cross-Cutting Concerns Identified

- Command dispatcher and guard-layer enforcement for every mutation path
- Event append integrity, idempotency, and replay correctness
- Lifecycle transition invariants and lock-state corruption prevention
- Provenance linkage between structured values and document evidence
- Review-task orchestration + incremental validation + final export gate
- Deterministic reprocessing without invalidating confirmed work
- Retention/purge with tombstone continuity
- Backup, integrity-check, and partial recovery behavior
- Performance and responsiveness for verification-loop interaction latency

## Starter Template Evaluation

### Primary Technology Domain
Desktop full-stack (Tauri + Rust backend + React SPA frontend)

### Starter Options Considered

1. Tauri official starter (`create-tauri-app`)
- Pros: official path, maintained templates for React/Svelte, Rust + desktop packaging pre-wired.
- Fit: strongest for local-first encrypted desktop architecture and Rust command-event core.

2. Manual Vite + Tauri CLI init
- Pros: maximum control over frontend setup and migration from existing frontend.
- Fit: good fallback if custom bootstrapping is required, with slightly more setup overhead.

3. Electron Forge (Vite template)
- Pros: mature ecosystem.
- Fit: weaker for Tabulara because architecture is already aligned to Tauri + Rust.

4. Wails
- Pros: valid desktop framework (Go-based).
- Fit: conflicts with chosen Rust/Tauri direction.

### Selected Starter: Tauri official `create-tauri-app` (React + TypeScript)

**Rationale for Selection:**
Aligned with locked architecture decisions (Tauri desktop + Rust local API + React UI), minimizes setup risk, and preserves focus on command-event core implementation.

**Initialization Command:**

```bash
npm create tauri-app@latest
```

Recommended choices during setup:
- Frontend: React
- Frontend language: TypeScript
- Package manager: pnpm (or npm)

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
Rust backend + TypeScript frontend.

**Styling Solution:**
No mandatory design system. Apply locked Tabulara design baseline (MUI foundation + token system + typography override).

**Build Tooling:**
Tauri CLI with Vite-based frontend workflow.

**Testing Framework:**
Starter does not enforce Tabulara domain tests; add invariant/command/replay test suites as architecture follow-on.

**Code Organization:**
Natural separation between frontend application and `src-tauri` backend.

**Development Experience:**
Pre-wired desktop dev loop and packaging pathway.

**Note:** Project initialization using this command should be the first implementation story.


## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
1. Local desktop runtime: Tauri + Rust backend + React frontend.
2. Command-only mutation model with append-only event audit.
3. Encrypted persistence: SQLCipher-backed SQLite + encrypted blob storage.
4. Session lifecycle enforcement with lock immutability and correction replay.
5. Verification-first UX architecture with deterministic navigation/provenance.

**Important Decisions (Shape Architecture):**
1. Frontend state split (server state vs workspace interaction state).
2. Validation orchestration model (incremental + final gate).
3. Reprocessing semantics preserving confirmed decisions.
4. Backup/recovery and retention purge implementation boundaries.
5. Packaging/signing and local update strategy.

**Deferred Decisions (Post-MVP):**
1. Advanced observability dashboards (beyond audit/query basics).
2. Plugin ecosystem for alternate OCR engines.
3. Optional future cloud sync/export relay.

### Data Architecture

1. Primary store: SQLCipher (SQLite encrypted) as system of record.
2. Blob model: encrypted blob table for originals, processed derivatives, exports, reports.
3. Access pattern: repository layer only; direct writes outside command handlers prohibited.
4. Migration strategy: versioned forward-only SQL migrations with startup integrity checks.
5. Validation data flow: field-level + cross-field + dataset-level validators, with explicit override records.
6. Caching: in-memory transient caches only; no persistent cache outside vault data model.

### Authentication & Security

1. Vault access: password-derived key (Argon2id) with AES-256-GCM protected content.
2. Optional keychain integration for local unlock ergonomics (user-controlled).
3. Local API boundary: loopback-only (`127.0.0.1`) service with session-bound auth context.
4. Lock semantics: locked session rejects all mutating commands at guard layer.
5. Security posture: protect at-rest theft scenarios; explicitly document unlocked-host limitations.

### API & Communication Patterns

1. API style: localhost REST transport (`/api/v1`) mapped to domain commands.
2. Command/event contract: typed envelope, idempotent command IDs, append-only events.
3. Error handling: deterministic machine-readable error codes for guard/precondition failures.
4. Processing model: atomic per-command transaction (state + events + derived task updates).
5. Internal communication: UI -> REST transport -> dispatcher -> guard chain -> handler -> event append.

### Frontend Architecture

1. Frontend framework: React 19.2 line.
2. UI base system: MUI v7 line with custom verification components for core workflow surfaces.
3. State model:
- Server/state sync: query client pattern for API-backed resources.
- Workspace interaction state: local deterministic state machine for queue/focus/provenance rhythm.
4. Routing: workspace-oriented route groups (vault/project/session/editor/admin).
5. Performance model: virtualized queue surfaces, non-blocking background processing indicators, strict keyboard-first interaction contract.

### Infrastructure & Deployment

1. Packaging: per-OS Tauri bundles (desktop-only launch strategy).
2. Build pipeline: reproducible Rust + frontend builds, artifact hashing, signed bundles per OS.
3. Environment model: fully offline runtime; configuration in local project/vault settings.
4. Backup model: rolling vault backups + open-time integrity verification.
5. Recovery model: salvage readable records even when blob subsets are damaged.

### Decision Impact Analysis

**Implementation Sequence:**
1. Vault/security foundation -> 2) command dispatcher/guards -> 3) schema/storage/migrations -> 4) import/preprocess/extract -> 5) mapping/review/validation -> 6) export/lock/correction -> 7) retention/recovery hardening.

**Cross-Component Dependencies:**
1. Guard/transition policies constrain all UI mutation actions.
2. Provenance UX depends on token/line/table extraction and stable source references.
3. Validation rail and export gate depend on consistent review-task and override persistence.
4. Correction sessions depend on strict event append integrity and deterministic replay.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
14 areas where AI agents could make incompatible decisions if patterns are not explicit.

### Naming Patterns

**Database Naming Conventions:**
- Tables: `snake_case`, plural (`review_tasks`, `field_values`)
- Columns: `snake_case` (`session_id`, `created_at`)
- PK/FK: `id` primary, `{entity}_id` foreign keys
- Index names: `idx_{table}_{column_list}`

**API Naming Conventions:**
- Routes: lowercase plural resources (`/sessions/:id/review-tasks`)
- JSON keys: `snake_case` for API payloads and event/command DTO parity
- Path params: `:id` style in route definitions
- Query params: `snake_case` (`field_key`, `status`)

**Code Naming Conventions:**
- Rust types/traits/enums: `PascalCase`
- Rust functions/modules/files: `snake_case`
- React components: `PascalCase`
- React hooks/utilities: `camelCase` exports, filename style locked via repo lint config

### Structure Patterns

**Project Organization:**
- `src-tauri/` contains command dispatcher, guards, handlers, repositories, transition policy
- `src/` contains UI shell, queue/evidence/actions, state, API client, design tokens
- Domain code grouped by bounded capability (`sessions`, `mapping`, `validation`, `export`)

**File Structure Patterns:**
- Backend integration tests under backend test tree; frontend interaction tests under frontend test tree
- Shared command/event contracts in one canonical module; no duplicate schemas
- Migration files ordered, immutable, forward-only

### Format Patterns

**API Response Formats:**
- Success envelope: `{ "ok": true, "data": ..., "meta": { "command_id": "...", "event_ids": [...] } }`
- Error envelope: `{ "ok": false, "error": { "code": "...", "message": "...", "details": {...} } }`
- Lock rejection uses deterministic `code` values (`SESSION_LOCKED`, `INVALID_TRANSITION`)

**Data Exchange Formats:**
- Timestamps: ISO-8601 UTC
- IDs: UUIDv7 (or UUIDv4 fallback)
- Confidence values: normalized float `0..1`
- Nullability explicit; no sentinel strings

### Communication Patterns

**Event System Patterns:**
- Event types: `PascalCase` domain events (`FieldValueAssigned`)
- Command types: `PascalCase` intents (`AssignFieldValue`)
- Event payload includes `caused_by` correlation and immutable data snapshot
- Event version field required (`event_version`)

**State Management Patterns:**
- UI never mutates authoritative state directly; mutating calls dispatch backend command routes
- Optimistic updates only when reversible and provenance-safe
- Queue position and focus are deterministic anchors preserved across updates

### Process Patterns

**Error Handling Patterns:**
- Guard failures return structured errors and machine-stable codes
- Validation errors include `cause`, `location`, and `resolution_hint`
- Overrides persist reason and exception marker in UI and reports

**Loading State Patterns:**
- Background processing remains non-blocking
- Long tasks expose scoped progress labels (`Reprocessing 3 pages`)
- No silent transitions that alter queue order/focus without explicit action

### Enforcement Guidelines

**All AI Agents MUST:**
- Route every mutation through command dispatcher + guard chain
- Preserve lock immutability and transition invariants
- Emit append-only events for every accepted mutation
- Preserve queue/focus/provenance deterministic behavior
- Respect DTO/envelope contract shapes exactly

**Pattern Enforcement:**
- CI checks: lint + contract tests + transition matrix + replay determinism tests
- PR template requires “Pattern deviations” section (empty or justified)
- Any deviation requires ADR note and explicit approval

### Pattern Examples

**Good Examples:**
- `POST /api/v1/item-values` -> command -> event -> deterministic response envelope
- Reprocess updates unresolved artifacts while preserving locked/confirmed decisions
- Validation override writes exception marker and reason to persistent results

**Anti-Patterns:**
- Direct DB writes in REST handlers bypassing command dispatcher
- Mixed key styles across API and event contracts
- Reordering queue after background updates without preserving user anchor
- Mutating locked session entities via bypass paths

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
tabulara/
├── README.md
├── AGENTS.md
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
├── .gitignore
├── .editorconfig
├── .env.example
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── backend-tests.yml
│       └── frontend-tests.yml
├── docs/
│   ├── architecture/
│   ├── decisions/
│   └── operations/
├── src/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── vault/
│   │   │   ├── projects/
│   │   │   ├── sessions/
│   │   │   └── settings/
│   │   └── AppShell.tsx
│   ├── features/
│   │   ├── queue/
│   │   ├── evidence/
│   │   ├── mapping/
│   │   ├── validation/
│   │   ├── exports/
│   │   └── corrections/
│   ├── components/
│   │   ├── common/
│   │   ├── layout/
│   │   └── provenance/
│   ├── state/
│   │   ├── workspace/
│   │   └── selectors/
│   ├── api/
│   │   ├── client/
│   │   ├── dtos/
│   │   └── endpoints/
│   ├── design/
│   │   ├── tokens/
│   │   ├── typography/
│   │   └── mui-theme/
│   ├── hooks/
│   └── utils/
├── src-tauri/
│   ├── Cargo.toml
│   ├── src/
│   │   ├── main.rs
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   └── responses.rs
│   │   ├── command_bus/
│   │   │   ├── dispatcher.rs
│   │   │   ├── guard_chain.rs
│   │   │   ├── idempotency.rs
│   │   │   └── transition_policy.rs
│   │   ├── commands/
│   │   ├── events/
│   │   ├── handlers/
│   │   ├── domain/
│   │   │   ├── sessions/
│   │   │   ├── extraction/
│   │   │   ├── mapping/
│   │   │   ├── validation/
│   │   │   └── export/
│   │   ├── repositories/
│   │   ├── services/
│   │   │   ├── ocr/
│   │   │   ├── preprocess/
│   │   │   ├── backup/
│   │   │   └── recovery/
│   │   ├── db/
│   │   │   ├── migrations/
│   │   │   ├── sql/
│   │   │   └── connection.rs
│   │   ├── security/
│   │   │   ├── crypto.rs
│   │   │   ├── keychain.rs
│   │   │   └── vault_lock.rs
│   │   └── telemetry/
│   └── tauri.conf.json
├── tests/
│   ├── backend/
│   │   ├── commands/
│   │   ├── transitions/
│   │   ├── replay/
│   │   └── integration/
│   ├── frontend/
│   │   ├── queue-flow/
│   │   ├── provenance/
│   │   └── accessibility/
│   ├── e2e/
│   └── fixtures/
└── scripts/
    ├── bootstrap.sh
    ├── verify-contracts.sh
    └── package-release.sh
```

### Architectural Boundaries

**API Boundaries:**
- Frontend only calls `/api/v1` local endpoints.
- Mutating endpoints map 1:1 to command handlers.
- Read endpoints never bypass lock semantics for mutable operations.

**Component Boundaries:**
- UI features own presentation and interaction state only.
- Domain mutations flow through backend command bus.
- Provenance and queue orchestration are shared cross-feature contracts.

**Service Boundaries:**
- OCR/preprocess/validation/export are backend services behind domain handlers.
- Backup/recovery are operational services isolated from request-time mutation logic.

**Data Boundaries:**
- SQLCipher is authoritative state store.
- Blobs are accessed through repository APIs only.
- Event log append path is isolated and immutable.

### Requirements to Structure Mapping

**Feature Mapping:**
- Session lifecycle: `src-tauri/src/domain/sessions`, `src/features/queue`
- Import/preprocess/extract: `src-tauri/src/services/{preprocess,ocr}`, `src/features/evidence`
- Mapping/review/validation: `src-tauri/src/domain/{mapping,validation}`, `src/features/{mapping,validation,queue}`
- Export/correction: `src-tauri/src/domain/export`, `src/features/{exports,corrections}`

**Cross-Cutting Concerns:**
- Security: `src-tauri/src/security`
- Command/event contracts: `src-tauri/src/{commands,events,command_bus}`
- Design system/tokens/typography: `src/design`

### Integration Points

**Internal Communication:**
- UI -> API client -> REST route -> dispatcher -> guard chain -> handler -> repositories/event append

**External Integrations:**
- OCR/HTR runtime assets, OpenCV preprocessing libs, OS keychain APIs

**Data Flow:**
- Import -> preprocess -> extract -> map -> review -> validate -> export -> lock -> correction replay/deltas

### File Organization Patterns

**Configuration Files:**
- Root-level build/dev config; backend-specific config in `src-tauri/`.

**Source Organization:**
- Feature-sliced UI and capability-bounded backend domains.

**Test Organization:**
- Contract/invariant tests in backend tree; flow/accessibility tests in frontend/e2e trees.

**Asset Organization:**
- UI assets under frontend; heavy processing artifacts in encrypted vault blobs only.

### Development Workflow Integration

**Development Server Structure:**
- Frontend dev server + Tauri runtime for local integration loop.

**Build Process Structure:**
- Deterministic frontend build + Rust build + signed bundle assembly.

**Deployment Structure:**
- Single OS-specific desktop bundle with local-only runtime dependencies.

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:**
All primary decisions are mutually compatible: Tauri desktop runtime, Rust command-event backend, React/MUI frontend, SQLCipher encrypted vault, and local-only operational model.

**Pattern Consistency:**
Implementation patterns align with architecture goals: command-only mutation, deterministic lock/transition behavior, standardized envelope contracts, and strict naming/structure conventions.

**Structure Alignment:**
The project structure supports selected boundaries across UI, local API transport, command bus/guards, domain handlers, repositories, security, and operational services.

### Requirements Coverage Validation

**Epic/Feature Coverage:**
All defined capabilities are represented structurally: session lifecycle, import/preprocess/extract, mapping/review/validation, export/lock/corrections, retention/recovery.

**Functional Requirements Coverage:**
All FR categories from the command-event PRD are covered by dispatcher/guard/event append patterns, lock enforcement, correction replay strategy, and atomic processing model.

**Non-Functional Requirements Coverage:**
NFRs are covered for determinism, auditability, security-at-rest, responsiveness, keyboard-first UX constraints, and operational accessibility requirements.

### Implementation Readiness Validation

**Decision Completeness:**
Critical decisions are documented with rationale and current-version context.

**Structure Completeness:**
Directory tree, boundaries, and integration flow are concrete enough for parallel implementation.

**Pattern Completeness:**
Conflict-prone areas (naming, response contracts, state/process behavior, mutation boundaries) are specified with enforceable rules and anti-patterns.

### Gap Analysis Results

**Critical Gaps:**
None identified.

**Important Gaps:**
1. Contract test harness specification in CI should be formalized as an implementation artifact.
2. OS-specific release signing/notarization procedure should be documented.

**Nice-to-Have Gaps:**
1. Expanded sequence diagrams for `ReRunExtraction`, `ExportSession`, and `CreateCorrectionSession`.
2. Operational runbook snippets for vault corruption triage and recovery paths.

### Validation Issues Addressed

1. Removed duplicate workflow content and normalized progression in this architecture artifact.
2. Confirmed lock immutability, deterministic replay, and queue/provenance UX constraints are preserved.
3. Confirmed project structure maps to the command dispatcher + guard-layer model.

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**
- [x] Critical decisions documented
- [x] Technology stack specified
- [x] Integration patterns defined
- [x] Trust/performance constraints addressed

**Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**
- [x] Directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements-to-structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
1. Deterministic command-event foundation
2. Explicit immutability and correction semantics
3. UX trust and performance constraints are concrete
4. Project structure supports multi-agent consistency

**Areas for Future Enhancement:**
1. CI contract verification blueprint
2. Release-signing operations guide
3. Additional sequence-level operational diagrams

### Implementation Handoff

**AI Agent Guidelines:**
- Follow architectural decisions exactly.
- Route all mutations through dispatcher + guards.
- Enforce lock/transition invariants and append-only events.
- Preserve deterministic queue/focus/provenance behavior.
- Conform to naming/format/structure patterns.

**First Implementation Priority:**
Initialize with `create-tauri-app` (React + TypeScript) and scaffold command bus, guard chain, transition policy, and SQLCipher migration baseline.
