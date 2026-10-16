# Guarded workflow (v1.0)

OmA is a native Antigravity CLI plugin. Install with `agy plugin install <repo>`;
inspect `/plugin list` and `/hooks`. Node.js 20+ is required for hook scripts.
Skill commands use `/oma-team-plan`, `/oma-team-exec`, and `/oma-team-verify`.
The retained `protocols/oma/*.toml` files are protocol sources for generated native
skills; Antigravity does not need to discover Gemini TOML commands.

## Boundaries

`SKILL.md` contains a short entrypoint. Conditional procedures live in references.
The hook controls enforce the following workflow:

| Phase | Allowed work | Exit |
| --- | --- | --- |
| research | Native reads; read-only doc-reader; handoff drafts | `handoff` |
| design | Scope, criteria, executable check definitions; drafts | `plan`, then end user turn |
| ready | No code edits | `start` in next user turn |
| implement | Main conversation edits exact planned files | `verify` |
| review | Read-only section reviews and receipt drafts | `review`, then Stop |
| repair | Edits only files in the current <=3-issue batch | `verify`, section reviews, Stop |
| complete | Read-only; passed files remain locked | Operator starts another scoped workflow |
| blocked | Read-only; exact blocker retained | Operator recovery |

The parent alone writes code and state. All shipped subagents have native tool
allowlists that exclude shell, writes, MCP, and further delegation. The doc-reader
returns <=600 words, sources, and unknowns. The executor proposes a patch; the
parent applies it. The reviewer receives one section of at most 120 lines, its
hash, criteria, and relevant check logs. For `invoke_subagent`, set the reviewer's
`Prompt` to one exact section ID. PreToolUse replaces it with the bounded source,
hash, criteria, and evidence pointers, and rejects arbitrary review prompts.
Larger files become several handoffs.
Separate invocations may run concurrently, but never ask one reviewer to approve
the whole repository. The controller aggregates receipts and checks every section.

## Controller

`PreInvocation` supplies the absolute installed controller path. Invoke it with
`run_command` using precisely this shape (replace the path):

```text
node "<installed-plugin>/scripts/workflow.mjs" init
node "<installed-plugin>/scripts/workflow.mjs" status
node "<installed-plugin>/scripts/workflow.mjs" handoff .omg/drafts/handoff.json
node "<installed-plugin>/scripts/workflow.mjs" plan .omg/drafts/plan.json
```

Do not add root/owner arguments. `PreToolUse` supplies those from the hook's single
workspace and conversation identity. It replaces the command with an invocation
of the actual Node executable and installed controller, outside shell parsing.
Extra flags, pipes, command substitution, separators, arbitrary shells, inline
interpreters, alternate controllers, and asynchronous command input are denied.
Native read tools remain available. Unknown tools are denied rather than assumed
safe. Runtime permissions still apply; a hook `allow` does not auto-approve them.

Save a doc-reader handoff using a native file tool:

```json
{
  "agent": "oma-doc-reader",
  "summary": "The discount rounds once at the currency boundary.",
  "sources": ["docs/pricing.md"],
  "unknowns": []
}
```

Then seal a plan. Paths are exact workspace-relative paths. Every file and
acceptance criterion must have a check. Validators are argv arrays, never shell
strings. On Windows, use Node plus a script instead of relying on npm.cmd through
a shell. Keep validators short (30 seconds each); design separate checks for
independently repairable failures.

```json
{
  "intent": "Fix discount rounding without changing the pricing API",
  "criteria": ["rounding", "existing-contract"],
  "files": ["src/pricing.js", "tests/pricing.test.js"],
  "testFiles": ["tests/pricing.test.js"],
  "checks": [
    {
      "id": "pricing",
      "argv": ["node", "scripts/check-pricing.mjs"],
      "files": ["src/pricing.js", "tests/pricing.test.js"],
      "criteria": ["rounding", "existing-contract"]
    }
  ]
}
```

End the design turn. `Stop` changes `design` to `ready` and permits the stop;
it does not continue into implementation. In the next user turn:

```text
node "<installed-plugin>/scripts/workflow.mjs" start
```

Edit using native file tools, then run:

```text
node "<installed-plugin>/scripts/workflow.mjs" verify
```

Verification executes sealed checks without a shell and records actual exit codes,
timestamps, output logs, and source hashes in controller-owned state/evidence.
Timeouts, missing binaries, and nonzero exits fail. Validation that modifies scoped
code is rejected. Review the resulting `sections` independently. Example receipt:

