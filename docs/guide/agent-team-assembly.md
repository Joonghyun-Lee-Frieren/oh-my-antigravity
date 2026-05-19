# Agent Team Assembly Guide

Use this guide to run OmA with dynamic, task-fit teams instead of fixed engineering-only rosters.

## Why Dynamic Assembly

Some requests are not pure coding tasks. They mix:

- research and evidence gathering
- strategy and decision framing
- implementation and validation
- report or content packaging

`/oma:team-assemble` builds a roster that matches this shape before execution starts.

## Command Entry Points

- `/oma:team-assemble "<task>"`
- `$team-assemble "<task>"`

These entry points create a team charter with role lanes, model profile, and handoff protocol.

## Activation

OmA assumes Gemini CLI preview features are enabled so preview-backed aliases can resolve to the newest available preview model when Gemini CLI supports it.
If the extension is loaded, `team-assemble` is available through:

- `/oma:team-assemble`
- `$team-assemble`

## Stage Model

OmA lifecycle with dynamic assembly:

1. `team-assemble` (new stage 0)
2. `team-plan`
3. `team-prd`
4. `team-exec`
5. `team-verify`
6. `team-fix`

Repeat `team-exec -> team-verify -> team-fix` until criteria pass or blockers are explicit.

## Role Taxonomy

Team assembly separates two role families:

- Domain specialists:
  - `oma-researcher`
  - `oma-architect`
  - `oma-consultant`
  - `oma-executor`
- Format specialists:
  - `oma-editor`
  - `oma-reviewer`
  - `oma-verifier`
  - `oma-debugger`

Orchestration lane:

- `oma-director` coordinates handoffs and resolves conflicts.

## Model Allocation Policy

Default role-to-model policy:

- judgment and acceptance gates: `pro`
- implementation-heavy execution: `flash`
- broad low-risk exploration: `flash-lite`

With Gemini CLI preview features enabled, `pro` can resolve to the latest preview-capable Pro route without OmA hard-pinning an aging concrete model name.

## Approval Gate

`team-assemble` proposes first, then asks:

`Proceed with this team? (yes/no)`

Execution starts only when explicit approval is present (for example: `yes`, `approve`, `go`, `run`).

## Example Team Patterns

### 1) Competitor Analysis + Executive Brief

Suggested roster:

- `oma-director`
- `oma-researcher` x3 (parallel lanes)
- `oma-consultant`
- `oma-editor`
- `oma-reviewer` (quality gate)

### 2) Feature Delivery with Validation Discipline

Suggested roster:

- `oma-director`
- `oma-planner`
- `oma-product`
- `oma-executor`
- `oma-reviewer`
- `oma-verifier`
- `oma-debugger`

### 3) Research-to-Implementation Bridge

Suggested roster:

- `oma-director`
- `oma-researcher` x2
- `oma-architect`
- `oma-executor`
- `oma-verifier`
- `oma-editor`

## State Files

When filesystem tools are available, OmA can persist:

- `.omg/state/team-assembly.md`
- `.omg/state/workflow.md`

Use these to resume sessions without rebuilding the full decision context.

## Recommended Sequence

```text
/oma:doctor team
/oma:intent "<task>"
/oma:team-assemble "<task>"
# approve roster
/oma:team "<same task>"
/oma:loop "Continue unresolved verify backlog"
```

## Failure Handling

If the team stalls:

1. Re-run `/oma:team-assemble` with tighter constraints.
2. Reduce lane count and simplify role overlap.
3. Force verification-first loop via `/oma:team-verify`.
4. Use `/oma:consensus` when strategy lanes disagree.

