---
name = "execute"
description = "Implement a scoped task quickly and safely, then validate and summarize changes."
---

## Purpose

Use this skill when the task is implementation-ready and requires code changes now.

## Trigger

- User asks to implement, refactor, or fix code directly
- A plan already exists and a specific phase is selected

## Workflow

1. Confirm exact scope and acceptance criteria.
2. Read target files and lane/task state before editing.
3. Load only relevant files and preserve existing conventions.
4. Implement the smallest viable diff.
5. Prefer editing existing files over creating new files unless scope requires it.
6. Run the most relevant checks/tests.
7. Summarize changed files, validation, blockers, and remaining work.

## Output Template

```markdown
## Scope
- ...

## Files Changed
- ...

## Validation
- ...

## Blockers
- ...

## Follow-ups
- ...
```

## Notes

- Escalate to `oma-reviewer` for high-risk or cross-cutting changes.
- Use `oma-debugger` immediately when checks fail.
- If permissions/tools are denied, stop and return explicit approval/fallback needs.