```json
{
  "agent": "oma-reviewer",
  "section": "src/pricing.js:1",
  "hash": "<hash supplied by the controller>",
  "verdict": "pass",
  "criteria": ["rounding", "existing-contract"],
  "evidence": "Lines 18-24 round the final amount once; pricing log covers the half-cent case.",
  "findings": []
}
```

The parent saves one receipt at a time and submits it:

```text
node "<installed-plugin>/scripts/workflow.mjs" review .omg/drafts/review-1.json
```

Use `fail` or `unknown` when warranted. Findings need a line in the assigned section
and a reproducible reason. A pass with open findings is rejected. `Stop` cannot
complete the workflow until every section has a current pass and every check passes.

## Repair scheduling and locks

At a fully idle `model_stop`, Stop locks each file whose covering checks and all
sections passed. Locks store SHA-256 hashes. Failed checks and non-passing sections
become repair units. Stop selects at most three, restricts edits to their files,
and returns `decision: continue` for the next execution slice. A check may represent
multiple diagnostics; the limit is three registered repair units, not a claim to
understand every compiler diagnostic. Use focused checks to make that granularity
meaningful. Do not work on queued issues simply because they share a file.

Run checks and section reviews after each batch. Passing files stay locked across
batches and subsequent workflows. A changed locked hash blocks further actions.
Scope/path changes and locked-code regressions require operator recovery. The
controller permits six repair cycles; two repeated unchanged failures block it.
At most two verification reminders may continue an unverified implementation.
Duplicate Stop events, cancellation, system errors, max-step exits, and active
background work do not launch repair loops. Missing section receipts remain unknown
and stop normally so an unavailable reviewer cannot create an infinite loop.

## Honest failure and recovery

If a dependency, credential, capability, or service is missing, save its real cause:

```json
{ "reason": "Integration check cannot connect to the configured staging service." }
```

```text
node "<installed-plugin>/scripts/workflow.mjs" block .omg/drafts/blocker.json
```

There is no agent command to set checks to pass, overwrite evidence, widen a sealed
plan, clear locks, reset a live workflow, or write guard state. Test/fixture paths
must be explicit in `testFiles`. Common skipped/focused tests and unconditional
success exits are rejected. Semantic fabrication still requires relevant behavioral
checks and a reviewer; string matching cannot prove arbitrary code is truthful.

For recovery, the operator should inspect `.omg/state/guard.json`, preserve its
evidence, resolve the blocker, and explicitly archive/reinitialize the state or
reopen a specific lock outside the guarded agent. Never delete evidence to hide a
failure. A new owner cannot silently take over an existing workflow.

These are tool/workflow constraints, not an OS security sandbox. Validators are
trusted project code and execute with the CLI user's permissions. An operator who
changes hook files or runs commands outside the CLI can bypass the harness. Review
validator definitions in the design turn and keep runtime sandboxing enabled when
needed. Review receipts are structured agent judgments, not cryptographic proof of
who reviewed them. Native capability limits enforce read-only worker tools.

## Models and migration

`config/models.json` is the maintained catalog (verified 2026-10-16). Balanced
recommends `gemini-4-argon-high` for design/review and `gemini-3.8-flash-medium` for
implementation; quick work uses `gemini-3.8-flash-low`. The explicit `flash` profile
uses 3.8 Flash throughout. Confirm account availability with `agy models` and select
through `agy --model <id>`. Subagents inherit the selected runtime model. No hook
pretends to override models through unsupported fields. Older enterprise models may
still exist, but removed preview IDs are no longer shipped defaults.

Remove manually copied Gemini hooks before using the native plugin; root
`hooks.json` is authoritative. Hook commands run relative to their containing plugin
directory. No undocumented `PLUGIN_ROOT` substitution is assumed. Use the current
CLI; older clients may lack modern agent capability controls. Run `agy plugin
validate <path>` and inspect `/hooks` after installation. A real authenticated smoke
test is still required to establish behavior on a particular CLI build.

Sources: [Antigravity plugins](https://antigravity.google/docs/plugins?tab=cli),
[hooks](https://antigravity.google/docs/hooks),
[subagent capability fields](https://antigravity.google/docs/subagents),
[models](https://antigravity.google/docs/models),
[headless model selection](https://antigravity.google/docs/cli/headless/).

Special thanks to **@hyunuk.lim (threads)**. His threads and posts were a major
help in shaping this approach to small skills, physical tool boundaries, honest
failure, bounded repair batches, and focused reviews.
