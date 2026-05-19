# OmA Core Context

OmA adds a role-driven workflow layer to Gemini CLI.

## Primary Interface

- Use `/oma:*` commands for operational control.
- Keep always-on context thin; heavy procedure belongs in the invoked command, not here.
- Retained skills are limited to: `$plan`, `$oma-plan`, `$execute`, `$prd`, `$ralplan`, `$research`, `$deep-dive`, `$blueprint`, `$context-optimize`, `$learn`.

## Default Flow (Hybrid Routing)

- **Entry**: `intent` -> `blueprint` (if product/UI workflow decisions matter) -> `workspace` (if dirty lanes or multi-root setup needed) -> `team-assemble` (if role fit is unclear).
- **Clarification**: `interview` (if depth flags detected or scope is ambiguous).
  - *Automated*: -> `team-assemble` (orchestrates plan -> prd -> taskboard -> exec -> verify -> fix).
  - *Manual*: -> `team-plan` -> `team-prd`.
- **Execution**: `taskboard` -> `team-exec` -> `team-verify` -> `team-fix`.
- **Loop**: Repeat `exec -> verify -> fix` until acceptance. Use `loop` for subsequent slices.
- **Parallel Rule**: Keep immediate blockers on the active lane; delegate only independent sidecar tasks in parallel.

## System Map: Modes, Controls & Agents

- **Operational Modes**: `balanced`, `speed`, `deep`, `autopilot`, `ralph`, `ultrawork`.
- **Control Plane**: `rules`, `memory`, `workspace`, `taskboard`, `deep-init`, `hud`, `hooks`, `notify`, `reasoning`, `approval`, `doctor`, `cancel`.
- **Agent Role Registry**:
  - **Strategy**: `oma-director`, `oma-architect`, `oma-planner`.
  - **Production**: `oma-product`, `oma-consultant`, `oma-editor`.
  - **Execution**: `oma-executor`, `oma-reviewer`, `oma-verifier`, `oma-debugger`.

## Workflow State: Interviewing

- **Entry**: Triggered via depth keywords (`low|medium|high`) on `/oma:intent`.
- **Hold**: All automated implementation pipelines are blocked while in this state.
- **Agent**: `interview` is the exclusive agent active during this state.
- **Persistence**: Dialogue state, confirmed facts, and `ready_to_run_prompt` must be saved to `.omg/state/interviews/[slug]/context.json`, with `.omg/state/interviews/active.json` pointing at the current session.
- **Meta-commands**: Support `$intent-status`, `$intent-restart`, `$intent-help`, `$intent-resume`, and `$intent-done`.

## Intent Pinning Pattern

- **Handoff Accuracy**: Every `/oma:*` command recommendation **MUST** include the `--intent="[Core Objective]"` flag to prevent context drift between agents.
- **North Star**: Receiving agents use the `--intent` flag as their primary directive, overriding background noise.

## Context and State Management

- **Single Source of Truth (SSoT)**: The active interview session referenced by `.omg/state/interviews/active.json` is the **exclusive** reference for the Socratic gateway.
  - **Smart Synchronization**: Agents `read_file` the active pointer first, then the session state ONLY at entry points to ensure alignment.
  - **Implicit Adoption**: On read, the file content overrides any stale internal context immediately.
  - **Update Policy**: Update the active session file (`write_file`) only when tangible changes (facts, score, prompt) occur.
- **Shared Workflow State**: Treat `.omg/state/workspace.json`, `.omg/state/taskboard.md`, `.omg/state/workflow.md`, and `.omg/state/checkpoint.md` as single-writer artifacts per project.
  - **Lock File**: Read `.omg/state/session-lock.json` before mutating any shared workflow artifact.
  - **Authoritative Writer**: Only the main/orchestration session whose lock matches may update shared workflow artifacts.
  - **Conflict Rule**: If another live session owns the lock, do not overwrite shared workflow artifacts; write session-local drafts under `.omg/state/sessions/[session-slug]/` and surface the ownership conflict explicitly.
  - **Delegated Turns**: Delegated/worker/subagent turns must not write shared workflow artifacts directly; they return handoff summaries or session-local notes for the orchestrator to merge.
- **Summarization**: Read only files needed for the current step and summarize before handoff.
- **Persistence**: Use `.omg/state/*`, `MEMORY.md`, `.omg/memory/*`, `.omg/rules/*`, `.omg/hooks/*`, or `.omg/notify/*`.

## Execution Discipline

- **Read Before Modify**: Read target files or state first; avoid blind edits.
- **Plan Mode Boundary**: When running under native Gemini CLI Plan Mode, do not activate OmA skills, subagents, or implementation lanes without explicit user confirmation.
- **Minimal Diff**: Prefer editing existing files over creating new files unless scope explicitly requires new files.
- **Critical-Path Focus**: Complete immediate blocking work before adding speculative side tasks.
- **Deterministic Queue**: For task execution order, prefer dependency-ready + lane-safe tasks first, then priority (`p0` -> `p3`), then stable task ID.
- **Baseline Integrity**: Keep each active lane anchored to an explicit baseline branch or HEAD snapshot when known; if the baseline drifts unexpectedly, stop and surface the mismatch before continuing implementation or review.
- **Permission Recovery**: If a tool/action is denied, do not retry unchanged; request approval or switch to a safe fallback plan.
- **Agent Recovery**: If a lane agent is unavailable, reroute once to a mapped fallback lane and record why.
- **Concise Success Path**: Keep normal-success reporting compact and expand only blocker or early-stop branches.
- **Session Ownership**: When multiple top-level sessions touch the same project, keep one authoritative orchestration session per shared workflow state and push all parallel session notes into lane/session-local drafts until merged.
- **Subagent Tooling**: Treat upstream subagent invocation as a single tool-controlled handoff surface; OmA commands should describe the intended role, lane, termination reason, and evidence rather than assuming older wrapped subagent tools exist.
- **Native Memory Boundary**: Native `/memory inbox` and skill patching are review surfaces. Do not auto-apply extracted skills or memory patches into OmA assets without operator review and normal versioned-file validation.

## Command Response Contract

- Keep `/oma:*` outputs concise and operator-facing.
- State status/decision first, then blockers/risks, then the next command.
- Use tables only for matrices or comparisons. Mention evidence/persisted files only when relevant.

## Safety & Integrity

- **Pre-requisites**: Do not start implementation if scope or acceptance criteria are missing.
- **Stage Gate**: Keep `team-exec` blocked until both `team-plan` (task graph) and `team-prd` (acceptance criteria) are confirmed.
- **Validation**: Never claim completion or mark work done without verification evidence.
- **Isolation**: Isolate dirty/untrusted worktrees before autonomous review or verification.
- **Lane Anchor Check**: Treat missing or drifted baseline branch/commit anchors as a workflow risk for multi-lane execution, especially before `team-exec`, `team-verify`, or resume handoff.
- **Denied Actions**: Treat denied permissions/tool calls as a workflow event; re-plan or escalate explicitly.
- **Termination**: Stop autonomous loops on hard blockers, missing permissions, or repeated failures.
