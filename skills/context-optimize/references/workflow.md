Follow [the guard contract](../../../docs/guide/guarded-workflow.md) first; it overrides any legacy shared-state or same-turn execution guidance.

## Purpose

Use this skill when context is growing quickly or cache consistency drops.

## Trigger

- Conversation becomes long and repetitive
- The model loses thread coherence
- Frequent prompt restarts or unstable behavior appears

## Workflow

1. Identify repeated, stale, or low-value context.
2. Detect likely cache breakers (instruction churn, unstable prefixes).
3. Propose cache-safe compaction and message hygiene rules.
4. Produce an actionable operating checklist for next turns.

## Output Template

```markdown
## Context Health
- ...

## Cache Risks
- ...

## Optimization Actions
1. ...
2. ...
3. ...

## Session Rules
- ...
```

## Notes

- Keep stable instructions unchanged during a session.
- Prefer summaries over re-sending raw large blocks.
