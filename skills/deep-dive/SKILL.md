---
name = "deep-dive"
description = "Run a trace-to-interview discovery pass to remove ambiguity before planning and execution."
---

## Purpose

Use this skill when requirements are incomplete, conflicting, or too vague to begin implementation safely.

## Trigger

- User asks for implementation but goals/constraints are still unclear
- Multiple interpretations exist for scope, acceptance criteria, or architecture direction
- Team needs a compact interview artifact before `/oma:team-plan` or `/oma:team-prd`

## Workflow

1. Trace known facts from the request and current repository context.
2. Compute a simple clarity score (`low`, `medium`, `high`) for implementation readiness.
3. Run a structured interview pass:
   - essential questions (must answer before planning)
   - standard questions (quality/cost/risk tuning)
   - deep questions (edge-case and long-term maintainability)
4. Record assumptions explicitly and mark each as validated, pending, or risky.
5. Produce a launch brief that can be consumed by planning/execution stages.
6. If filesystem tools are available, update:
   - `.omg/state/interview-context.json`
   - `.omg/state/launch-brief.md`

## Output Template

```markdown
## Clarity Score
- level: low|medium|high
- rationale: ...

## Known Facts
- ...

## Open Questions
1. ...
2. ...

## Assumption Ledger
| Assumption | Status (validated/pending/risky) | Validation Path |
| --- | --- | --- |
| ... | ... | ... |

## Launch Brief
- objective:
- boundaries:
- acceptance hints:
- recommended next command:
```

## Notes

- Keep output concise and operator-facing.
- Do not start coding when essential interview questions are unresolved.
- This skill remains extension-native (prompt/state level), without external daemons or runtime wrappers.
