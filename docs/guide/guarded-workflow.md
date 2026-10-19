# Guarded workflow (v1.2.0)

OmA is a native Antigravity CLI plugin. Use a current CLI and Node.js 20+.
Inspect `/plugin list` and `/hooks` after installing. Skill entrypoints stay within
20 lines; references carry the procedures that are needed only for a particular task.

## The delivery boundary

| Phase | Work | Exit |
| --- | --- | --- |
| research | Read-only documentation handoff | controller handoff |
| design | Scope Brief, exact plan, independent Design Check | current design pass, then end user turn |
| ready | Code remains read-only | controller start in the next user turn |
| implement | Main conversation edits exact planned files | controller verify |
| review | Independent bounded section reviews | native receipts, then Stop |
| repair | Only the Stop-selected repair batch | verification and independent reviews |
| complete | Passed files remain locked | Report result; explicitly start another scoped workflow |
| blocked | Keep evidence and the actual blocker | Operator recovery |

The parent applies patches and runs sealed checks. All 16 workers exclude shell,
file writes, MCP, and further delegation. Only the reviewer and design auditor have
send_message, for submitting their own issued receipt to the workflow owner.

## Controller

PreInvocation supplies the installed controller path. Use this exact command shape:

```text
node "<installed-plugin>/scripts/workflow.mjs" init
node "<installed-plugin>/scripts/workflow.mjs" status
node "<installed-plugin>/scripts/workflow.mjs" handoff .omg/drafts/handoff.json
```

PreToolUse overwrites root/owner and the Node executable from native hook metadata.
Do not add flags, pipes, substitutions, shell commands, or alternate controllers.
Exactly one workspace and one owning conversation are allowed. Native read tools
remain available, including reads of installed plugin references.

Save the doc-reader result with native file tools:

For new workflows, first use `/oma-read` to register versioned source snapshots and
page every bounded source window. This handoff is accepted only when its sources
exactly match the complete, unchanged registered set. Use `/oma-probe` for required
CLI help/version evidence. See [Part 1–7 runtime schemas](series-runtime.md).

```json
{
  "agent": "oma-doc-reader",
  "summary": "The final invoice rounds once at the currency boundary.",
  "sources": ["docs/pricing.md"],
  "unknowns": []
}
```

The handoff is bounded. Do not replace full-document reading with an unsupported
claim based on a few search matches. Preserve versions and conflicting claims.

## Scope Brief and design

Use `/oma-brief` to record the objective, constraints, non-goals, decision owners,
and source conflicts. Already supplied user instructions settle the corresponding
user decisions; do not ask for approval again. Read discoverable facts yourself.
Open decisions and conflicts block sealing. See [continuity features](session-continuity.md)
for the exact brief schema and care policy.

```text
node "<installed-plugin>/scripts/workflow.mjs" brief .omg/drafts/brief.json
node "<installed-plugin>/scripts/workflow.mjs" plan .omg/drafts/plan.json
```

The plan intent must equal the brief objective. A plan names exact relative files,
acceptance criteria, and executable checks. Every file and criterion needs a check:

```json
{
  "intent": "Fix discount rounding without changing the pricing API",
  "criteria": ["rounding", "existing-contract"],
  "files": ["src/pricing.js", "tests/pricing.test.js"],
  "testFiles": ["tests/pricing.test.js"],
  "checks": [{
    "id": "pricing",
    "argv": ["node", "scripts/check-pricing.mjs"],
    "files": ["src/pricing.js", "tests/pricing.test.js"],
    "criteria": ["rounding", "existing-contract"],
    "inputs": ["tests/pricing.test.js", "package.json"]
  }]
}
```

Validators are argv arrays, never shell strings. Node/Python validators must be
existing workspace scripts; inline interpreters and shells are rejected. On Windows,
use Node plus a script rather than relying on npm.cmd through a shell. Each check
has a 30-second timeout. Validators are trusted project code, not sandboxed by OmA.

