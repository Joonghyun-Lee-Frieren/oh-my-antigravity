---
name: "plan"
description: "Create a phased, dependency-aware implementation plan with risks, validation checkpoints, and rollback notes. Use when the request is non-trivial and should be planned before editing code, scope touches multiple files or subsystems, or work needs sequencing and parallelization decisions."
user-invocable: true
triggers:
  - "plan this feature"
  - "create implementation plan"
  - "break down this task"
  - "strategy for migration"
  - "roadmap for changes"
---

## Purpose

Convert a non-trivial request into a phased execution plan before any code changes begin.

## Trigger

- User asks for strategy, roadmap, or migration plan
- Scope touches multiple files or subsystems
- Work needs sequencing or parallelization decisions

## Workflow

1. Restate goals, constraints, and acceptance criteria.
2. Inspect only the repository areas required for planning.
3. Keep this stage read-only — no edits.
4. Break work into phases and atomic tasks.
5. Mark dependencies, critical path tasks, and parallelizable sidecars.
6. Add validation checkpoints and rollback notes.
7. List 3-5 critical files for implementation focus.

## Output Template

```markdown
## Goal
- ...

## Phase Plan
1. Phase 1 - ...
2. Phase 2 - ...

## Task Breakdown
1. ...
2. ...

## Critical Files
- ...

## Risks
- ...

## Validation
- ...
```

## Notes

- Delegate architecture tradeoffs to `omg-architect` when needed.
- Keep plans executable and testable, not abstract.
