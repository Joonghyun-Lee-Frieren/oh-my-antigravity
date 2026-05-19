# Memory Management Guide for OmA

This guide adapts Claude Code's memory management pattern to OmA:

- keep memory layered and file-based
- keep the root index short
- split details into topic files
- activate modular rules only when relevant

## Directory Layout

```text
project/
|- GEMINI.md
|- MEMORY.md
`- .omg/
   |- memory/
   |  |- project-overview.md
   |  |- architecture.md
   |  |- decisions.md
   |  `- workflows.md
   `- rules/
      |- always/
      |  `- project-invariants.md
      |- tests-required.md
      |- migration-safety.md
      |- security-review.md
      |- docs-sync.md
      `- perf-watch.md
```

## Core Principles

1. Keep `MEMORY.md` compact (index only, high-signal summaries).
2. Store details in `.omg/memory/*.md` topic files.
3. Use frontmatter-based rules in `.omg/rules/*.md`:
   - `description`: short purpose
   - `globs`: optional file pattern activation
   - `alwaysApply`: optional unconditional activation
4. Prefer additive updates over large rewrites.
5. Regenerate index after topic-file changes.

## Rule File Example

```markdown
---
description: "Require tests for behavior changes."
globs:
  - "**/*.ts"
  - "**/*.tsx"
alwaysApply: false
---
# tests-required

- Add or update tests for changed behavior.
- If tests are unavailable, provide explicit validation evidence.
```

## MCP Tools

The OmA memory MCP server exposes:

- `memory_bootstrap`
- `memory_index_sync`
- `memory_rules_resolve`
- `memory_build_context`
- Existing entry tools: `memory_read`, `memory_write`, `memory_add_note`, `memory_search`

## Recommended Loop

1. Run `memory_bootstrap` once per project.
2. Add/update topic files during plan/exec/verify cycles.
3. Run `memory_index_sync` to keep `MEMORY.md` concise.
4. Resolve active rules using changed file paths.
5. Build prompt context with `memory_build_context` before long edits.