Node/Python script files are automatically included in each check's `inputs`.
Declare additional tests, fixtures, imported helpers, and configuration files there;
OmA does not infer transitive dependencies. Each check accepts at most 100 existing
workspace files, including its script. Inputs are read dependencies and grant no
edit permission. They cannot name protected paths or `.omg/` artifacts.
New plans record their hashes. Start requires unchanged inputs; verify also requires
unchanged inputs outside the edit scope. Put an input in `files` (and `testFiles`
for tests/fixtures) when the task legitimately changes it. Verification records the
updated hashes and rejects any input changed while checks run or before review and
completion. Previously sealed plans keep their existing guarantees; reseal to obtain
validator input protection.

Request `/oma-design-check`: invoke oma-design-auditor with Prompt exactly `plan`.
The hook supplies the brief, documentation handoff, exact plan hash, care policy,
and a receipt ticket. The auditor checks intent fidelity, acceptance coverage,
source conflicts, and whether the tests could pass without exercising the behavior.

The auditor submits pass/revise/unknown through its own native send_message call.
The parent cannot submit or amend that verdict. Resealing a plan or changing the
brief invalidates older tickets and verdicts. Stop sets ready only after the current
native Design Check passes. It permits the design turn to stop normally.

Start implementation in the **next user turn**:

```text
node "<installed-plugin>/scripts/workflow.mjs" start
```

Scoped source hashes must still match the design basis. Drift requires reconciliation.

## Verification and independent review

Edit with native file tools, then run controller verify. It executes the sealed
checks without a shell and records actual exit codes, logs, timestamps, log digests,
and source hashes. Missing executables, timeouts, and nonzero exits fail. A validator
that changes scoped code or recorded validator inputs cannot establish valid evidence.

Invoke oma-reviewer with Prompt equal to one current section ID from status, such
as `src/pricing.js:1`. The hook constructs the packet: bounded source, current hash,
criteria, check results, and bounded log windows. Oversized packets are rejected,
not silently truncated. A reviewer may read a specific dependency to trace behavior.
Every covering check's status, exit code, criteria, evidence path, and input-integrity
label is included. Up to two 2048-byte log windows prioritize non-passing checks;
other windows are explicitly null and counted by `windowlessCheckCount`. Missing
excerpts never imply success. Use `/oma-evidence` for additional log inspection;
the independent reviewer must return unknown if its packet cannot support a verdict.

Both independent roles use send_message with the issued Recipient and a JSON Message:

```json
{
  "omaReceipt": {
    "token": "<issued ticket>",
    "receipt": {
      "agent": "oma-reviewer",
      "section": "src/pricing.js:1",
      "hash": "<issued source hash>",
      "verdict": "pass",
      "criteria": ["rounding", "existing-contract"],
      "evidence": "Lines 18-24 round once; the check exercises the half-cent boundary.",
      "assessments": [
        { "criterion": "rounding", "status": "supported", "probe": "Checked positive and negative half-cent boundaries.", "evidence": "Lines 18-24 round once at the currency boundary." },
        { "criterion": "existing-contract", "status": "supported", "probe": "Traced existing callers with the original input shape.", "evidence": "The public signature and return structure are preserved." }
      ],
      "findings": []
    }
  }
}
```

