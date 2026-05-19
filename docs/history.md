# Changelog

All notable changes to oh-my-antigravity are documented here.

## v0.9.0 - Project Rename to oh-my-antigravity (2026-05-20)

### Changed

- Renamed the project and extension package from `oh-my-gemini-cli` to `oh-my-antigravity`.
- Updated repository, GitHub Pages, extension gallery, installation, uninstall, badge, and Star History references across README, Korean README, localized docs, landing page, and installation guide.
- Bumped package and extension metadata to `v0.9.0`.
- Recorded the rename in release history.

## Unreleased - Gemini CLI May Compatibility Sync (2026-05-13)

### Changed

- Reviewed official Gemini CLI documentation and releases current to 2026-05-13, covering upstream changelog entries from `v0.39.0` (2026-04-23) through `v0.42.0` (2026-05-12).
- Updated OmG compatibility guidance to the current stable baseline: Gemini CLI `v0.42.0+`.
- Noted the latest observed upstream channels: stable `v0.42.0` (2026-05-12), preview `v0.42.0-preview.2` (2026-05-06), and nightly `v0.42.0-nightly.20260507.ga809bc7c5` (2026-05-07).
- Refreshed extension, registry reload, subagent, model routing, policy, environment-loading, hook, memory, browser-agent, and slash-planning compatibility guidance.
- Recorded that the recent upstream changelog set does not require OmG command, hook, agent, or manifest code changes.
- Removed README and landing-page visual flow blocks so the public docs stay text/table driven.
- Updated README, Korean README, landing page, and history for the latest compatibility posture only.

## v0.8.6 - Blueprint Workflow (2026-05-18)

### Added

- Added `/omg:blueprint` as an extension-native product/UI workflow decision command.
- Added `$blueprint` as a retained deep-work skill for target users, workflow maps, interface decisions, state coverage, content hierarchy, accessibility, responsive constraints, open questions, and verification hooks.
- Added `.omg/state/blueprint.md` as the recommended durable artifact when users request persistence.

### Changed

- Updated OmG core routing so product or interface-heavy work can pass through `intent -> blueprint -> team-plan/team-prd -> taskboard -> team-exec`.
- Bumped package and extension metadata to `v0.8.6`.
- Updated README, Korean README, landing page, and history for the blueprint workflow.

## v0.8.5 - Goal Mode Autonomous Delivery (2026-05-04)

### Added

- Added `/omg:goal` as a Ralph/Codex-style goal-driven autonomous delivery command.
- Goal mode treats routine non-destructive work as approved, then runs the staged OmG delivery path through plan, PRD, taskboard, execution, verification, and fix loops.
- Added explicit runtime-boundary guidance so blocked Gemini CLI approvals, sandbox limits, trusted-folder restrictions, shell/network policy, destructive actions, credential-sensitive actions, and production-impacting actions stop as blockers instead of being bypassed.

### Changed

- Bumped package and extension metadata to `v0.8.5`.
- Updated README, Korean README, landing page, and history for the new goal command and autonomy limits.

## v0.8.4 - Remove Usage Monitor Hook (2026-04-28)

### Removed

- Removed `omg-quota-watch-after-agent` from `hooks/hooks.json`.
- Deleted `hooks/scripts/after-agent-usage.js` so OmG no longer emits noisy `usage=unavailable` lines.
- Stopped documenting `.omg/state/quota-watch.json` as an active OmG state artifact.

### Changed

- Updated hook controls to keep only the quiet `BeforeModel` model router and the `AfterAgent` learn-signal safety filter.
- Updated README, Korean README, landing page, hook guide, package metadata, and extension metadata for `v0.8.4`.
- Redirected usage/quota guidance to Gemini CLI native `/model` or `/stats model` output.

## v0.8.3 - Gemini CLI Late-April Compatibility Sync (2026-04-27)

### Changed

- Superseded by the 2026-05-13 compatibility guidance above. Historical release details remain in git history.

## v0.8.2 - Quiet Model Routing Defaults (2026-04-22)

### Changed

- Replaced the noisy `BeforeModel` model-routing banner with a silent router that updates `hookSpecificOutput.llm_request.model`.
- Switched balanced lane routing back to explicit preview model IDs: planning/review uses `gemini-3.1-pro-preview`, execution uses `gemini-3-flash-preview`, and quick edits use `gemini-3.1-flash-lite-preview`.
- Kept model strategy visibility in `/omg:status`, HUD previews, and `/omg:model` instead of emitting a per-request banner.
- Refreshed `README.md`, `docs/README_ko.md`, `docs/index.html`, package metadata, and extension metadata for `v0.8.2`.

## v0.8.1 - Model Alias Routing and Visibility (2026-04-20)

### Changed

- Switched OmG model guidance from hard-pinned Gemini 3 preview model names to Gemini CLI aliases: `auto`, `pro`, `flash`, and `flash-lite`.
- Updated balanced lane guidance across command/docs surfaces to use alias-based routing (`pro` for planning/review, `flash` for execution, `flash-lite` for quick edits).
- Added workspace `.gemini/settings.json` with `general.previewFeatures=true` so this repository defaults to preview-backed alias routing where Gemini CLI supports it.
- Refreshed `README.md`, `docs/README_ko.md`, `docs/index.html`, and command guidance to match the current Gemini CLI model alias reference.
- Added a `BeforeModel` visibility banner hook and made `/omg:status` HUD guidance surface model strategy and preview status more prominently.

## Release Timeline

