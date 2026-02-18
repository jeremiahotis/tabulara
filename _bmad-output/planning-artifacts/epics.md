---
stepsCompleted:
  - 1
  - 2
  - 3
  - 4
inputDocuments:
  - /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/tabulara-prd-command-event-model.md
  - /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/architecture.md
  - /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/tabulara-full-system-architecture.md
  - /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/ux-design-specification.md
  - /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/tabulara-command-dispatcher-guard-layer-tech-design.md
---

# Tabulara - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Tabulara, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Backend MUST mutate state only through command handlers; every accepted command MUST produce one or more events; commands MUST include `command_id`, `type`, `actor`, `timestamp`, `payload`; `command_id` MUST be unique and traceable to generated events.

FR2: Events MUST include `event_id`, `caused_by`, `type`, `timestamp`, `data`; events MUST be append-only and immutable after write; events MUST be stored in `audit_log.event_json`; `caused_by` MUST reference a valid command identifier.

FR3: If session state is `locked`, backend MUST reject all mutating commands with deterministic error payloads; read-only commands/queries MAY continue.

FR4: Backend MUST support required command groups and mapped events across session lifecycle, import/preprocess, extraction, mapping (field/item/extra-table), anchors/learning, review, validation, and export/immutability operations.

FR5: Correction sessions MUST reference `base_session_id`, initialize with `state = replay(base_session_events)`, apply only new commands/events, never edit previous events, and include `base_session_id`, `revision_number`, and `delta_summary` in export metadata.

FR6: Each command MUST execute atomically in order (receive -> precondition/lock validation -> state transaction -> domain writes -> event append -> review-task updates -> optional validation trigger); any failure MUST fully roll back.

### NonFunctional Requirements

NFR1: Determinism - replaying identical event history must reconstruct equivalent state.

NFR2: Integrity - event append must be durable and ordered by timestamp/sequence.

NFR3: Performance - command handling should remain interactive for local desktop use.

NFR4: Auditability - every state mutation must be traceable from state row to causal event chain.

NFR5: Security - command/event data remains within local encrypted vault model.

### Additional Requirements

- Starter template requirement (for Epic 1 / Story 1): initialize with `create-tauri-app` using React + TypeScript and scaffold command dispatcher/guard-chain foundation first.
- Runtime and stack: Tauri desktop container, Rust local backend, React frontend, MUI-based design system with custom verification interaction layer.
- Offline/local-first: no runtime network dependency; localhost API boundary only (`/api/v1`).
- Security at rest: SQLCipher-backed encrypted SQLite vault, Argon2id key derivation, AES-256-GCM, optional OS keychain integration.
- API contract: every mutating REST route maps to exactly one command entry point; no direct DB writes in route handlers.
- Event model: append-only `audit_log` records; immutable event envelopes with `caused_by` linkage; event versioning required.
- Transaction rule: state mutation and event append in one transaction; event append outside transaction is forbidden.
- Guard and error contract: deterministic guard pipeline and stable error codes (`SESSION_LOCKED`, `INVALID_STATE_TRANSITION`, `COMMAND_NOT_ALLOWED_IN_STATE`, `IDEMPOTENCY_CONFLICT`, `PRECONDITION_FAILED`, `INVARIANT_VIOLATION`).
- Idempotency contract: `command_log` with payload hash conflict handling, committed replay response, and stale in-progress reconciliation strategy.
- Concurrency/isolation: `BEGIN IMMEDIATE` (or equivalent) with session-scoped/project-scoped write lock behavior and bounded retry/precondition handling.
- Data/migration policy: repository-only writes, forward-only immutable migrations, startup integrity checks, no persistent cache outside authoritative vault model.
- Lifecycle constraints: lock immutability is mandatory; correction is new-session delta flow only; validated/exported data mutation requires explicit lifecycle regression where defined.
- Reliability operations: rolling backups and partial-recovery capability preserving salvageable records plus forensic continuity metadata.
- UX verification-loop invariants: queue -> evidence -> action flow, no hidden state, persistent provenance visibility, preserved queue position/focus through actions and transitions.
- Accessibility and input: WCAG AA minimum, full keyboard-operable verification loop, no keyboard traps, visible focus, non-color-only state communication, screen-reader semantic announcements for queue and evidence jumps.
- Responsive behavior: desktop-first tri-pane canonical layout; breakpoint changes must preserve interaction order and may not add extra resolution steps.
- Performance targets from UX spec: evidence highlight response <100ms, queue advance <150ms, median queue resolve time <2.5s, keyboard-only completion >=80%, first-pass validation success >=90%.
- Background-processing behavior: heavy processing must remain non-blocking with clear progress scope and continuity of active user context.
- Provenance and validation behavior: every visible value must retain reachable source reference; validation issues must include cause, location, and actionable resolution path.

