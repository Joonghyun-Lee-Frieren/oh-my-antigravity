Follow [the guard contract](../../../docs/guide/guarded-workflow.md) first; it overrides any legacy shared-state or same-turn execution guidance.

## Purpose

Use this skill when a product, UI, or workflow decision needs a stable decision surface before implementation.

## Trigger

- A feature touches user flows, screens, copy, navigation, forms, dashboards, or visual hierarchy
- Multiple implementation lanes need one agreed product/interface contract
- Acceptance criteria exist, but the desired interaction states or content hierarchy are still fuzzy
- A redesign or frontend change needs accessibility and responsive behavior called out before coding

## Workflow

1. Identify target users, core job, success signal, and non-goals.
2. Map the primary workflow from entry through success and recovery paths.
3. Define interface decisions by surface, including empty, loading, error, disabled, and success states.
4. Capture content hierarchy, navigation, controls, responsive behavior, and accessibility constraints.
5. Mark assumptions and open questions separately from firm decisions.
6. Attach implementation owners, affected files or surfaces, and verification evidence.
7. Recommend whether to persist the result to `.omg/drafts/blueprint.md` before `team-plan` or `team-prd`.

## Output Template

```markdown
## Product Frame
- Target users:
- Core job:
- Success signal:
- Non-goals:

## Workflow Map
| Flow | Entry | Steps | Exit / Success | Failure / Recovery |
| --- | --- | --- | --- | --- |

## Interface Decisions
| Surface | Decision | Rationale | State Coverage | Owner | Evidence |
| --- | --- | --- | --- | --- | --- |

## Content / IA
- ...

## Accessibility / Responsiveness
- ...

## Open Questions
- ...

## Handoff
- Recommended next command:
- Taskboard sync:
- Verification notes:
```