| Version | Date | Theme | Outcome |
| --- | --- | --- | --- |
| `v0.9.0` | 2026-05-20 | Project rename | Renamed the project and extension package to `oh-my-antigravity`, updated public docs and install links, and bumped metadata to `v0.9.0` |
| `v0.8.6` | 2026-05-18 | Blueprint workflow | Added `/omg:blueprint` and `$blueprint` for product/UI workflow decisions, interface states, content hierarchy, accessibility, responsive constraints, and verification hooks before implementation |
| `v0.8.5` | 2026-05-04 | Goal mode autonomous delivery | Added `/omg:goal` for routine-approved plan/PRD/taskboard/exec/verify/fix loops while keeping Gemini CLI runtime approval, sandbox, and policy limits explicit |
| `v0.8.4` | 2026-04-28 | Remove usage monitor hook | Removed the quota-watch AfterAgent hook and script so OmG no longer prints `usage=unavailable`; usage/quota visibility now relies on Gemini CLI native `/model` or `/stats model` |
| `v0.8.3` | 2026-04-27 | Gemini CLI late-April compatibility sync | Superseded by the 2026-05-13 compatibility guidance above |
| `v0.8.2` | 2026-04-22 | Quiet model routing defaults | Replaced the visible BeforeModel model banner with silent request routing so repeated model-routing lines no longer appear while lane-specific model selection remains active |
| `v0.8.1` | 2026-04-20 | Model alias routing and visibility | Switched OmG guidance to Gemini CLI model aliases, enabled workspace preview features by default, and added a BeforeModel visibility banner plus stronger HUD model visibility |
| `v0.8.0` | 2026-04-16 | Shared workflow single-writer safety | Added session-lock based ownership for shared workflow and operating-profile state, routed non-owning sessions into session-local drafts, and documented the safer same-project parallel-session model |
| `v0.7.9` | 2026-04-16 | Hook state collision hardening | Stopped quota-watch and learn-state hooks from falling back to shared `process.cwd()` state paths, added atomic state writes, and documented the safer cross-project behavior |
| `v0.7.8` | 2026-04-16 | Interview session partitioning and docs alignment | Replaced the single shared interview state contract with session-scoped interview folders, added an active-session pointer, and aligned versioned docs plus release metadata around the new structure |
| `v0.7.7` | 2026-04-16 | Extension-boundary checks and audit-first launch safety | Tightened stale/mixed extension-root diagnostics, discouraged manual hook-shadow fixes ahead of extension-managed recovery, and promoted workspace audit to the default preflight before non-trivial execution |
| `v0.7.6` | 2026-04-15 | Hook/runtime control and model-pin cleanup | Added env-driven hook profile controls, retained-skill metadata validation, and removed agent-level model pinning so runtime model selection can take effect consistently |
| `v0.7.5` | 2026-04-14 | Hook stability and usage-state hygiene | Split usage monitor state by model/provider and added duplicate-hook registration diagnostics for repeated AfterAgent output |
| `v0.7.4` | 2026-04-13 | Baseline-aware lane guardrails | Added baseline branch/HEAD anchors to workspace/taskboard/team flows so branch drift is caught before execution or review |
| `v0.7.3` | 2026-04-08 | Stage-gate and runtime signal hardening | Added workspace-aware usage monitor cwd hints, stop/cancel skill-state cleanup signals, and stricter staged execution readiness checks |
| `v0.7.2` | 2026-04-07 | Workflow/runtime hygiene | Added learn-signal cooldown control, release metadata sync utility, and stronger staged-workflow diagnostics |
| `v0.7.1` | 2026-04-06 | Deterministic taskboard and fallback routing | Added null-safe task priority defaults (`p2`), deterministic `next` ordering, and one-shot agent-unavailable fallback routing across team execution stages |
| `v0.7.0` | 2026-04-05 | Model selection policy controls | Added `/omg:model` with `balanced|auto|custom` strategy management and persisted model-policy state for consistent lane routing |
| `v0.6.0` | 2026-04-03 | Gemini CLI compatibility sync | Superseded by the 2026-05-13 compatibility guidance above |
| `v0.5.0` | 2026-04-01 | Prompt ops hardening | Applied Claude-derived delegation/edit/verification guardrails across OmG core context, team commands, and agent contracts |
| `v0.4.6` | 2026-03-31 | Deep-dive discovery skill | Added extension-native `$deep-dive` trace-to-interview skill with clarity scoring and optional interview/launch state artifacts |
| `v0.4.5` | 2026-03-30 | Deep-interview lock nudge suppression | Learn-signal hook now suppresses automated nudges while deep-interview lock is active and resumes safely after lock release |
| `v0.4.4` | 2026-03-26 | Learn-signal safety hardening | Added actionable-session filtering, deduped learn-signal state tracking, and safer stale-state handling for `/omg:learn` nudges |
| `v0.4.3` | 2026-03-24 | AfterAgent deduplication and retry safety | Added transcript-fingerprint state tracking so repeated usage-hook retries no longer double-print the same turn |
| `v0.4.2` | 2026-03-21 | Skills/footer compatibility alignment | Added slash-friendly `omg-plan` skill alias; current compatibility guidance is maintained in the 2026-05-13 section above |
| `v0.4.1` | 2026-03-20 | Usage monitor runtime knobs | Added quiet-hook output control and state-root override for safer, less noisy long sessions |
| `v0.3.9` | 2026-03-12 | Workspace hygiene and hook symmetry | Added lane-health auditing, hook lifecycle symmetry rules, and quieter delegated handoffs for safer long sessions |
| `v0.3.8` | 2026-03-11 | Workspace and taskboard control | Added extension-native workspace lane mapping and verifier-backed taskboard workflows for lighter long-session orchestration |
| `v0.3.7` | 2026-03-10 | Load surface cleanup | Fixed root context wiring, removed mirrored control-plane skills, and slimmed repeated command boilerplate |
| `v0.3.6` | 2026-03-10 | Notification routing | Added extension-native notification profiles, event routing, and safe external-delivery boundaries for long-running OmG sessions |
| `v0.3.5` | 2026-03-04 | Dynamic Agent Team Assembly | Added approval-gated dynamic team composition with new director/consultant/editor roles and model-aware lane policy |
| `v0.3.4` | 2026-02-28 | Deterministic hook orchestration | Added extension-native hook commands/skill with event-lane policy, safety validation, and dry-run testing |
| `v0.3.3` | 2026-02-28 | Claude-style memory management | Added file-based memory index/topic split and modular rule-pack workflows |
| `v0.3.2` | 2026-02-26 | HUD visibility controls | Added extension-native HUD profile commands/skill and status rendering policy |
| `v0.3.1` | 2026-02-26 | Intent/loop guardrail expansion | Added intake gate, loop enforcement, deep init, and conditional rule injection workflows |
| `v0.3.0` | 2026-02-25 | Workflow and mode expansion | Added stage pipeline commands, autonomous modes, and lifecycle controls |
| `v0.2.0` | 2026-02-24 | Extensions-first rebuild | OmG moved to Gemini CLI's official extension primitives |
| `v0.1.4` | 2026-02-23 | Runtime integration hardening | MCP/server wiring and status observability improved |
| `v0.1.3` | 2026-02-23 | Installation path stabilization | GitHub-based install flow documented as default path |
| `v0.1.2` | 2026-02-22 | Model/branding consistency | `gemini-3.1-*` naming and OmG branding normalized |
| `v0.1.1` | 2026-02-22 | Dashboard redesign | Retro game-style TUI and richer telemetry presentation |
| `v0.1.0` | 2026-02-22 | Initial release | Multi-agent orchestration foundation shipped |