### FR Coverage Map

FR1: Epics 1-4 - all mutation flows use command handlers with traceable command IDs.

FR2: Epics 1-4 - all accepted commands emit immutable append-only events.

FR3: Epics 3-4 - lock immutability and deterministic mutation rejection.

FR4: Epics 1-4 - command groups are delivered across lifecycle/import/extract, mapping/review/validation, export/lock, and correction capabilities.

FR5: Epic 4 - correction replay with delta-only updates and required revision metadata.

FR6: Epics 1-4 - atomic command execution sequence with full rollback on failure.

## Epic List

### Epic 1: Secure Session Intake and Extraction Readiness
Users can create a secure local session, import documents, preprocess/reprocess them, and run extraction with auditable command-event tracking so work starts from trusted machine-produced outputs.
**FRs covered:** FR1, FR2, FR4, FR6

### Epic 2: Verification, Mapping, and Quality Resolution
Users can verify and correct extracted data in a fast queue-first workflow, map fields/items/extra tables, apply learning rules, and resolve review and validation issues with visible provenance.
**FRs covered:** FR1, FR2, FR4, FR6

### Epic 3: Trusted Export and Immutable Finalization
Users can export a validated dataset with manifest evidence, then lock the session so finalized outputs are immutable and mutation attempts are deterministically rejected.
**FRs covered:** FR1, FR2, FR3, FR4, FR6

### Epic 4: Correction Revisions Without History Rewrite
Users can create correction sessions from locked exports, replay base history deterministically, apply only deltas, and publish a new revision with explicit lineage metadata.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6

## Epic 1: Secure Session Intake and Extraction Readiness

Users can create a secure local session, import documents, preprocess/reprocess them, and run extraction with auditable command-event tracking so work starts from trusted machine-produced outputs.

### Story 1.1: Set Up Initial Project from Starter Template

As an operations user,
I want the desktop app and local API to initialize reliably,
So that I can start processing documents in a secure offline environment.

**FRs implemented:** FR1, FR6

**Acceptance Criteria:**

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

### Story 1.2: Create and Pin Sessions Through Command Handlers

As an operations user,
I want to create and pin sessions through explicit commands,
So that each work session is traceable and operationally organized.

**FRs implemented:** FR1, FR2, FR4, FR6

**Acceptance Criteria:**

1.
**Given** an active project context,
**When** I issue `CreateSession`,
**Then** a new session record is created through command handlers only,
**And** `SessionCreated` is appended to `audit_log` with valid `caused_by` linkage.

2.
**Given** an existing session,
**When** I issue `PinSession` or unpin behavior,
**Then** session pin state updates are persisted atomically,
**And** corresponding events (`SessionPinned`/`SessionUnpinned`) are appended in the same transaction.

### Story 1.3: Import Documents with Duplicate Handling

As an operations user,
I want to import source documents with duplicate detection,
So that I avoid redundant processing and preserve clean audit lineage.

**FRs implemented:** FR1, FR2, FR4, FR6

**Acceptance Criteria:**

1.
**Given** a selected session,
**When** I import one or more PDF/image files,
**Then** document metadata and blob references are persisted through command handlers,
**And** `DocumentImported` events are appended for each accepted import command.

2.
**Given** a detected duplicate candidate,
**When** I confirm duplicate handling,
**Then** duplicate state is persisted and linked to the original import context,
**And** `DuplicateMarked` is appended with deterministic correlation fields.

