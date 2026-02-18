---
title: Tabulara Full-System Architecture
date: 2026-02-18
owner: Jeremiah
status: Architecture Baseline - Implementation Ready
related_prd: /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/tabulara-prd-command-event-model.md
related_state_spec: /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/tabulara-state-transition-invariant-spec.md
related_dispatcher_design: /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/tabulara-command-dispatcher-guard-layer-tech-design.md
related_command_catalog: /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/tabulara-command-type-catalog.md
---

# 1. Executive Summary
Tabulara is a local-first desktop system for turning raw documents into trusted structured datasets through human-verified workflows. The architecture is optimized for privacy, reproducibility, and deterministic correction history. All meaningful mutation flows through a command-event core, while artifacts remain encrypted in a portable vault.

# 2. Architectural Principles
1. Local-only execution by default.
2. Human-confirmed truth over autonomous inference.
3. Immutable session outputs after export.
4. Event-backed auditability for every mutation.
5. Correction by creating new sessions, never rewriting history.
6. Project isolation within a vault.
7. Secure-at-rest encrypted storage with optional keychain convenience.

# 3. System Context
## 3.1 Primary user flow
1. Open vault.
2. Select project.
3. Create session.
4. Import and preprocess documents.
5. Run extraction.
6. Map fields/tables.
7. Resolve review queue.
8. Validate.
9. Export and lock session.
10. Create correction session later if needed.

## 3.2 External dependencies
1. No network dependency required at runtime.
2. OCR/HTR models are local runtime assets.
3. OS keychain integration is optional.

# 4. Runtime Architecture
## 4.1 Process topology
1. Tauri desktop container.
2. Frontend SPA (React or Svelte).
3. Local backend service (Rust preferred).
4. OCR/HTR engine adapters.
5. Image preprocessing pipeline.
6. SQLCipher vault and blob storage.

## 4.2 Component boundaries
1. `UI Layer`: workflows, review UX, validation and export controls.
2. `API Layer`: localhost REST contract (`/api/v1`).
3. `Application Layer`: command dispatcher, guard engine, handlers.
4. `Domain Layer`: session lifecycle, mapping logic, validation logic.
5. `Data Layer`: SQLCipher tables and encrypted blob repository.
6. `Infra Layer`: backups, integrity checks, key derivation/unlock policy.

# 5. Data Architecture
## 5.1 Vault format
1. File extension: `.svdpvault`.
2. Key derivation: Argon2id.
3. Encryption: AES-256-GCM.
4. Core DB: SQLCipher SQLite (`vault.sqlite`).
5. Blobs for originals, derivatives, exports, reports.

## 5.2 Core data domains
1. Project and schema management (`projects`, `schemas`, `schema_fields`).
2. Session and document lineage (`sessions`, `documents`, `pages`, `blobs`).
3. Extraction artifacts (`extraction_runs`, `tokens`, `lines`, `tables_detected`).
4. Structured outputs (`field_values`, `items`, `item_values`, `extra_rows`, `extra_values`).
5. Learning and templates (`anchors`, `dictionary_rules`, `templates`).
6. Quality and traceability (`review_tasks`, `validation_results`, `exports`, `audit_log`).

## 5.3 Storage policies
1. Always store originals.
2. Store processed derivatives permanently.
3. Store extracted text and mappings.
4. Store immutable export artifacts and manifests.
5. Do not persist temporary cache.

# 6. Command-Event Core Architecture
## 6.1 Command processing contract
1. Mutations occur only through commands.
2. Every accepted command emits at least one event.
3. Commands and events use UUID correlation (`command_id` / `caused_by`).
4. State mutation plus event append execute atomically in one transaction.

## 6.2 Dispatcher and guard chain
1. Envelope validation.
2. Idempotency check.
3. Session-state permission check.
4. Domain precondition check.
5. Handler execution and projection writes.
6. Transition validation.
7. Event creation and append.
8. Invariant assertions.

## 6.3 Event store model
1. Append-only `audit_log.event_json` records.
2. Optional indexed fields for replay and diagnostics.
3. No update/delete semantics for historical events.

# 7. Session Lifecycle Architecture
## 7.1 Status model
1. `created`
2. `processing`
3. `review`
4. `validated`
5. `exported`
6. `locked`

## 7.2 Transition policy
1. Normal forward path: `created -> processing -> review -> validated -> exported -> locked`.
2. Controlled regressions allowed: `review -> processing`, `validated -> review`.
3. Locked sessions are immutable for mutating operations.

## 7.3 Correction architecture
1. Correction session references a locked base session.
2. Base state is reconstructed by replay of base events.
3. Delta commands/events are applied on top.
4. Export metadata includes `base_session_id`, revision, and delta summary.

# 8. Processing Pipeline Architecture
## 8.1 Intake
1. Import PDFs/images.
2. Duplicate flagging via hash/fingerprint heuristics.
3. Document/page registration with blob linkage.

## 8.2 Preprocessing
1. Rotate, deskew, perspective correction, contrast normalization, denoise.
2. Reprocessing allowed without destructive history rewrite.
3. Reprocessing can force lifecycle regression for quality integrity.

## 8.3 Extraction
1. OCR/HTR run orchestration by engine adapter.
2. Persist tokens, lines, table candidates with confidence.
3. Derived data updates emitted as events.

