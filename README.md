# oh-my-antigravity (OmA)

[![Version](https://img.shields.io/badge/version-1.2.0-0d8a83)](docs/history.md)
[![Checks](https://img.shields.io/github/actions/workflow/status/Joonghyun-Lee-Frieren/oh-my-antigravity/version-check.yml?branch=main&label=checks)](https://github.com/Joonghyun-Lee-Frieren/oh-my-antigravity/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Website](https://joonghyun-lee-frieren.github.io/oh-my-antigravity/) · [History](docs/history.md) · [한국어](docs/README_ko.md) · [日本語](docs/README_ja.md) · [Français](docs/README_fr.md) · [中文](docs/README_zh.md) · [Español](docs/README_es.md)

A native **Antigravity CLI plugin** for engineering work with separate design turns,
read-only documentation agents, gated edits, real verification evidence, and small reviews.

<p align="center"><img src="resources/image/oma_logo_02.png" alt="OmA" width="360"></p>

## Install

Requires current Antigravity CLI and Node.js 20+. Python 3.9+ is additionally needed
when the sealed scope contains Python files.

```bash
agy plugin install https://github.com/Joonghyun-Lee-Frieren/oh-my-antigravity
agy plugin list
```

Inside the CLI, inspect `/plugin list` and `/hooks`, then start with:

```text
/oma-team-plan Describe the change and its acceptance criteria
```

Use `/oma-read` to register and fully page the source snapshots, then obtain the
documentation reader's concise summary. Use `/oma-probe` for required CLI help.
Record a Scope Brief, seal the
file scope and checks, and request an independent Design Check. After it passes,
**end the design turn**. In your next turn:

```text
/oma-team-exec Implement the sealed plan
```

Run `/oma-team-verify` to collect remaining section reviews. Stop schedules repair batches
when checks or reviews fail. Missing services, permissions, or evidence can end in
`blocked` or `unknown`; success is never a required answer.

Read the [guarded workflow guide](docs/guide/guarded-workflow.md) for exact controller
commands, JSON examples, recovery, and enforcement limits.

## What's new in v1.2.0

Validator scripts and declared check `inputs` now have recorded hashes. Changed
dependencies block start, verification, or acceptance of stale evidence. Session
Trail also reports validator drift. Every covering check result reaches the section
reviewer; up to two bounded log excerpts prioritize failures. See the
[input schema and limits](docs/guide/guarded-workflow.md) for legitimate scoped test
changes and dependency declarations. Existing sealed plans need resealing for the
new input protection.

The supplied Part 1–7 architecture now also drives enforced source-read coverage,
read-only dependency fingerprints, large-file edit limits, typed failure exits,
Python AST validation, dependency-ordered repair groups, and one-group focus on
repair oscillation. Markdown reviews split at headings, use a fresh conversation
per shard, and require disconfirmation evidence before a deterministic judge decides.

Start with `/oma-read`, `/oma-probe`, `/oma-failure`, and `/oma-repair-context`.
Read the [Part 1–7 mapping and complete schemas](docs/guide/series-runtime.md),
including migration and enforcement limits. These safeguards do not guarantee
zero defects or prove that a model understood the delivered source.

## Scope and continuity in v1.1.0

| Surface | Behavior |
| --- | --- |
| **Scope Brief** | Record the objective, constraints, non-goals, decision owners, and source conflicts; unresolved items block sealing |
| **Design Check** | A read-only auditor checks the exact plan before the design turn can close; plan changes invalidate prior review |
| **Evidence Window** | Read integrity-checked log excerpts with a bounded UTF-8 byte cursor; full output remains on disk |
| **Session Trail** | Immutable JSON/Markdown checkpoints retain the current intent and next action; resume detects source/plan drift |
| **Native review receipts** | The reviewer submits its own result from another conversation; the parent cannot author PASS or steer the review |
| **Care profiles** | Routine/elevated/critical scopes use 120/90/60-line sections and 3/2/1-unit batches, while keeping all checks and locks |

Sensitive paths can only raise care. Compact status/context packs keep full logs and
receipt tickets out of routine model context. Checks still run and missing proof
stays unknown. Read [schemas and examples](docs/guide/session-continuity.md).

## Models

Recommendations come from [config/models.json](config/models.json), checked against
[official model availability](https://antigravity.google/docs/models) on 2026-10-16.

| Lane | Balanced profile | Flash profile |
| --- | --- | --- |
| Design/planning | `gemini-4-argon-high` | `gemini-3.8-flash-high` |
| Implementation | `gemini-3.8-flash-medium` | `gemini-3.8-flash-medium` |
| Quick work | `gemini-3.8-flash-low` | `gemini-3.8-flash-low` |
| Review/verification | `gemini-4-argon-high` | `gemini-3.8-flash-high` |

Check `agy models` for your account and choose with `agy --model <id>` or the runtime
selector. Subagents use `model: inherit`. `/oma-model` explains the profiles;
`auto` means keep the selected runtime model and `custom` requires all four lanes.
Profiles are recommendations, not automatic model switching: the native hook contract
has no model-override output. If Argon is unavailable, explicitly choose the Flash
profile. Older enterprise models may remain available; they are absent from shipped defaults.

## Workflows and roles

The plugin exposes 64 short skills, including 53 `/oma-<name>` command entrypoints,
and 16 capability-limited agents. Use only the procedures relevant to the current task.

| Command | Purpose |
| --- | --- |
| `/oma-read`, `/oma-probe` | Full source-window coverage and actual bounded CLI introspection |
| `/oma-failure`, `/oma-repair-context` | Typed honest failure and active dependency-ordered repair diagnostics |
| `/oma-team-plan`, `/oma-team-prd` | Documentation handoff, scope, acceptance criteria, and design |
| `/oma-brief` | Objective, constraints, decision ownership, and source conflicts |
| `/oma-design-check` | Independent check of the exact sealed plan |
| `/oma-evidence` | Bounded, integrity-checked validator log windows |
| `/oma-checkpoint`, `/oma-resume` | Immutable handoff and read-only continuity inspection |
| `/oma-team-exec` | Apply the sealed scope in the next user turn |
| `/oma-team-verify` | Real checks and one-section review handoffs |
| `/oma-team-fix` | The Stop-selected batch of up to three repair units |
| `/oma-goal`, `/oma-ultragoal` | Delivery tracking with the same turn and evidence gates |
| `/oma-status`, `/oma-doctor` | Phase, ownership, evidence gaps, locks, and blockers |
| `/oma-model` | Current model recommendations and runtime selection |
| `/oma-hooks`, `/oma-hooks-validate` | Native hook inspection and safety diagnostics |
| `/oma-stop`, `/oma-cancel` | Stop with evidence and locks retained |

`oma-doc-reader` reads specifications. `oma-planner` and `oma-architect` help design.
`oma-executor` proposes patches; only the owning main conversation applies them.
`oma-design-auditor` checks the sealed plan. `oma-reviewer` examines one bounded section; `oma-verifier` checks acceptance evidence.
Every shipped worker excludes write, shell, MCP, and delegation tools.

The authoritative workflow state is `.omg/state/guard.json`; execution logs live in
`.omg/evidence/`. Agents use `.omg/drafts/` for requests and auxiliary notes. The controller
alone owns guard state, evidence, and checkpoints. Independent reviewer messages are
captured by the hook using the real sender identity. One workspace and one writer are allowed per workflow;
use separate workflows for isolated worktrees.

## Upgrade from v1.0 or Gemini CLI

Reinstall the native plugin using `agy plugin install`. New plans require a settled
Scope Brief and native Design Check. Independent roles need native send_message
hooks with the actual child conversation ID; missing runtime support stays unknown.
Existing v1.0 sealed state can finish through its legacy receipt path, but new plans
always use the native path. Session Trail inspects current state without restoring
old ownership, approval, or locks.

Native commands use
`/oma-team-exec`, replacing `/oma:team-exec`. The old TOML protocol sources live in
`protocols/oma/` and generate native skill wrappers; they are outside the runtime's
legacy `commands/` discovery directory to avoid duplicate registrations.

`gemini-extension.json` remains a migration marker. Remove manually copied old hooks.
The Gemini `BeforeModel` router, router trace flags, and `AfterAgent` learn nudge are
removed. Use `/oma-learn` explicitly and select models through the CLI.

Passed files remain locked, including across subsequent workflows. Reopening a lock,
changing sealed scope, or recovering blocked/foreign-owned state requires an explicit
operator action outside the guarded agent. Preserve the prior evidence when recovering.

The harness constrains agent tools; it is not an OS sandbox. Validators are trusted
project code. Behavioral checks and reviewers still need to catch semantic fabrication.
A repair unit is one failed validator or one non-passing section, which may contain
several diagnostics. See the [full contract](docs/guide/guarded-workflow.md).

## Development

```bash
npm test
npm run test:skills
npm run test:generated
npm run test:version
agy plugin validate .
```

Edit command procedures in `protocols/oma/`, then run `npm run build:skills`.
Core skill procedures live beside their entrypoints in `references/`.
Tests cover turn boundaries, shell/path bypasses, ownership, failed/missing checks,
review coverage, stale evidence, locks, repair limits, cancellation, and retry bounds.
v1.1 also covers source conflicts, design receipt invalidation, actor spoofing, replay,
care escalation, UTF-8 log paging, checkpoint corruption, and source drift on resume.

## Special thanks

**Special thanks to [@hyunuk.lim](https://www.threads.com/@hyunuk.lim) (threads).** His threads and posts were a major
help in shaping this refactor: smaller skills, physical tool constraints, honest
failure, bounded repairs, and focused reviews.

Further reading: [his Medium article on the ideas behind the v1.0 renewal](https://medium.com/@dev.hyunuk/3f86bb9b8ab7).
Thank you for sharing the concepts that helped shape OmA's engineering workflow.

The project also grew from Jeongkyu Shin's observation that the engineering harness
around a model matters alongside the model itself.

[MIT License](LICENSE) · [Sponsor](https://github.com/sponsors/Joonghyun-Lee-Frieren)