### Story 1.4: Apply Preprocessing and Controlled Reprocessing

As an operations user,
I want preprocessing and reprocessing to run as explicit commands,
So that image quality improves without hidden or unsafe state changes.

**FRs implemented:** FR1, FR2, FR4, FR6

**Acceptance Criteria:**

1.
**Given** imported documents in a session,
**When** I issue `ApplyPreprocessing`,
**Then** derived artifacts are created and linked to source pages,
**And** `PreprocessingApplied` is appended in the same command transaction.

2.
**Given** already processed documents,
**When** I issue `ReprocessDocument`,
**Then** only permitted lifecycle state changes occur with deterministic transition validation,
**And** `DocumentReprocessed` is appended while preserving existing audit history.

### Story 1.5: Run Extraction and Persist Derived Data Updates

As an operations user,
I want extraction runs to persist structured outputs with full traceability,
So that verification can begin from reproducible machine-generated candidates.

**FRs implemented:** FR1, FR2, FR4, FR6

**Acceptance Criteria:**

1.
**Given** preprocess-ready documents,
**When** `RunExtraction` is executed,
**Then** extraction outputs (tokens/lines/table candidates and derived values) are persisted through transactional handlers,
**And** `ExtractionCompleted` plus required derived-data events are appended with command linkage.

2.
**Given** an extraction failure condition,
**When** the command pipeline encounters an error before completion,
**Then** state and events are rolled back per atomicity rules,
**And** failure outcomes are returned with deterministic error payloads for UI handling.

## Epic 2: Verification, Mapping, and Quality Resolution

Users can verify and correct extracted data in a fast queue-first workflow, map fields/items/extra tables, apply learning rules, and resolve review and validation issues with visible provenance.

### Story 2.1: Verification Queue with Source-Synchronized Focus

As an operations user,
I want queue selection to jump directly to source evidence,
So that I can validate each value quickly without manual searching.

**FRs implemented:** FR4

**Acceptance Criteria:**

1.
**Given** unresolved review items,
**When** I select the next queue item by mouse or keyboard,
**Then** the corresponding source region is focused, highlighted, and centered in the evidence viewport,
**And** queue position and active context remain stable across navigation.

2.
**Given** continuous verification workflow,
**When** I resolve an item,
**Then** the next unresolved item becomes active without blocking dialogs,
**And** the interaction remains keyboard-operable with visible focus and no traps.

### Story 2.2: Assign and Update Field Values with Lock Controls

As an operations user,
I want to assign, update, and lock field values from evidence,
So that critical document fields are captured accurately and protected once confirmed.

**FRs implemented:** FR1, FR2, FR4, FR6

**Acceptance Criteria:**

1.
**Given** an extracted or empty field target,
**When** I issue `AssignFieldValue`,
**Then** field state is written through command handlers and relevant review updates run,
**And** `FieldValueAssigned` (or `FieldValueUpdated`) is appended with valid `caused_by`.

2.
**Given** a confirmed field,
**When** I lock or unlock the field,
**Then** field mutability state changes are enforced consistently,
**And** `FieldLocked`/`FieldUnlocked` events are appended with deterministic behavior.

### Story 2.3: Map Item Rows and Extra Table Values

As an operations user,
I want to maintain itemized and extra table data through commands,
So that structured outputs preserve full tabular detail and provenance.

**FRs implemented:** FR1, FR2, FR4, FR6

**Acceptance Criteria:**

1.
**Given** item/table mapping context,
**When** I add/delete rows and assign values using item/extra-table commands,
**Then** row/value mutations are persisted atomically,
**And** mapped events (`ItemRowAdded`, `ItemRowDeleted`, `ItemValueAssigned`, `ExtraRowAdded`, `ExtraValueAssigned`) are appended.

2.
**Given** row-level lock actions,
**When** I lock item rows for finalized entries,
**Then** subsequent prohibited edits are rejected deterministically,
**And** lock state remains visible and non-color-only in verification surfaces.

### Story 2.4: Capture Anchor and Dictionary Learning Rules

