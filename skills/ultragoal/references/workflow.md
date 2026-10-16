Follow [the guard contract](../../../docs/guide/guarded-workflow.md) first; it overrides any legacy shared-state or same-turn execution guidance.

## Purpose

Use this skill to break down complex, multi-stage projects into sequential micro-goals that persist across sessions. It prevents state loss and ensures only the current active goal can be executed, verified, or updated.

## Trigger

- User requests a long-running, multi-step, or complex change spanning many files.
- The project needs repo-native tracking of progress that survives session restarts.
- Transitioning between major milestones where clear checkpoints and evidence audits are required.

## Workflow

1. **Brief & Decompose**:
   - Parse the high-level objective/brief.
   - Decompose into an ordered array of 3-7 discrete micro-goals.
   - Ensure each goal has explicit verification criteria and a defined owner/lane.

2. **Durable Persistence**:
   - Create or update `.omg/ultragoal/brief.md` containing the overall mission and constraints.
   - Initialize `.omg/ultragoal/goals.json` mapping goals to statuses (`todo`, `in-progress`, `completed`, `blocked`, `failed`).
   - Initialize `.omg/ultragoal/ledger.jsonl` to log transition records, timestamps, and verification evidence.

3. **Fail-Closed Execution**:
   - Identify the first or next `todo` goal and set its status to `in-progress`.
   - Prevent executing or planning subsequent goals until the `in-progress` goal is marked `completed` with clear validation evidence.
   - If a goal fails or is blocked, halt the workflow and prompt for troubleshooting or manual recovery.

4. **Handoff generation**:
   - Generate a precise `/oma-goal` or `/oma-team` command using the `--intent` pin pattern for the current active goal.

## Output Template

```markdown
## Active Goal
- ID: ...
- Intent: ...

## Progress Overview
- Completed: X / Y goals
- Active: [Goal Description]

## Goal Registry
| ID | Goal | Status | Verification Criteria | Evidence / Blockers |
| --- | --- | --- | --- | --- |
| ... | ... | ... | ... | ... |

## Handoff Directive
- Command: `/oma-goal "..."`
```
