# Context engineering for OmA

Use context to communicate intent; use tools to enforce boundaries. OmA moves
large procedures out of SKILL.md and makes phase/ownership/evidence checks executable.

1. Keep each skill entrypoint within 20 lines. Put conditional detail in references.
2. Ask oma-doc-reader to read specifications before design and return a compact,
   source-backed summary with unknowns. Do not forward raw document dumps.
3. Seal exact scope, acceptance criteria, and executable checks during design.
4. End that user turn. Start implementation in the next one.
5. Give code workers small questions or patch proposals. The main conversation writes.
6. Verify using real command results and review one <=120-line section at a time.
7. Let Stop lock passed files and schedule at most three repair units per execution.
8. Preserve failure honestly when evidence, services, or permissions are missing.

Avoid putting the entire agent registry, every operating mode, or all workflow
schemas into always-on instructions. Native skill names/descriptions support
discovery; detailed references load when relevant. State and logs live on disk
under explicit ownership, rather than being inferred from conversation memory.

No amount of concise prompting proves arbitrary code is correct. The harness
records actual results and restricts tools, while focused behavioral checks and
reviewers assess semantics. Model profiles are recommendations; native CLI controls
select the model and workers inherit it.

Read [the guard contract](guarded-workflow.md) only when starting or operating code
work. See [agent handoffs](agent-team-assembly.md) for role-specific context.

Special thanks to @hyunuk.lim (threads). His threads and posts were a major help
in shaping this approach.

## Intent and continuity

Scope Brief keeps user decisions, discoverable technical facts, and source conflicts
explicit. Design Check challenges the exact plan before code starts. Native worker
receipts establish who submitted each review; the parent cannot write a verdict.
Evidence Window bounds log reads. Session Trail compares recorded intent/source
hashes with live state before continuation, without restoring stale authority.
See [the continuity guide](session-continuity.md).