As an operations user,
I want to capture reusable mapping corrections as rules,
So that future sessions become faster and more consistent.

**FRs implemented:** FR1, FR2, FR4, FR6

**Acceptance Criteria:**

1.
**Given** a confirmed mapping correction,
**When** I create or disable anchor/dictionary rules,
**Then** rule state changes persist through command handlers only,
**And** corresponding events (`AnchorRuleCreated`, `AnchorRuleDisabled`, `DictionaryRuleLearned`, `DictionaryRuleDisabled`) are appended.

2.
**Given** subsequent relevant extraction/mapping contexts,
**When** learned rules are applied,
**Then** provenance shows that rule influence explicitly,
**And** users can review and override behavior without hidden state.

### Story 2.5: Resolve Review Tasks and Batch Confirmation

As an operations user,
I want to resolve review tasks individually or in batches,
So that I can clear high-volume queues efficiently while preserving auditability.

**FRs implemented:** FR1, FR2, FR4, FR6

**Acceptance Criteria:**

1.
**Given** open review tasks,
**When** I resolve, skip, or batch confirm by field context,
**Then** task status updates persist atomically with domain state,
**And** `ReviewTaskResolved`, `ReviewTaskSkipped`, and `FieldBatchConfirmed` events are appended as applicable.

2.
**Given** queue filter and navigation state,
**When** review updates occur,
**Then** user orientation is preserved (active item, position, context),
**And** completed items do not reappear unless explicitly invalidated by later changes.

3.
**Given** unresolved items in their current sequence,
**When** I perform batch resolution actions,
**Then** only targeted items transition state,
**And** unresolved item ordering remains unchanged.

### Story 2.6: Run Validation and Managed Overrides

As an operations user,
I want validation to run continuously with explicit override controls,
So that export readiness is trustworthy and exceptions are auditable.

**FRs implemented:** FR1, FR2, FR4, FR6

**Acceptance Criteria:**

1.
**Given** mutable session data changes,
**When** `RunValidation` executes,
**Then** field/cross-field/dataset validation results are persisted and visible with cause and location,
**And** `ValidationCompleted` is appended with deterministic status output.

2.
**Given** blocking validation issues requiring business exception,
**When** `OverrideValidation` is submitted with reason,
**Then** override intent and rationale persist with visible exception markers,
**And** `ValidationOverridden` is appended and reflected in export-facing metadata.

### Story 2.7: Deterministic Verification Navigation

As an operations user,
I want queue navigation context to remain deterministic through all verification actions,
So that I never lose my place or restart work unexpectedly.

**FRs implemented:** FR4

**Acceptance Criteria:**

1.
**Given** an active queue item,
**When** non-destructive UI actions occur (filters, validation updates, panel toggles),
**Then** the same queue item remains selected and visible,
**And** active context state is preserved.

2.
**Given** an in-progress verification session,
**When** the app is closed and reopened,
**Then** the previously active queue item is restored as active,
**And** prior workspace context is reinstated.

3.
**Given** provenance links in verification views,
**When** I jump to evidence from a value,
**Then** evidence focus changes to the target source,
**And** queue position and active item selection do not change unless explicitly requested.

### Story 2.8: Provenance Availability Guarantees

As an operations user,
I want provenance to be operationally guaranteed for all displayed values,
So that every decision remains explainable and auditable.

**FRs implemented:** FR4

**Acceptance Criteria:**

1.
**Given** any displayed structured value,
**When** I inspect provenance controls,
**Then** a reachable source reference is always available,
**And** jumping to the source is keyboard accessible.

2.
**Given** values influenced by anchor or dictionary rules,
**When** the value is displayed in verification or detail context,
**Then** rule-origin attribution is visible,
**And** users can distinguish machine extraction from rule-influenced outcomes.

3.
**Given** truncated values in dense layouts,
**When** I navigate by keyboard focus,
**Then** full content is accessible without hover-only interaction,
**And** readability is preserved for screen-reader flows.

4.
**Given** supported office-laptop hardware profiles,
**When** a queue item is selected,
**Then** source highlight appears in under 100ms,
**And** latency metrics are captured for regression detection.