## 8.4 Mapping
1. Document field assignments (manual/anchor/zone).
2. Item row and cell assignment.
3. Extra table row and cell assignment.
4. Unknown bucket retention for unassigned extracted text.

## 8.5 Review and validation
1. Review queue categories: required missing, low confidence, validation error, new pattern.
2. Batch review by field type.
3. Validation layers: field, cross-field, dataset checks.
4. Blocking errors prevent export unless explicitly overridden.

## 8.6 Export and lock
1. Export formats: CSV bundle, XLSX, JSON artifacts.
2. Manifest includes hashes, counts, schema version, validation status.
3. Successful export finalizes into locked session.

# 9. API Architecture
## 9.1 API style
1. Localhost REST (`/api/v1`) as transport boundary.
2. One mutating route maps to one command entry point.
3. Read endpoints bypass command mutation pipeline but observe lock state as needed.

## 9.2 Key endpoint groups
1. Vault/project: open/lock/status, project CRUD/settings.
2. Schema: schema lifecycle and field definitions.
3. Session lifecycle: create, correction, lock, pin.
4. Import/preprocess/extract: pipeline execution.
5. Mapping/review/validation: curation and quality control.
6. Export/retention: immutable outputs and purge execution.

# 10. Security Architecture
## 10.1 Confidentiality
1. Vault encryption at rest with Argon2id + AES-GCM.
2. Optional keychain-assisted unlock for local usability.

## 10.2 Integrity
1. Event append-only model for audit trail integrity.
2. Hash-validated blobs and export manifests.
3. Integrity checks on vault open.

## 10.3 Threat boundaries
Protected:
1. Stolen vault file.
2. Copied disk artifacts.
3. Unauthorized offline inspection.

Not protected:
1. Malware on unlocked host.
2. Compromised OS account while unlocked.

# 11. Reliability and Recovery Architecture
1. Rolling backups (`vault.bak1..3`).
2. Recovery tool prioritizes salvage of intact records even with partial blob corruption.
3. Transactional command execution eliminates partial write/event divergence.
4. Idempotent command handling reduces duplicate processing risk on retries.

# 12. Retention and Lifecycle Operations
1. Hybrid retention defaults: keep last 25 sessions and last 90 days, preserve pinned.
2. Purge removes heavy artifacts but keeps tombstone metadata.
3. Tombstones preserve session ID, hashes, counts, and timestamp for forensic continuity.

# 13. Observability Architecture
1. Command metrics: command type, session, duration, result code, event count.
2. Audit replay capability for deterministic reconstruction.
3. Explicit deterministic rejection codes for UI and test automation.

# 14. Deployment and Packaging Architecture
1. Single desktop binary per OS via Tauri packaging.
2. Bundled local model/runtime dependencies as part of install strategy.
3. No required cloud services for core operation.

# 15. Quality Architecture (Verification Strategy)
1. Transition matrix test suite for all command/state combinations.
2. Invariant tests for lock, event, export, and correction guarantees.
3. Failure injection tests for rollback guarantees.
4. Replay tests for deterministic correction-session reconstruction.
5. Integration tests for route-to-command mapping conformance.

# 16. Architecture Decisions and Constraints
1. Event-sourced mutation boundary is mandatory.
2. SQLCipher is the source of truth for state and artifacts.
3. Session lock is non-negotiable immutability boundary.
4. Any validated-data mutation requires lifecycle regression to review.
5. Direct state writes outside command handlers are prohibited.

# 17. Risks and Mitigations
1. Risk: command bypass via ad hoc DB writes.
- Mitigation: single write-path enforcement + automated tests.
2. Risk: event/schema drift.
- Mitigation: versioned event payloads + migration compatibility tests.
3. Risk: long-running extraction contention.
- Mitigation: per-session locking strategy + queueing/backoff.
4. Risk: overgrowth of vault size.
- Mitigation: retention policy + tombstone purge strategy.

# 18. Implementation Roadmap (Architecture-Aligned)
1. Milestone 0: vault security foundation and project settings.
2. Milestone 1: import/storage and dedupe baseline.
3. Milestone 2: preprocessing pipeline and derivative persistence.
4. Milestone 3: extraction v1 and quality scoring.
5. Milestone 4: mapping v1 including unknown bucket.
6. Milestone 5: review queue and validation v1.
7. Milestone 6: export pipeline and lock/correction semantics.
8. Milestone 7: anchor/dictionary/table stabilization multipliers.
9. Milestone 8: retention purge and tombstone operations.

# 19. Traceability Matrix (High-Level)
1. FR command/event guarantees -> dispatcher + event store + invariants.
2. FR lock immutability -> state guards + transition policy.
3. FR correction sessions -> replay engine + revision metadata.
4. NFR determinism/integrity -> single transaction + append-only audit log.
5. NFR security -> encrypted vault + keychain controls + local-only runtime.

# 20. Recommended Next Artifacts
1. Component-level sequence diagrams for import/extract/map/export command chains.
2. SQL migrations package for initial schema and command log.
3. Rust crate bootstrap (`Cargo.toml`) around generated stubs for compile/test harness.
4. Test plan document mapping each invariant to concrete test cases.
