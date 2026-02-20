# Sprint Change Proposal

Date: 2026-02-19
Project: Tabulara
Trigger: Story status integrity failures across `_bmad-output/implementation-artifacts/*.md` and `_bmad-output/implementation-artifacts/sprint-status.yaml`
Requested by: Jeremiah
Workflow: Correct Course (Batch mode)

## 1) Issue Summary

Story status is currently represented in two places that drift:
- Canonical tracker candidate: `_bmad-output/implementation-artifacts/sprint-status.yaml`
- Story-local header field: `Status:` inside each story markdown file

Concrete evidence:
- `_bmad-output/implementation-artifacts/sprint-status.yaml` shows `1-4-apply-preprocessing-and-controlled-reprocessing: done`
- `_bmad-output/implementation-artifacts/1-4-apply-preprocessing-and-controlled-reprocessing.md` still says `Status: review`

Impact:
- Rework and duplicate verification effort
- Handoff confusion between Dev/SM/Reviewer
- Unreliable sprint visibility and planning decisions
- Repeated process breakdown across projects

## 2) Checklist Execution Record

### Section 1: Understand Trigger and Context
- 1.1 Triggering story identified: **[x] Done**
- 1.2 Core problem precisely defined: **[x] Done**
- 1.3 Evidence collected: **[x] Done**

### Section 2: Epic Impact Assessment
- 2.1 Current epic impact assessed: **[x] Done**
- 2.2 Epic-level change required: **[x] Done**
- 2.3 Remaining epics reviewed for impact: **[x] Done**
- 2.4 Future epic invalidation/new epic check: **[x] Done**
- 2.5 Epic ordering/priority impact: **[!] Action-needed**
  - Action: prioritize status-integrity controls before further story throughput.

### Section 3: Artifact Conflict and Impact Analysis
- 3.1 PRD conflicts checked: **[x] Done**
- 3.2 Architecture conflicts checked: **[x] Done**
- 3.3 UI/UX impact checked: **[N/A] Skip** (no direct UX flow changes required)
- 3.4 Secondary artifact impact checked: **[x] Done**

### Section 4: Path Forward Evaluation
- 4.1 Option 1 (Direct Adjustment): **Viable**
- 4.2 Option 2 (Rollback): **Not viable**
- 4.3 Option 3 (MVP scope review): **Not viable**
- 4.4 Selected path: **Option 1 + governance hard gates (Hybrid operational policy)**

### Section 5: Sprint Change Proposal Components
- 5.1 Issue summary: **[x] Done**
- 5.2 Epic/artifact adjustments: **[x] Done**
- 5.3 Recommended path with rationale: **[x] Done**
- 5.4 MVP impact + high-level action plan: **[x] Done**
- 5.5 Agent handoff plan: **[x] Done**

### Section 6: Final Review and Handoff
- 6.1 Checklist completeness: **[x] Done**
- 6.2 Proposal consistency and accuracy: **[x] Done**
- 6.3 User approval: **[x] Done** (policy approvals captured in-session)
- 6.4 Sprint status update for epic changes: **[!] Action-needed**
  - Action: add new story entries for status-integrity enforcement to `sprint-status.yaml` once this proposal is approved.
- 6.5 Handoff confirmation: **[!] Action-needed**
  - Action: route to SM/PO for backlog reorganization and Dev for implementation.

## 3) Impact Analysis

## Epic Impact
- Epic 1 (completed work): requires a closeout integrity pass and status reconciliation policy.
- Epic 2+ (future work): all story execution depends on trustworthy status transitions; policy must be enforced before normal throughput.

## Story Impact
- Existing stories: all current and future stories are affected by status-governance requirements.
- Immediate mismatch remediation required for story headers that disagree with `sprint-status.yaml`.

## Artifact Conflicts
- PRD currently defines command/event mutation rigor but does not explicitly define story-status source-of-truth governance.
- Architecture defines deterministic contracts broadly but not explicit story-status consistency guardrails.
- Sprint tracking file allows manual drift in practice due to absent enforcement mechanisms.

## Technical Impact
- Need deterministic status-transition command/script path.
- Need CI and local hooks that fail on mismatch.
- Need story template/process updates so `Status:` becomes derived metadata only.

## 4) Recommended Approach

Selected approach: **Direct Adjustment with hard governance gates**

Rationale:
- Fastest path to stop repeat failures without undoing delivered product work.
- Preserves current epics/stories while adding non-negotiable integrity controls.
- Converts status from convention to enforceable invariant.