### Story 2.9: Verification Performance Targets

As an operations user,
I want verification interactions to meet strict throughput targets,
So that the product is faster than manual entry in real workflows.

**FRs implemented:** FR4, FR6

**Acceptance Criteria:**

1.
**Given** standard verification flows,
**When** an item is resolved and auto-advance executes,
**Then** queue advance latency is under 150ms on supported hardware,
**And** performance telemetry records this metric.

2.
**Given** a representative verification batch,
**When** user interaction data is analyzed,
**Then** keyboard-initiated resolution actions account for at least 80% of resolve operations,
**And** deviations are surfaced in quality reports.

3.
**Given** benchmark harness sessions,
**When** end-to-end verification runs complete,
**Then** median resolve time per queue item is under 2.5 seconds,
**And** results are reproducible across repeat runs.

4.
**Given** concurrent extraction or validation activity,
**When** verification actions are performed,
**Then** UI interaction remains non-blocking,
**And** users can continue resolving items without forced modal interruption.

### Story 2.10: Incremental Validation Behavior

As an operations user,
I want validation feedback to run continuously without disrupting flow,
So that I can fix issues early while maintaining verification rhythm.

**FRs implemented:** FR4, FR6

**Acceptance Criteria:**

1.
**Given** any mutating verification or mapping command,
**When** command processing completes,
**Then** validation is triggered automatically,
**And** updated validation state becomes visible without manual refresh.

2.
**Given** active queue verification,
**When** validation updates arrive,
**Then** the current verification interaction is not interrupted,
**And** focus remains on the active queue workflow.

3.
**Given** unresolved blocking validation issues,
**When** I continue verification,
**Then** resolution actions remain available,
**And** blocking behavior is enforced only at export/finalization gates.

4.
**Given** a surfaced validation issue,
**When** issue details are rendered,
**Then** cause and location are shown,
**And** a concrete resolution hint is provided.

### Story 2.11: Mapping Immediate Effect

As an operations user,
I want mapping and learning updates to take effect immediately,
So that corrections improve current and future sessions without delay.

**FRs implemented:** FR1, FR2, FR4, FR6

**Acceptance Criteria:**

1.
**Given** new anchor or dictionary rules are created,
**When** rule persistence succeeds,
**Then** the rule is applied immediately to the current session context,
**And** affected values are recalculated without restarting the session.

2.
**Given** values affected by newly applied rules,
**When** recalculation completes,
**Then** updated values are visibly reflected in queue/detail views,
**And** queue orientation (active item and position) is preserved.

3.
**Given** rule-driven updates,
**When** provenance is inspected,
**Then** provenance metadata reflects rule influence explicitly,
**And** users can trace the rule-to-value relationship.

4.
**Given** a subsequent session with similar documents,
**When** extraction and mapping run with learned rules enabled,
**Then** extraction/mapping quality improves versus a baseline run without those rules,
**And** improvement metrics are recorded.

## Epic 3: Trusted Export and Immutable Finalization

Users can export a validated dataset with manifest evidence, then lock the session so finalized outputs are immutable and mutation attempts are deterministically rejected.

### Story 3.1: Export Session Artifacts with Manifest Integrity

As an operations user,
I want to export structured outputs and manifest metadata,
So that downstream consumers receive trustworthy and verifiable datasets.

**FRs implemented:** FR1, FR2, FR4, FR6

**Acceptance Criteria:**

1.
**Given** a validation-ready session,
**When** I execute `ExportSession`,
**Then** required export artifacts (CSV/XLSX/JSON as configured) are generated with hashable manifest records,
**And** `SessionExported` and `ExportManifestCreated` events are appended with traceable identifiers.

2.
**Given** export completion,
**When** I inspect export metadata,
**Then** schema version, counts, validation status, and provenance references are present,
**And** metadata remains reproducible from event/audit history.

### Story 3.2: Enforce Immutable Lock Boundary After Finalization

As an operations user,
I want finalized sessions to become immutable after lock,
So that published outputs cannot be accidentally changed.

**FRs implemented:** FR1, FR2, FR3, FR4, FR6

**Acceptance Criteria:**