## v0.8.0 - Shared Workflow Single-Writer Safety (2026-04-16)

Focused on reducing same-project parallel-session drift after Gemini CLI subagent GA by formalizing one authoritative writer for shared OmG state and routing non-owning sessions into session-local drafts.

### Changed

- Added shared workflow single-writer policy:
  - `context/omg-core.md`
  - shared workflow artifacts now treat `.omg/state/session-lock.json` as the authoritative writer lock
  - only the lock-owning orchestration session should mutate shared workflow artifacts
  - delegated/worker/subagent turns are explicitly read-mostly for shared workflow state
- Hardened shared workflow state writers:
  - `commands/omg/launch.toml`
  - `commands/omg/team.toml`
  - `commands/omg/team-assemble.toml`
  - `commands/omg/taskboard.toml`
  - `commands/omg/workspace.toml`
  - `commands/omg/checkpoint.toml`
  - `commands/omg/stop.toml`
  - `commands/omg/cancel.toml`
  - `commands/omg/loop.toml`
  - `commands/omg/autopilot.toml`
  - `commands/omg/team-plan.toml`
  - `commands/omg/team-exec.toml`
  - `commands/omg/team-verify.toml`
  - non-owning sessions now write session-local drafts under `.omg/state/sessions/[session-slug]/...` instead of overwriting shared workflow state
- Extended the lock-aware persistence model to operating-profile state:
  - `commands/omg/mode.toml`
  - `commands/omg/hud.toml`
  - `commands/omg/hud-on.toml`
  - `commands/omg/hud-off.toml`
  - `commands/omg/hud-compact.toml`
  - `commands/omg/approval.toml`
  - `commands/omg/reasoning.toml`
  - `commands/omg/hooks.toml`
  - `commands/omg/hooks-init.toml`
  - `commands/omg/notify.toml`
- Preserved prior hook collision safeguards:
  - `hooks/scripts/after-agent-usage.js`
  - `hooks/scripts/learn.js`
  - hook state still avoids unsafe `process.cwd()` fallback and still writes via temp file plus atomic rename
- Refreshed documentation and release metadata for `v0.8.0`:
  - `README.md`
  - `docs/README_ko.md`
  - `docs/index.html`
  - `docs/history.md`
  - `package.json`
  - `gemini-extension.json`
- Refreshed Gemini CLI compatibility guidance after the official subagent launch review:
  - compatibility notes re-reviewed on 2026-04-16
  - now calls out the 2026-04-15 Google Developers Blog subagent launch explicitly
  - explains why OmG now treats delegated/worker/subagent turns as read-mostly for shared workflow state
  - links the compatibility review to OmG's new session-lock and session-local draft safety model

### Structural Fit Note

- OmG remains extension-native.
- Changes are limited to prompt-policy contracts, shipped hook scripts, documentation, and release metadata.

## v0.7.9 - Hook State Collision Hardening (2026-04-16)

Focused on reducing cross-project hook-state collisions during concurrent local work by requiring a reliable session `cwd` before persisting OmG hook state and by making state writes atomic.

### Changed

- Hardened usage-monitor state persistence:
  - `hooks/scripts/after-agent-usage.js`
  - no longer falls back to shared `process.cwd()` state paths when hook-level `cwd` is missing or invalid
  - skips quota-watch persistence when a safe session-local state path cannot be resolved
  - still emits usage output using transcript-derived turn counts when persistence is skipped
- Hardened learn-signal state persistence:
  - `hooks/scripts/learn.js`
  - no longer falls back to shared `process.cwd()` state paths when hook-level `cwd` is missing or invalid
  - skips learn-state persistence rather than writing into an ambiguous cross-project location
- Reduced concurrent write corruption risk:
  - `hooks/scripts/after-agent-usage.js`
  - `hooks/scripts/learn.js`
  - state snapshots now write through temp files plus atomic rename
- Refreshed documentation and release metadata for `v0.7.9`:
  - `README.md`
  - `docs/README_ko.md`
  - `docs/index.html`
  - `docs/history.md`
  - `package.json`
  - `gemini-extension.json`

### Structural Fit Note

- OmG remains extension-native.
- Changes are limited to shipped hook scripts, documentation, and release metadata.

## v0.7.8 - Interview Session Partitioning and Docs Alignment (2026-04-16)

Focused on making requirement-discovery sessions easier to separate within the same project by replacing the single shared interview-state contract with a session-scoped folder layout and an explicit active-session pointer.

### Changed

- Reworked interview state contract:
  - `commands/omg/intent.toml`
  - `commands/omg/interview.toml`
  - `agents/interview.md`
  - `context/omg-core.md`
  - interview state now lives at `.omg/state/interviews/[slug]/context.json`
  - the current session is tracked via `.omg/state/interviews/active.json`
  - finalized interview PRDs now land in `.omg/state/interviews/[slug]/prd.md`
- Refreshed documentation and release metadata for `v0.7.8`:
  - `README.md`
  - `docs/README_ko.md`
  - `docs/README_zh.md`
  - `docs/index.html`
  - `docs/history.md`
  - `package.json`
  - `gemini-extension.json`

### Structural Fit Note

- OmG remains extension-native.
- Changes are limited to command/agent contracts, workflow context, documentation, and release metadata.

## v0.7.7 - Extension-Boundary Checks and Audit-First Launch Safety (2026-04-16)

Focused on low-risk improvements that fit OmG's extension-native structure: safer recovery guidance when installs or hook paths drift, and clearer preflight gating before multi-lane execution starts.

### Changed

- Tightened extension-boundary diagnostics:
  - `commands/omg/doctor.toml`
  - treats stale or mixed extension roots, copied asset drift, and manual hook/skill shadowing as first-class readiness risks
- Hardened hook recovery guidance:
  - `commands/omg/hooks.toml`
  - prefers env/runtime controls plus extension-managed recovery paths before recommending direct edits to shipped hook files
- Promoted audit-first launch behavior:
  - `commands/omg/launch.toml`
  - non-trivial launches now treat `/omg:workspace audit` as the default preflight before `team-exec`
- Made workspace audit verdicts more actionable:
  - `commands/omg/workspace.toml`
  - dirty, untrusted, missing-baseline, or baseline-drifted active lanes are now explicit blockers until reconciled
- Refreshed docs and release metadata for `v0.7.7`:
  - `README.md`
  - `docs/README_ko.md`
  - `docs/index.html`
  - `docs/history.md`
  - `package.json`
  - `gemini-extension.json`

### Structural Fit Note

- OmG remains extension-native.
- Changes stay within command guidance, safety policy, and documentation; no runtime daemon, binary helper, or override-heavy setup flow was introduced.