Decision policy approved by user:
1. `sprint-status.yaml` is canonical source of truth.
2. CI and pre-commit/pre-push checks block drift.
3. Status transitions follow explicit allowed states only.
4. Rollout applies across all active stories and all projects.

## 5) Detailed Change Proposals (Old -> New)

## A) Story Tracking Governance

Artifact: `_bmad-output/implementation-artifacts/sprint-status.yaml`

OLD:
- Story state tracked, but workflow relies on manual synchronization with story markdown `Status:`.

NEW:
- Add governance notes declaring canonical authority and disallowing manual edits to story markdown status fields.
- Add machine-verifiable transition policy section:
  - `backlog -> ready-for-dev -> in-progress -> review -> done`
  - only scripted/commanded transitions allowed

Rationale:
- Prevents ambiguous ownership and makes status deterministic.

## B) Story File Semantics

Artifact(s): `_bmad-output/implementation-artifacts/*.md`

OLD:
- Each story file has editable `Status:` header interpreted as operational truth.

NEW:
- `Status:` becomes derived/display-only and must match canonical value from `sprint-status.yaml`.
- Add marker in template/process notes:
  - "Do not manually set final workflow status here; run status-sync/status-transition command."

Rationale:
- Eliminates dual-writer model that causes drift.

## C) Epic Plan Update

Artifact: `_bmad-output/planning-artifacts/epics.md`

OLD:
- No explicit story enforcing status-integrity controls.

NEW (additions to Epic 2):
- **Story 2.12: Enforce Story Status Integrity Across Artifacts**
  - AC1: A verification command reports mismatch and exits non-zero.
  - AC2: CI blocks merge when any story markdown status differs from `sprint-status.yaml`.
  - AC3: Transition command enforces allowed state machine and updates canonical + derived fields atomically.
  - AC4: Review completion cannot move to `done` without required review evidence fields.

Rationale:
- Makes process reliability an explicit backlog deliverable with acceptance criteria.

## D) PRD Contract Addendum

Artifact: `_bmad-output/planning-artifacts/tabulara-prd-command-event-model.md`

OLD:
- Mutation and event invariants exist, but no explicit project-management status-governance invariant.

NEW:
- Add FR addendum:
  - "Story workflow status MUST have a single canonical source and deterministic synchronization across all human-readable artifacts."
  - "Build/review pipeline MUST fail when status representations diverge."

Rationale:
- Elevates status integrity from process convention to requirement.

## E) Architecture Pattern Addendum

Artifact: `_bmad-output/planning-artifacts/architecture.md`

OLD:
- Determinism and integrity patterns are defined generally.

NEW:
- Add implementation consistency rule:
  - "Project execution metadata uses single-writer canonical state + derived projections only."
  - "Drift detection checks are mandatory in CI and local validation."

Rationale:
- Aligns delivery operations with existing determinism architecture principles.

## F) Secondary Artifacts

Artifacts:
- CI workflow definitions under `.github/workflows/*`
- Story template/process docs under `_bmad/*` where status instructions are defined

OLD:
- No guaranteed blocking check for story/sprint-status mismatch.

NEW:
- Add required status-integrity check stage in CI and local hook commands.

Rationale:
- Enforces behavior where work is performed, not just in documentation.

## 6) MVP Impact and Action Plan

MVP impact: **No feature scope reduction required.**

Action plan:
1. Add Story 2.12 in epic planning artifacts and sprint-status backlog entries.
2. Implement status verification and transition tooling.
3. Update CI + local hooks to block drift.
4. Reconcile all current story file `Status:` fields with canonical tracker.
5. Add reviewer evidence gate for `done` transitions.

## 7) Implementation Handoff

Scope classification: **Moderate**

Routing:
- Product Owner / Scrum Master:
  - Approve backlog insertion and sequencing priority for Story 2.12.
  - Confirm governance policy language in planning artifacts.
- Development team:
  - Implement status-verify/status-transition tools and CI hook.
  - Apply one-time status reconciliation script.
- QA:
  - Add automated tests for transition rules, mismatch failure, and evidence-gated `done`.

Success criteria:
1. No story status mismatch tolerated in CI.
2. No manual status edits required for normal workflow.
3. `done` status changes are auditable and evidence-backed.
4. Sprint board and story files are always consistent by construction.

## 8) Immediate Next-Step Routing

- Route this proposal to SM/PO for backlog reorganization approval.
- Upon approval, route to Dev + QA for implementation of Story 2.12 controls.
- Hold standard feature throughput until integrity guardrails are in place.

---

Prepared by: Bob (Scrum Master)
