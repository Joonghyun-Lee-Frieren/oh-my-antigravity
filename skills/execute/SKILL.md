---
name: "execute"
description: "Implement a scoped task by applying the smallest viable diff, running validation checks, and summarizing changed files with blockers. Use when the task is implementation-ready and requires code changes, or a plan exists and a specific phase is selected for execution."
user-invocable: true
triggers:
  - "implement this change"
  - "execute the plan"
  - "start coding"
  - "apply this fix"
  - "refactor this code"
  - "build this feature"
  - "write the code"
  - "make these changes"
---

## Purpose

Implement a scoped task quickly and safely, then validate and summarize changes.

## Trigger

- User asks to implement, refactor, or fix code directly
- A plan already exists and a specific phase is selected

## Workflow

1. Confirm exact scope and acceptance criteria from plan or user request.
2. Read target files and lane/task state before editing.
3. Load only relevant files and preserve existing conventions (indentation, naming, imports).
4. Implement the smallest viable diff — prefer edits over new files.
5. Run checks and tests relevant to the changed files:
   ```bash
   # Example: run project test suite scoped to changed area
   npm test -- --testPathPattern='<changed-module>'
   ```
6. **If checks fail** → invoke `omg-debugger` for root-cause analysis → apply fix → re-run checks → only proceed when passing.
7. Summarize changed files, validation results, blockers, and remaining work.

## Example

```text
User: "Implement Phase 2 — add retry logic to the API client"

1. Read acceptance criteria from taskboard (retry 3x with exponential backoff)
2. Read src/api/client.ts and tests/api/client.test.ts
3. Add retry wrapper in client.ts (~15-line diff)
4. Run: npm test -- --testPathPattern='api/client'
5. Tests pass → summarize: 1 file changed, 3 tests pass, no blockers
```

## Output Template

```markdown
## Scope
- Task ID, acceptance criteria, constraints

## Files Changed
- path/to/file.ts — what changed and why

## Validation
- Tests run, results, coverage notes

## Blockers
- None | list unresolved issues

## Follow-ups
- Remaining tasks or review requests
```

## Notes

- Escalate to `omg-reviewer` for high-risk or cross-cutting changes.
- Use `omg-debugger` immediately when checks fail — do not push broken code.
- If permissions or tools are denied, stop and return explicit approval/fallback needs.
