---
name: "research"
description: "Run source-backed technical research by splitting questions into focused sub-queries, gathering evidence from official docs and primary sources, and producing implementation-ready recommendations with confidence levels. Use when external documentation, API behavior, version-sensitive guidance, or library comparisons are needed."
user-invocable: true
triggers:
  - "research this library"
  - "compare these options"
  - "find official documentation"
  - "check latest API behavior"
  - "investigate technical tradeoffs"
  - "look up docs"
  - "which library should I use"
  - "what changed in this version"
---

## Purpose

Gather evidence from primary sources and convert findings into implementation-ready guidance for this repository.

## Trigger

- User asks for latest API behavior or version-sensitive guidance
- Tradeoff decisions require evidence from primary sources
- Need to compare libraries, frameworks, or migration paths

## Workflow

1. Split the question into focused research sub-questions.
2. Search official docs, specs, and primary maintainer sources using available tools.
3. Record version, date context, and confidence level (`high` / `medium` / `low`) for each finding.
4. **Validation checkpoint**: Verify at least 2 independent sources corroborate each key finding before producing recommendations.
5. Compare options with explicit criteria (performance, maintenance, compatibility).
6. Produce implementation recommendations scoped to this repository.

## Example

```text
Question: "Should we use pydantic v1 or v2 for the data layer?"

Sub-queries:
  1. What are the breaking changes between pydantic v1 and v2?
  2. Does our current FastAPI version support pydantic v2?
  3. What is the migration effort for our existing models?

Findings:
  - pydantic v2 is 5-50x faster (source: pydantic.dev/v2, confidence: high)
  - FastAPI 0.100+ supports both (source: fastapi.tiangolo.com, confidence: high)
  - Migration requires BaseSettings move to pydantic-settings (confidence: medium)

Recommendation: Migrate to pydantic v2 with pydantic-settings; start with new models.
```

## Output Template

```markdown
## Key Findings
- Finding 1 (source: ..., confidence: high/medium/low)
- Finding 2 (source: ..., confidence: high/medium/low)

## Source-Based Comparison
| Criteria | Option A | Option B |
| --- | --- | --- |
| Performance | ... | ... |
| Compatibility | ... | ... |

## Recommendation
- Recommended approach with rationale

## Risks / Unknowns
- Items with low confidence or missing sources
```

## Notes

- Keep quotes short and provide links.
- Escalate to planning (`$plan`) if research changes scope.