## v0.7.6 - Hook Runtime Controls and Skill Metadata Guardrails (2026-04-15)

Added environment-driven hook controls so OmG operators can reduce noise or selectively disable shipped AfterAgent hooks without editing hook files directly, and added a maintainer-facing skill metadata integrity check.

### Changed

- Added runtime hook controls to shipped hook scripts:
  - `hooks/scripts/after-agent-usage.js`
  - `hooks/scripts/learn.js`
  - supports `OMG_HOOK_PROFILE=minimal|balanced|strict`
  - supports `OMG_DISABLED_HOOKS=usage,learn`
- Added retained-skill metadata validation:
  - `scripts/check-skill-metadata.js`
  - `npm run test:skills`
  - validates `skills/*/SKILL.md` frontmatter, duplicate skill names, and folder/name mismatches
- Removed agent-level model pinning so OmG agents inherit the active Gemini CLI runtime model:
  - `agents/*.md`
  - fixes global Flash/Auto model selection being overridden by bundled agent frontmatter
- Expanded hook-management guidance and validation:
  - `commands/omg/hooks.toml`
  - `commands/omg/hooks-validate.toml`
  - `commands/omg/doctor.toml`
- Refreshed docs and release metadata for `v0.7.6`:
  - `README.md`
  - `docs/README_ko.md`
  - `docs/index.html`
  - `docs/history.md`
  - `package.json`
  - `gemini-extension.json`

### Structural Fit Note

- OmG remains extension-native.
- Changes are limited to shipped hook scripts, prompt-policy guidance, and documentation.

## v0.7.5 - Hook Stability and Usage-State Hygiene (2026-04-14)

Focused on hook reliability for long-running OmG sessions, especially when model usage tracking or hook registration paths become noisy.

### Changed

- Split usage-monitor state into more stable buckets:
  - `hooks/scripts/after-agent-usage.js`
  - `.omg/state/quota-watch.json` can now persist session totals by model and provider in addition to the latest turn snapshot
- Expanded hook diagnostics and validation coverage:
  - `commands/omg/hooks.toml`
  - `commands/omg/hooks-validate.toml`
  - `commands/omg/doctor.toml`
  - duplicate extension/manual hook registration risk is now called out explicitly when repeated AfterAgent output is suspected
- Refreshed docs and release metadata for `v0.7.5`:
  - `README.md`
  - `docs/README_ko.md`
  - `docs/index.html`
  - `docs/history.md`
  - `package.json`
  - `gemini-extension.json`

### Structural Fit Note

- OmG remains extension-native.
- Changes are limited to hook/runtime state handling, diagnostics guidance, and documentation.

## v0.7.4 - Baseline-Aware Lane Guardrails (2026-04-13)

Strengthened OmG's multi-lane workflow safety by making branch/HEAD baselines explicit across workspace, taskboard, planning, and execution handoffs.

### Changed

- Added lane baseline branch/HEAD anchors to state and handoff guidance:
  - `commands/omg/workspace.toml`
  - `commands/omg/taskboard.toml`
  - `commands/omg/team-plan.toml`
  - `commands/omg/team-prd.toml`
  - `commands/omg/team-exec.toml`
  - `commands/omg/team.toml`
- Added baseline integrity as a core execution safety rule:
  - `context/omg-core.md`
- Expanded status/doctor coverage for baseline drift:
  - `commands/omg/status.toml`
  - `commands/omg/doctor.toml`
- Refreshed docs to explain baseline-aware lane guardrails and updated release metadata:
  - `README.md`
  - `docs/README_ko.md`
  - `docs/index.html`
  - `docs/history.md`
  - `package.json`
  - `gemini-extension.json`

### Structural Fit Note

- OmG remains extension-native.
- Changes are limited to prompt/state-policy surfaces that fit Gemini CLI extensions cleanly.
- No daemon, binary helper, or runtime shim was introduced.

## v0.7.3 - Stage-Gate and Runtime Signal Hardening (2026-04-08)

Focused on extension-native reliability improvements for multi-lane execution, cancellation recovery, and deterministic resume behavior.

### Added

- Workspace-aware usage monitor context:
  - `hooks/scripts/after-agent-usage.js`
  - new runtime knob: `OMG_USAGE_CWD_MODE=off|leaf|parent-leaf|full` (default `parent-leaf`)
  - usage lines now emit compact `cwd=...` context for easier lane/worktree identification in parallel sessions.
- Stop/cancel signal persistence contract:
  - `commands/omg/stop.toml`
  - `commands/omg/cancel.toml`
  - stop/cancel flows now explicitly persist `.omg/state/cancel-signal.json` for deterministic resume handoff.

### Changed

- Stop/cancel flows now clear stale `skill-active` markers when no skill is actively running:
  - `commands/omg/stop.toml`
  - `commands/omg/cancel.toml`
- Staged execution now enforces prerequisite readiness before implementation:
  - `commands/omg/team-exec.toml`
  - blocks execution slices when `team-plan` task graph or `team-prd` acceptance artifacts are missing.
- Doctor diagnostics now detect additional workflow drift:
  - `commands/omg/doctor.toml`
  - checks for stale `skill-active`, stale/missing `cancel-signal`, and execution-before-readiness drift.
- Core safety policy now codifies the same stage gate:
  - `context/omg-core.md`
- README, Korean README, and landing page refreshed for `v0.7.3`:
  - `README.md`
  - `docs/README_ko.md`
  - `docs/index.html`
- Extension/package version bumped to `0.7.3`:
  - `package.json`
  - `gemini-extension.json`

### Structural Fit Note

- OmG remains extension-native.
- Changes are limited to command contracts, hook runtime behavior, and documentation/state guidance without new daemons or external service dependencies.

## v0.7.2 - Workflow and Runtime Hygiene (2026-04-07)

Applied extension-structure-compatible workflow/runtime hygiene improvements for OmG.

### Added

- Learn-signal cooldown control for reduced nudge noise:
  - `hooks/scripts/learn.js`
  - new config key: `prompt_cooldown_minutes` (default `45`)
  - suppresses repeated `/omg:learn` nudges across short back-to-back sessions while preserving deep-interview lock suppression and transcript dedupe behavior.
- Version sync utility for release hygiene:
  - `scripts/sync-version.js`
  - syncs `package.json` and `gemini-extension.json` version metadata from one command.

### Changed

- Version consistency check now also validates sync-script availability:
  - `scripts/check-version.js`
- Version-check workflow now triggers on release script changes:
  - `.github/workflows/version-check.yml`
