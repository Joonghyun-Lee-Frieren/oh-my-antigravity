# Focused agent handoffs

OmA ships 15 workers. Each has a native read/search tool allowlist, command execution
off, no write tools, no MCP tools, and no nested delegation. The owning main
conversation applies patches and controls workflow state.

| Work | Worker | Handoff |
| --- | --- | --- |
| Read specs | oma-doc-reader | <=600-word summary, sources/versions, constraints, unknowns |
| Decompose scope | oma-planner | Atomic tasks, dependencies, file scope, validation |
| Decide interfaces | oma-architect | Relevant tradeoffs and a concrete recommendation |
| Propose code | oma-executor, oma-quick | Focused patch proposal; no claimed writes or test runs |
| Diagnose failure | oma-debugger | One root cause and a reproducible path |
| Review code | oma-reviewer | One <=120-line section receipt with hash, criteria, and evidence |
| Audit acceptance | oma-verifier | Evidence-backed criterion status; missing proof is unknown |
| Domain/output judgment | oma-product, oma-consultant, oma-editor, oma-consensus, oma-researcher, oma-director, oma-interview | Focused recommendations for the parent |

Do not copy the full conversation into every handoff. Give the current intent,
summary, needed source paths, and the specific question. Request only independent
sidecar work concurrently. Keep dependent work sequential.

A reviewer invocation sets Prompt to one current section ID from guard.json.sections.
PreToolUse injects the bounded content and evidence pointers. One reviewer never
owns a global PASS. The parent submits each receipt; Stop aggregates coverage and
locks only files whose checks and every section passed.

Model profiles are recommendations. Antigravity agent templates use model: inherit;
choose an available model through the CLI. Do not assign unsupported model strings
to agent frontmatter or claim automatic per-role switching.

Use one workflow per workspace and one writer. Worktrees need separate workflows.
See [the full contract](guarded-workflow.md) for turn separation and batch recovery.
