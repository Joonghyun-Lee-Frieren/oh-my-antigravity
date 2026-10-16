# Native hook engineering

Root `hooks.json` contains one `oma-workflow` definition. It follows the
[Antigravity hook contract](https://antigravity.google/docs/hooks), with camelCase
stdin fields and JSON stdout. Timeout units are seconds.

| Event | Purpose | Output |
| --- | --- | --- |
| PreToolUse | Validate tool, owner, phase, path, locks, and bounded review request | decision/reason; overwrite for controller/reviewer arguments |
| PreInvocation | Supply compact phase and controller-path context | injectSteps with an ephemeralMessage |
| Stop | End design, lock passed files, schedule <=3 repair units, or stop on blockers | decision/reason |

There is no BeforeModel override, AfterAgent learn nudge, custom hook profile,
undocumented model switch, or environment flag that silently disables the guard.
Node executes `hooks/scripts/guard.mjs` relative to the containing plugin directory.
The script uses module-relative paths for its libraries and controller, so invocation
does not depend on the project directory or an invented PLUGIN_ROOT variable.

The guard expects exactly one workspace and a conversation ID from native payloads.
Only the owner can submit controller actions or edit scoped source. Read-only workers
have capability allowlists at the native agent level. Unknown tools, generic shell
calls, direct state/evidence writes, path escapes, and locked-file edits are denied.
Controller invocations are exact; root/owner and the Node executable are overwritten
from trusted metadata. Reviewer prompts are exact section IDs and are replaced with
one current source section plus evidence pointers.

State changes use atomic replace and an atomic directory mutex. A collision fails
closed rather than racing. If a process is killed while owning guard.lock, the
operator must inspect and remove the stale mutex. Do not remove a live mutex.

Stop continues only at fully idle model_stop. It never restarts cancellation,
errors, max-step termination, or live background work. Duplicate execution numbers
are ignored. Missing reviews remain unknown without a continuation loop. Repairs
are bounded by six cycles, unchanged-failure detection, and two verification nudges.

Malformed safety-hook input yields a deny decision. Context errors inject a blocker;
Stop errors permit stopping with the error reported and cannot accept stale evidence.
These scripts cannot control whether an older CLI invokes a hook or ignores a field.
Use current clients and validate actual loaded hooks before relying on the harness.

See [the workflow contract](guarded-workflow.md) for schemas and honest-failure limits.
Development tests exercise native payloads and observable behavior, including bypass
attempts. They do not replace authenticated CLI testing.