- Intent/doctor guidance now emphasizes staged workflow order and drift checks:
  - `commands/omg/intent.toml`
  - `commands/omg/doctor.toml`
- README, Korean README, and landing page refreshed for `v0.7.2`:
  - `README.md`
  - `docs/README_ko.md`
  - `docs/index.html`
- Extension/package version bumped to `0.7.2`:
  - `package.json`
  - `gemini-extension.json`

### Structural Fit Note

- OmG remains extension-native.
- Imported changes are limited to prompt/hook/script/documentation surfaces and do not introduce runtime daemons or external worker services.

## v0.7.1 - Deterministic Taskboard and Fallback Routing (2026-04-06)

Hardened OmG's extension-native task orchestration with deterministic queueing and agent-unavailable fallback handling.

### Added

- Priority-aware taskboard policy with null-safe defaults:
  - `commands/omg/taskboard.toml`
  - `commands/omg/team-plan.toml`
  - `commands/omg/team-prd.toml`
  - Uses explicit `p0|p1|p2|p3` ordering and defaults missing priority to `p2`.
- Agent-unavailable fallback routing contract (`agent not found` style recovery):
  - `commands/omg/team-exec.toml`
  - `commands/omg/team-assemble.toml`
  - `commands/omg/team.toml`
  - Adds one-shot fallback reroute (`omg-executor` -> `omg-quick` for low-risk slices, otherwise reroute via `omg-director`).

### Changed

- Verification/fix ordering now keeps priority context explicit:
  - `commands/omg/team-verify.toml`
  - `commands/omg/team-fix.toml`
- Runtime diagnostics now detect task-priority/fallback drift:
  - `commands/omg/doctor.toml`
  - `commands/omg/status.toml`
  - `context/omg-core.md`
- README, Korean README, and landing page refreshed for the new taskboard/fallback workflow:
  - `README.md`
  - `docs/README_ko.md`
  - `docs/index.html`
- Extension/package version bumped to `0.7.1`:
  - `package.json`
  - `gemini-extension.json`

### Structural Fit Note

- OmG remains extension-native; this release adds command/state-policy hardening only.
- No runtime daemon, external worker service, or binary patch flow was introduced.

## v0.7.0 - Model Selection Policy Controls (2026-04-05)

Added an extension-native model policy control surface so operators can intentionally choose between lane-balanced defaults, runtime auto-model selection, or explicit per-lane custom mapping.

### Added

- New command:
  - `commands/omg/model.toml`
  - Exposes `/omg:model` for `balanced|auto|custom` strategy management.
- Model-policy state contract:
  - `.omg/state/model.json` guidance now documents persisted strategy and lane model map.

### Changed

- Updated model strategy messaging and command map:
  - `README.md`
  - `docs/README_ko.md`
- Landing page now reflects model policy controls in:
  - latest update section
  - model allocation notes
  - capability matrix
  - interface map
  - runbook
  - troubleshooting
  - `docs/index.html`
- Extension/package version bumped to `0.7.0`:
  - `package.json`
  - `gemini-extension.json`

### Structural Fit Note

- OmG remains extension-native; this release adds command-level policy guidance and state contracts only.
- No runtime daemon, external service dependency, or binary patch flow was introduced.

## v0.6.0 - Gemini CLI Compatibility Sync (2026-04-03)

Historical compatibility-check details for this release are superseded by the 2026-05-13 guidance at the top of this file.

## v0.5.0 - Prompt Ops Hardening (2026-04-01)

Adapted operational prompt patterns from the public Claude Code system-prompt breakdown into OmG's extension-native orchestration surfaces, focusing on safer delegation, stricter evidence gates, and denial-aware recovery paths.

### Added

- Critical-path vs sidecar delegation policy across team orchestration:
  - `commands/omg/team-assemble.toml`
  - `commands/omg/team.toml`
  - `commands/omg/team-plan.toml`
- Explicit execution-discipline guidance in core context:
  - `context/omg-core.md`
- Stronger verification posture with `pass|fail|unknown` evidence discipline:
  - `commands/omg/team-verify.toml`
  - `agents/reviewer.md`
  - `agents/verifier.md`

### Changed

- Updated role contracts for orchestration and implementation discipline:
  - `agents/director.md`
  - `agents/planner.md`
  - `agents/executor.md`
- Hardened fix-stage and denial handling:
  - `commands/omg/team-exec.toml`
  - `commands/omg/team-fix.toml`
- Updated retained-skill diagnostics coverage:
  - `commands/omg/doctor.toml` now validates `plan`, `omg-plan`, `execute`, `prd`, `ralplan`, `research`, `deep-dive`, and `context-optimize`
- Updated planning/execution skills:
  - `skills/plan/SKILL.md`
  - `skills/execute/SKILL.md`
- README, Korean README, and landing page now document the new guardrails.
- Extension/package version bumped to `0.5.0`.

### Structural Fit Note

- OmG remains extension-native; no runtime daemon, external agent service, or binary patching flow was introduced.
- Changes are prompt/skill/state-policy level only, aligned with Gemini CLI extension primitives.

## v0.4.6 - Deep-Dive Discovery Skill (2026-03-31)

Added an extension-native discovery stage that runs trace-first analysis and escalates to interview prompts only when ambiguity remains.

### Added

- New retained skill:
  - `skills/deep-dive/SKILL.md` (`$deep-dive`)
- Structured discovery outputs:
  - clarity score (`low/medium/high`)
  - assumption ledger for unresolved or provisional decisions
  - launch brief summary for handoff into planning/execution
- Optional state artifacts for durable handoff:
  - `.omg/state/interview-context.json`
  - `.omg/state/launch-brief.md`

### Changed

- README, Korean README, and landing page now document `$deep-dive` behavior and retained skill count update.
- Extension/package version bumped to `0.4.6`.

### Structural Fit Note

- OmG remains extension-native; no runtime daemon or background worker was introduced.
- The feature is implemented as prompt/skill/state-file behavior within Gemini CLI extension boundaries.

## v0.4.5 - Deep-Interview Lock Nudge Suppression (2026-03-30)

Adapted OmG hook behavior for deep-interview safety: when deep-interview lock state is active, automated learn nudges are suppressed so interview flow can continue without interruptions.

### Added

- Deep-interview lock input support in learn-signal flow:
  - read-only lock source: `.omg/state/deep-interview.json`
- Additional learn-state visibility fields:
  - `deep_interview_lock_active`
  - `deep_interview_lock_source`

### Changed