1.
**Given** a successfully exported session,
**When** lock finalization executes,
**Then** session status transitions to `locked` through allowed transition policy only,
**And** `SessionLocked` is appended in the same atomic mutation scope.

2.
**Given** a locked session,
**When** any mutating command is attempted,
**Then** the command is rejected with deterministic `SESSION_LOCKED` (or policy-aligned) error codes,
**And** no state mutation or event append occurs.

### Story 3.3: Provide Deterministic Finalization Feedback in Workspace

As an operations user,
I want clear finalization and lock-state feedback in the UI,
So that I understand exactly when a session is export-ready, exported, and immutable.

**FRs implemented:** FR3

**Acceptance Criteria:**

1.
**Given** progression through review and validation,
**When** finalization state changes occur,
**Then** session progress, validation rail, and lock indicators update without hidden transitions,
**And** state is communicated using structure and semantics beyond color alone.

2.
**Given** lock or transition rejection scenarios,
**When** errors are returned from the guard layer,
**Then** UI presents deterministic codes and actionable guidance,
**And** keyboard orientation and current context are preserved.

3.
**Given** a session that is export-ready but not yet locked,
**When** finalization state is displayed before and after lock execution,
**Then** pre-lock and post-lock states are visually distinct and persistent,
**And** users can unambiguously identify immutable locked status.

## Epic 4: Correction Revisions Without History Rewrite

Users can create correction sessions from locked exports, replay base history deterministically, apply only deltas, and publish a new revision with explicit lineage metadata.

### Story 4.1: Create Correction Sessions from Locked Base Exports

As an operations user,
I want to open a correction session from a locked base session,
So that I can revise outcomes without editing historical truth.

**FRs implemented:** FR4, FR5

**Acceptance Criteria:**

1.
**Given** a locked base session,
**When** `CreateCorrectionSession` is issued,
**Then** a new correction session is created with required `base_session_id` linkage,
**And** `CorrectionSessionCreated` is appended with valid command-event correlation.

2.
**Given** a non-locked source session,
**When** correction session creation is attempted,
**Then** the operation is rejected according to transition/precondition policy,
**And** deterministic error responses explain why creation is blocked.

### Story 4.2: Replay Base Event History into Correction State

As an operations user,
I want correction sessions to start from deterministic replay of base history,
So that the revision starts from an exact and auditable baseline.

**FRs implemented:** FR5

**Acceptance Criteria:**

1.
**Given** a correction session referencing a base session,
**When** initialization executes replay,
**Then** session state reconstructs from ordered base events without mutating historical records,
**And** replay parity checks validate equivalent baseline state.

2.
**Given** repeated replay with identical inputs,
**When** replay is run again in test fixtures,
**Then** resulting reconstructed state is equivalent,
**And** determinism assertions pass.

### Story 4.3: Apply Correction Deltas as New Commands and Events

As an operations user,
I want to apply only delta changes during correction,
So that revisions are explicit and previous exports remain intact.

**FRs implemented:** FR1, FR2, FR5, FR6

**Acceptance Criteria:**

1.
**Given** an active correction session,
**When** I modify fields/items/validation decisions,
**Then** changes are persisted only as new commands/events in the correction session scope,
**And** base session events remain unchanged and immutable.

2.
**Given** correction updates affecting review or validation,
**When** command handlers complete,
**Then** dependent review and validation states are updated atomically,
**And** failures roll back fully with no partial divergence.

### Story 4.4: Export and Lock Correction Revision with Lineage Metadata

As an operations user,
I want to publish a corrected revision with explicit lineage,
So that downstream consumers can trust what changed and why.

**FRs implemented:** FR3, FR4, FR5

**Acceptance Criteria:**

1.
**Given** a validated correction session,
**When** export is executed,
**Then** export metadata includes `base_session_id`, `revision_number`, and `delta_summary`,
**And** lineage is traceable from revision output back to base and delta events.

2.
**Given** correction export completion,
**When** final lock is applied,
**Then** correction session becomes immutable under the same lock guard semantics,
**And** replay/audit tests confirm end-to-end correction-history integrity.
