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