- `hooks/scripts/learn.js` now:
  - suppresses nudges when deep-interview lock state is active
  - keeps informational-query filtering, transcript deduplication, and fail-open safety behavior
  - resolves lock-state path through `OMG_STATE_ROOT` when provided
  - treats recently updated lock snapshots as active for backward-compatible state schemas
- README, Korean README, and landing page now document deep-interview lock suppression behavior.
- Extension/package version bumped to `0.4.5`.

### Structural Fit Note

- OmG remains extension-native; no runtime daemon or background worker was introduced.
- The update is hook/state-level only, aligned to existing extension boundaries.

## v0.4.4 - Learn-Signal Safety Hardening (2026-03-26)

Hardened the learn-signal hook path so `/omg:learn` nudges fire only when sessions include actionable implementation intent, while remaining retry-safe under repeated transcript snapshots.

### Added

- New learn-signal state artifact:
  - `.omg/state/learn-watch.json`
- New learn-signal hook registration:
  - `hooks/hooks.json` (`AfterAgent` -> `omg-learn-signal-after-agent`)

### Changed

- `hooks/scripts/learn.js` now:
  - filters informational-only query sessions
  - deduplicates repeated transcript snapshots with a stable event key
  - sanitizes malformed/legacy prior state before reuse
  - keeps fail-open behavior and supports `OMG_STATE_ROOT` plus `OMG_HOOKS_QUIET`
- README, Korean README, and landing page now document learn-signal filtering and state behavior.
- Extension/package version bumped to `0.4.4`.

### Structural Fit Note

- OmG remains extension-native; no runtime daemon or background worker was introduced.
- Safety hardening stays prompt/state-level and keeps hook operation compact for long sessions.

## v0.4.3 - AfterAgent Deduplication and Retry Safety (2026-03-24)

Hardened the built-in AfterAgent usage monitor so repeated hook retries or fallback replays against the same transcript snapshot are treated as already delivered instead of double-printing the same usage line.

### Added

- Transcript fingerprinting for the usage monitor:
  - `hooks/scripts/after-agent-usage.js` now tracks a stable event key per session/transcript snapshot
  - repeated hook invocations against the same snapshot now short-circuit without emitting duplicate output

### Changed

- `hooks/scripts/after-agent-usage.js` now persists the last processed transcript fingerprint in `.omg/state/quota-watch.json`.
- Usage-monitor state now keeps the retry-safe transcript hash alongside the turn counter and usage snapshot when transcript data is available.
- README, Korean README, and landing page updated with retry-safe usage-monitor notes.
- Extension/package version bumped to `0.4.3`.

### Structural Fit Note

- OmG remains extension-native; no runtime daemon or background worker was introduced.
- The change keeps hook retries idempotent without adding new runtime dependencies or delivery channels.

## v0.4.2 - Skills and Footer Compatibility Alignment (2026-03-21)

Historical compatibility-check details for this release are superseded by the 2026-05-13 guidance at the top of this file.

## v0.4.1 - Usage Monitor Runtime Knobs (2026-03-20)

Added lightweight runtime controls to the built-in AfterAgent usage monitor so long sessions can reduce noise and redirect state persistence without changing the core extension flow.

### Added

- New usage-monitor runtime environment controls:
  - `OMG_HOOKS_QUIET=1` to suppress non-essential hook status output
  - `OMG_STATE_ROOT=<dir>` to store `quota-watch.json` outside the default `.omg/state` path

### Changed

- `hooks/scripts/after-agent-usage.js` now resolves state storage via `OMG_STATE_ROOT` when set.
- Usage monitor state writes are now fail-open to avoid blocking parent workflow execution on local I/O failures.
- README, Korean README, and hook engineering guide updated with v0.4.1 runtime knob documentation and examples.
- Extension/package version bumped to `0.4.1`.

### Structural Fit Note

- OmG remains extension-native; no new runtime daemon or background process was introduced.
- Changes are scoped to hook runtime behavior and documentation for safer, quieter operation in long-running sessions.

## v0.3.9 - Workspace Hygiene and Hook Symmetry (2026-03-12)

Adapted OmG's extension-side orchestration to recent upstream Gemini CLI changes around dirty worktree safety, hook lifecycle consistency, and subagent policy/handoff clarity without adding runtime daemons or heavier always-on context.

### Added

- New workspace sub-action:
  - `/omg:workspace audit`
- New workspace/taskboard state conventions:
  - lane cleanliness/trust/handoff notes inside `.omg/state/workspace.json`
  - lane-health notes inside `.omg/state/taskboard.md`
- New hook lifecycle policy conventions:
  - blocked and early-finish derived hook signals
  - before/after symmetry and continuation re-entry rules in `.omg/state/hooks.json`

### Changed

- `workspace`, `taskboard`, `doctor`, `intent`, `launch`, and `status` now treat dirty/untrusted lane state as a first-class operational risk.
- `hooks`, `hooks-init`, `hooks-validate`, and `hooks-test` now validate lifecycle symmetry and blocked-continuation safety-lane re-entry.
- `team-assemble`, `team-plan`, `team-prd`, `team-exec`, `team-verify`, `team`, `stop`, and `cancel` now keep lane/subagent context explicit while collapsing normal-success verbosity.
- README, Korean README, and landing page were updated with workspace audit and hook symmetry guidance. The compatibility baseline from that release is superseded by the 2026-05-13 section above.
- Extension/package version bumped to `0.3.9`.

### Structural Fit Note

- OmG remains extension-native: no runtime daemon, background worker, or terminal hook injector was added.
- Changes are intentionally prompt/state-level so long sessions stay compact and performance-safe.

## v0.3.8 - Workspace and Taskboard Control (2026-03-11)

Added a lightweight control layer inspired by recent worktree-aware planning and stricter completion gates in related harnesses, adapted to OmG's extension-native command/state model.

### Added

- New workspace/taskboard commands:
  - `/omg:workspace`
  - `/omg:taskboard`
- New runtime-state conventions:
  - `.omg/state/workspace.json`
  - `.omg/state/taskboard.md`

### Changed

- `team-plan` now emits stable task IDs, workspace lane hints, and taskboard sync guidance.
- `team-prd`, `team-exec`, and `team-verify` now align acceptance criteria, implementation slices, and verifier evidence to shared task IDs.
- `team`, `team-assemble`, `loop`, and `autopilot` now treat verifier-backed taskboard completion as part of done criteria.
- `launch`, `status`, `checkpoint`, `stop`, `cancel`, `cache`, `optimize`, `intent`, and `doctor` now recognize workspace/taskboard state.
- README, Korean README, and landing page updated with workspace/taskboard flows and cache-stability guidance.
- Extension/package version bumped to `0.3.8`.

