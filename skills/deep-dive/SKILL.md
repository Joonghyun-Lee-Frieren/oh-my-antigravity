---
name: "deep-dive"
description: "Run a trace-to-interview discovery pass that scores implementation readiness, surfaces open questions, and produces a launch brief before planning begins. Use when requirements are incomplete, scope is ambiguous, or the team needs a compact interview artifact before team-plan or team-prd."
user-invocable: true
triggers:
  - "requirements are unclear"
  - "clarify before planning"
  - "run discovery interview"
  - "deep dive into requirements"
  - "check implementation readiness"
---

## Purpose

Resolve ambiguity before planning and execution by tracing known facts, scoring clarity, and running a structured interview.

## Trigger

- User asks for implementation but goals or constraints are still unclear
- Multiple interpretations exist for scope, acceptance criteria, or architecture direction
- Team needs a compact interview artifact before `/omg:team-plan` or `/omg:team-prd`

## Workflow

1. Trace known facts from the request and current repository context.
2. Compute a clarity score (`low`, `medium`, `high`) for implementation readiness.
3. Run a structured interview pass:
   - **Essential** questions (must answer before planning)
   - **Standard** questions (quality/cost/risk tuning)
   - **Deep** questions (edge-case and long-term maintainability)
4. Record assumptions explicitly — mark each as validated, pending, or risky.
5. Produce a launch brief consumable by planning and execution stages.
6. If filesystem tools are available, update `.omg/state/interview-context.json` and `.omg/state/launch-brief.md`.

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
- This skill remains extension-native (prompt/state level) without external daemons or runtime wrappers.
