# oh-my-antigravity (OmA)

[![Version](https://img.shields.io/badge/version-1.0.0-0d8a83)](docs/history.md)
[![Checks](https://img.shields.io/github/actions/workflow/status/Joonghyun-Lee-Frieren/oh-my-antigravity/version-check.yml?branch=main&label=checks)](https://github.com/Joonghyun-Lee-Frieren/oh-my-antigravity/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Website](https://joonghyun-lee-frieren.github.io/oh-my-antigravity/) · [History](docs/history.md) · [한국어](docs/README_ko.md) · [日本語](docs/README_ja.md) · [Français](docs/README_fr.md) · [中文](docs/README_zh.md) · [Español](docs/README_es.md)

A native **Antigravity CLI plugin** for engineering work with separate design turns,
read-only documentation agents, gated edits, real verification evidence, and small reviews.

<p align="center"><img src="resources/image/oma_logo_02.png" alt="OmA" width="360"></p>

## Install

Requires current Antigravity CLI and Node.js 20+.

```bash
agy plugin install https://github.com/Joonghyun-Lee-Frieren/oh-my-antigravity
agy plugin list
```

Inside the CLI, inspect `/plugin list` and `/hooks`, then start with:

```text
/oma-team-plan Describe the change and its acceptance criteria
```

The documentation reader returns a concise summary. The parent seals the file scope,
acceptance criteria, and executable checks, then **ends the design turn**. In your next turn:

```text
/oma-team-exec Implement the sealed plan
```

Run `/oma-team-verify` to collect remaining section reviews. Stop schedules repair batches
when checks or reviews fail. Missing services, permissions, or evidence can end in
`blocked` or `unknown`; success is never a required answer.

Read the [guarded workflow guide](docs/guide/guarded-workflow.md) for exact controller
commands, JSON examples, recovery, and enforcement limits.

## What's new in v1.0.0

| Change | Result |
| --- | --- |
| Native plugin layout | `plugin.json`, root `hooks.json`, `rules/`, and YAML skills |
| Thin skill entrypoints | Every `SKILL.md` stays within 20 lines; detailed procedures load on demand |
| Documentation first | `oma-doc-reader` has native read-only tools and passes summaries with sources/unknowns |
| Separate turns | Implementation stays blocked until the sealed design execution has stopped |
| PreToolUse gate | Exact scope, owner checks, protected evidence, restricted shell, and test-integrity checks |
| Real verification | Sealed argv checks produce actual exit codes, logs, and source hashes |
| Stop repair batches | At most three registered repair units per execution; bounded retries and explicit blockers |
| Passed-file locks | Files lock after all covering checks and section reviews pass |
| Section reviews | Hook constructs one <=120-line source section per reviewer invocation; stale hashes cannot pass |
| Current models | Gemini 4 Argon and Gemini 3.8 Flash replace old preview defaults |

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

The plugin exposes 56 short skills, including 45 `/oma-<name>` command entrypoints,
and 15 capability-limited agents. Use only the procedures relevant to the current task.

| Command | Purpose |
| --- | --- |
| `/oma-team-plan`, `/oma-team-prd` | Documentation handoff, scope, acceptance criteria, and design |
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
`oma-reviewer` examines one bounded section; `oma-verifier` checks acceptance evidence.
Every shipped worker excludes write, shell, MCP, and delegation tools.

The authoritative workflow state is `.omg/state/guard.json`; execution logs live in
`.omg/evidence/`. Agents use `.omg/drafts/` for requests and auxiliary notes. The controller
alone owns guard state and evidence. One workspace and one writer are allowed per workflow;
use separate workflows for isolated worktrees.

## Upgrade from Gemini CLI / v0.9

Install the native plugin using `agy plugin install`. Native commands now use
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

## Special thanks

**Special thanks to [@hyunuk.lim](https://www.threads.com/@hyunuk.lim) (threads).** Their threads and posts were a major
help in shaping this refactor: smaller skills, physical tool constraints, honest
failure, bounded repairs, and focused reviews.

The project also grew from Jeongkyu Shin's observation that the engineering harness
around a model matters alongside the model itself.

[MIT License](LICENSE) · [Sponsor](https://github.com/sponsors/Joonghyun-Lee-Frieren)