### Structural Fit Note

- OmG stays extension-native: no new runtime daemon, background worker, or git wrapper was added.
- Workspace/taskboard state is intentionally compact so long sessions can resume from a stable file anchor instead of replaying verbose chat history.

## v0.3.7 - Load Surface Cleanup (2026-03-10)

Fixed the extension manifest/context chain and reduced duplicated discovery surface so OmG loads through a thinner always-on prompt.

### Added

- New root extension context entrypoint:
  - `GEMINI.md`

### Changed

- `GEMINI.md` now imports `context/omg-core.md`, matching the manifest's `contextFileName`.
- `context/omg-core.md` trimmed to stable runtime rules only.
- Mirrored control-plane skills were removed; retained skills are now:
  - `$plan`
  - `$execute`
  - `$prd`
  - `$ralplan`
  - `$research`
  - `$context-optimize`
- High-traffic `/omg:*` commands were shortened by removing repeated output-format boilerplate.
- `doctor` diagnostics now validate the real context import chain and retained skill set.
- Extension/package version bumped to `0.3.7`.

### Structural Fit Note

- OmG is now explicitly slash-command-first for operational control.
- Deep-work skills remain available, but overlapping command/skill mirrors were intentionally removed to shrink startup discovery overhead.

## v0.3.6 - Notification Routing (2026-03-10)

Added an extension-native notification policy layer so OmG can surface approvals, verification failures, blockers, checkpoints, and idle drift without depending on custom CLI flags.

### Added

- New notification command and skill:
  - `/omg:notify`
  - `$notify`
- New runtime-state conventions:
  - `.omg/state/notify.json`
  - `.omg/notify/*.md`

### Changed

- `context/omg-core.md` updated with notification controls, persisted state conventions, and worker-session notification safety rails.
- README, Korean README, and landing page updated with notification profile, channel, and activation guidance.
- Extension/package version bumped to `0.3.6`.

### Structural Fit Note

- OmG notification routing remains extension-native and policy-driven.
- Actual desktop/webhook delivery is intentionally delegated to Gemini host hooks, shell adapters, or project-specific bridges.

## v0.3.5 - Dynamic Agent Team Assembly (2026-03-04)

Added an approval-gated dynamic team composition layer so OmG can assemble fit-for-task rosters before stage execution.

### Added

- New team assembly command and skill:
  - `/omg:team-assemble`
  - `$team-assemble`
- New specialist sub-agents:
  - `omg-director`
  - `omg-consultant`
  - `omg-editor`
- New guide:
  - `docs/guide/agent-team-assembly.md`
- New runtime-state convention:
  - `.omg/state/team-assembly.md`

### Changed

- `team` orchestration now supports optional stage-0 dynamic assembly.
- `intent` routing expanded with `team-assemble` classification path.
- `context/omg-core.md` updated with stage-0 lifecycle and roster state conventions.
- README, installation guide, and landing page expanded with team assembly flows, role taxonomy, and model-allocation policy.
- Extension/package version bumped to `0.3.5`.

### Structural Fit Note

- OmG remains extension-native: assembly is prompt/state orchestrated.
- Team collaboration is modeled through explicit handoffs and verify/fix loops, not hidden runtime daemons.

## v0.3.4 - Deterministic Hook Orchestration (2026-02-28)

Added a hook-oriented orchestration layer inspired by additive hook-extension workflows, adapted for Gemini extension-native command/skill/state primitives.

### Added

- New hook command group:
  - `/omg:hooks`
  - `/omg:hooks-init`
  - `/omg:hooks-validate`
  - `/omg:hooks-test`
- New hook control skill:
  - `$hooks`
- New hook engineering guide:
  - `docs/guide/hook-engineering.md`
- New runtime-state artifacts for hook policy and verification:
  - `.omg/state/hooks.json`
  - `.omg/state/hooks-validation.md`
  - `.omg/state/hooks-last-test.md`
  - `.omg/hooks/*.md`

### Changed

- `context/omg-core.md` updated with hook controls, hook state conventions, and worker-session side-effect safety rail.
- README command/skill/docs map expanded with hook workflows.
- Extension/package version bumped to `0.3.4`.

### Structural Fit Note

- OmG hook workflows remain extension-native (prompt/state-driven), not low-level terminal/runtime hook injection.
- Deterministic lanes and validation/test commands provide predictable behavior before autonomous execution loops.

## v0.3.3 - Claude-Style Memory Management (2026-02-28)

Integrated a Claude-style memory model into OmG using a compact root index, topic-split memory files, and path-aware modular rules.

### Added

- New memory command and skill:
  - `/omg:memory`
  - `$memory`
- New memory MCP tools:
  - `memory_bootstrap`
  - `memory_index_sync`
  - `memory_rules_resolve`
  - `memory_build_context`
- New file-based memory/rules guide:
  - `docs/guide/memory-management.md`
- New reusable memory scaffold assets generated by setup/bootstrap:
  - `MEMORY.md`
  - `.omg/memory/*.md`
  - `.omg/rules/*.md`

### Changed

- `omg setup` now bootstraps project memory index/topic/rule files.
- `context/omg-core.md` updated with memory command and runtime memory artifact conventions.
- README and landing docs updated to expose memory workflow in command/skill/interface maps.

### Structural Fit Note

- The memory workflow is implemented within extension-native assets and MCP tooling.
- Rule activation uses frontmatter (`description`, `globs`, `alwaysApply`) for task-conditional loading without bloating base context.

## v0.3.2 - HUD Visibility Controls (2026-02-26)

Added extension-native visual status controls inspired by statusline/HUD workflows from related harness projects.

### Added

- New HUD profile commands:
  - `/omg:hud`
  - `/omg:hud-on`
  - `/omg:hud-compact`
  - `/omg:hud-off`
- New HUD control skill:
  - `$hud`
- New runtime-state artifact for HUD profile persistence:
  - `.omg/state/hud.json`

### Changed

- `/omg:status` now renders a HUD section with visibility policy (`normal`, `compact`, `hidden`).
- `context/omg-core.md` updated with HUD control conventions.
- Local dashboard HUD now supports density toggle with `h` (`normal -> compact -> hidden`), top summary line, and `.omg/state/hud.json` sync.
- Extension/package version bumped to `0.3.2`.

### Structural Fit Note

- Gemini Extensions currently support prompt/command/skill/state-driven visual summaries.
- Direct terminal statusline hook injection remains runtime-specific and outside extension-only primitives.

## v0.3.1 - Intent and Loop Guardrail Expansion (2026-02-26)