New guardVersion-2 section receipts also require `assessments`: one per criterion,
with status, evidence and a short counterexample probe. Material findings need
criterion, expected and observed behavior. The [central judge schema](series-runtime.md#blind-shards-and-a-deterministic-judge)
defines scope vetoes and unknown outcomes. Use a fresh reviewer conversation per
shard. Markdown shards follow `##` headings while respecting the line cap.

The hook records the actual sender conversation ID. A sender equal to the parent,
a wrong recipient, an unknown/superseded ticket, changed source, or a changed replay
is rejected. An identical retry from the same sender is idempotent. Parent follow-up
messages are blocked to prevent steering a reviewer toward PASS. The design receipt
uses agent oma-design-auditor, planHash, and verdict pass/revise/unknown instead of
section/hash. Its criteria and findings are still required.

Missing native submission stays unknown. There is no parent-written fallback for
v1.1 plans. A section pass requires no open findings; findings need an in-section
line and a reproducible reason. Runtime-observed submission establishes who sent
which verdict against which issued basis. It does not prove that the judgment is
correct, that all dependencies were read, or that arbitrary code is truthful.

## Care, repairs, and locks

| Effective care | Section cap | Repair units / execution | Repair cycles |
| --- | --- | --- | --- |
| routine | 120 lines | 3 | 6 |
| elevated | 90 lines | 2 | 5 |
| critical | 60 lines | 1 | 4 |

The brief may request stronger care. Scoped auth/security/permissions/migration paths,
hooks, and scripts/workflow.mjs force critical care; config/api/contract path segments
force at least elevated care. Unknown semantic risk still needs judgment. Classification
cannot remove executable checks, independent review, turn separation, or locks.

At fully idle model_stop, Stop locks files whose covering checks and all sections
passed. Failed checks and non-passing sections become repair units. The selected
batch restricts editable files. Do not fix queued units merely because they share a
file. A check may group diagnostics; split checks during design for finer scheduling.

Every batch returns to verification. Locks retain SHA-256 hashes across batches and
subsequent workflows. Scope changes and locked-code regressions require explicit
operator recovery. Two unchanged repeated failures block further repairs. At most
two verification reminders continue an unverified implementation. Duplicate Stop,
cancellation, errors, exhausted executions, and live background tasks do not restart
repair loops. Missing reviews stop normally, without an infinite continuation loop.

## Evidence Window and Session Trail

Status and PreInvocation use a compact context pack: current intent, care, phase,
check counts/results, next section IDs, active batch, lock count, and exact next action.
Omitted items are labeled. Raw logs and receipt tickets do not enter that pack.

Use `/oma-evidence` to page through a real log with an integrity-checked UTF-8 byte
cursor. Full output stays on disk. Native direct evidence-file reads are gated so a
single large log cannot flood the conversation. Reviewers receive bounded windows;
missing or omitted relevant proof remains unknown.

Use `/oma-checkpoint` to record an immutable JSON and Markdown Session Trail entry.
Plan/start/verify/block and normal Stop transitions also record checkpoints. `/oma-resume`
compares the latest record with current owner, workspace, plan, and source hashes.
It reports the current next action. It never restores an old snapshot, transfers
ownership, unlocks code, clears a blocker, or grants permission.

## Honest failure and recovery

```json
{ "reason": "The configured staging service is unavailable; integration evidence is missing." }
```

Save under .omg/drafts/ and submit controller block. Do not return a fabricated
service response, swallow a failed check, skip tests, or manufacture a success exit.
Test/fixture files require explicit testFiles scope. Pattern checks catch common
validation bypasses; meaningful behavioral checks and reviewers assess semantics.

State/evidence/checkpoints are controller-owned. Writes use an atomic state replace
and an atomic directory mutex. A killed controller may leave guard.lock; the operator
must inspect it before removing a stale mutex. Preserve evidence during recovery.
A new conversation cannot silently take ownership. Old v1.0 sealed states retain
the legacy receipt path until a new plan is sealed; new plans always use native receipts.

The harness constrains tools, not the operating system. Operators can change plugin
files or run external commands. Use the runtime sandbox when needed. Current clients
must execute child send_message hooks with the actual child conversation ID. Missing
hook behavior leaves receipts unknown; never infer readiness from static validation.
Authenticated CLI smoke tests remain necessary for each deployed runtime build.

## Models and sources

config/models.json retains Gemini 4 Argon and Gemini 3.8 Flash recommendations.
Run agy models for account availability and select through agy --model or the runtime
selector. Subagents inherit the selected model; hooks do not override it.

[Official hooks](https://antigravity.google/docs/hooks),
[plugins](https://antigravity.google/docs/plugins?tab=cli),
[subagents](https://antigravity.google/docs/subagents),
[models](https://antigravity.google/docs/models).

Special thanks to **@hyunuk.lim (threads)**. His threads and posts were a major help
in shaping thin skills, physical tool boundaries, honest failure, and focused reviews.