Added extension-native guardrail workflows inspired by cross-harness operational patterns.

### Added

- New intake/routing command and skill:
  - `/omg:intent`
  - `$intent`
- New loop enforcement command and skill:
  - `/omg:loop`
  - `$loop`
- New deep repository bootstrap command and skill:
  - `/omg:deep-init`
  - `$deep-init`
- New conditional rule injection command and skill:
  - `/omg:rules`
  - `$rules`
- New runtime-state artifacts for extension-guided persistence:
  - `.omg/state/intent.md`
  - `.omg/state/rules.md`
  - `.omg/state/deep-init.md`
  - `.omg/state/project-map.md`
  - `.omg/state/validation.md`

### Changed

- `context/omg-core.md` updated with intent-gating, conditional-rule, deep-init, and loop-discipline conventions.
- README command/skill map expanded with the new guardrail workflows.
- Extension/package version bumped to `0.3.1`.

### Structural Fit Note

- Extension-manifest primitives can represent policy-oriented orchestration (`commands/`, `skills/`, `context/`) directly.
- Runtime hook workers, background daemons, and low-level event hooks still require separate runtime code beyond extension-only assets.

## v0.3.0 - Workflow and Mode Expansion (2026-02-25)

Added key orchestration capabilities inspired by production usage patterns from related repositories.

### Added

- Stage commands:
  - `team-plan`
  - `team-prd`
  - `team-exec`
  - `team-verify`
  - `team-fix`
- Mode/lifecycle commands:
  - `autopilot`
  - `ralph`
  - `ultrawork`
  - `consensus`
  - `mode`
  - `launch`
  - `checkpoint`
  - `stop`
- New specialist agents:
  - `omg-product`
  - `omg-verifier`
  - `omg-consensus`
- New workflow skills:
  - `$ralplan`
  - `$prd`
  - `$autopilot`
  - `$ralph`
  - `$ultrawork`
  - `$consensus`
  - `$mode`
  - `$cancel`

### Changed

- `team` orchestration switched to stage-based lifecycle with verify/fix loops.
- `status` report expanded to include mode and pipeline stage.
- Core context updated with mode profiles, lifecycle state conventions, and safety rails.
- Extension/package version bumped to `0.3.0`.

## v0.2.0 - Extensions-First Rebuild (2026-02-24)

Reimplemented OmG around Gemini CLI's official Extensions model.

### Added

- Root extension manifest: `gemini-extension.json`
- Extension-first package metadata and files list in `package.json`
- Sub-agent definitions in `agents/`
- Shared extension context in `context/omg-core.md`
- Namespaced extension commands in `commands/omg/`
- Frontmatter-based skills in `skills/`

### Changed

- Installation flow migrated to `gemini extensions install <repo-url>`
- Documentation rewritten for extension-native usage and command naming
- Runtime entry shifted from setup scripts to manifest-driven loading

### Removed

- Legacy root-level command templates that depended on `!{omg ...}` shell execution

### Migration Summary

| Before | After |
| --- | --- |
| Global package + setup copier | Native extension install via `gemini extensions` |
| Script-first runtime bootstrap | Gemini extension manifest bootstrap |
| Mixed onboarding instructions | Single extension-first install path |

## v0.1.4 - Gemini CLI Runtime Integration Hardening (2026-02-23)

### Added

- MCP stdio entry support via `@modelcontextprotocol/sdk` (`--mcp`)
- `--server <state|memory|context|orchestrator>` server-targeted execution
- Extended `omg status` options (`--agents`, `--tasks`, `--cache`, `--cache-history`, `--context`, `--json`)

### Changed

- `omg setup` updated to register all 4 OmG MCP servers in `~/.gemini/settings.json`
- `omg doctor` updated to validate all required OmG MCP server registrations
- Prompt argument wiring adjusted for Gemini CLI compatibility (`-p` path)
- Config loading unified via shared config module flow

### Impact Matrix

| Area | Effect |
| --- | --- |
| MCP interoperability | Better alignment with Gemini CLI runtime expectations |
| Diagnostics | More reliable setup verification and status visibility |
| Automation | Cleaner path for bot-driven execution workflows |

## v0.1.3 - Installation Path Stabilization (2026-02-23)

### Changed

- GitHub install route promoted as the primary onboarding path
- npm registry route kept as optional path
- Gemini CLI package naming corrected in docs (`@google/gemini-cli`)
- Troubleshooting section expanded for install-time `404` errors

### Tooling

- Added package lifecycle scripts (`prepare`, `prepack`) for build consistency

## v0.1.2 - Model and Branding Consistency (2026-02-22)

### Changed

- Model references standardized to explicit Gemini preview model names used at the time (`gemini-3.1-pro-preview` and `gemini-3-flash-preview`)
- Agent label output updated to display full model names
- Project brand text normalized from `OMG` to `OmG`
- Tagline changed to: `Gemini thinks. OmG orchestrates.`

## v0.1.1 - Retro Dashboard Refresh (2026-02-22)

### Added

- Retro game-style dashboard skin and status labels (`ATK`, `WIN`, `KO`, `ZZZ`, `RDY`)
- Agent-specific sprite/icon representation in dashboard panels
- HP/progress bars and party-style member display
- Quest log and battle log visualization updates

### Changed

- Docs moved under `docs/` and linked from repository root README
- Landing preview updated to match retro dashboard visuals

## v0.1.0 - Initial Release (2026-02-22)

### Added

- Core CLI command surface (`setup`, `doctor`, `team`, `status`, `config`, `bot`, `update`)
- Multi-agent orchestration primitives:
  - Agent pool and worker lifecycle
  - Task routing and priority queue
  - Agent registry for architect/planner/executor/reviewer/debugger/researcher/quick roles
- Context-engineering modules:
  - Cache manager
  - Context layering
  - Compaction and prefix optimization
- MCP server set:
  - `omg_state`
  - `omg_memory`
  - `omg_context`
  - `omg_orchestrator`
- Initial docs set (`README`, guides, landing page)

## Compatibility Notes

Current compatibility guidance is maintained in the 2026-05-13 section at the top of this file.

| Component | Supported path in this repo |
| --- | --- |
| Gemini CLI baseline | `v0.42.0+` |
| Extension workflow | `gemini extensions install/update/list/reload ...` and `/extensions list` |
| Command namespace | `/omg:*` |
| Skill namespace | retained `$skills`, including `$omg-plan` for native `/plan` collision avoidance |
## Notes

- Historical details before `v0.1.0` are not tracked.
- For commit-level details, inspect repository git history.
