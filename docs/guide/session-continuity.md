# Scope and session continuity

v1.1 adds four connected surfaces: Scope Brief, Design Check, Evidence Window,
and Session Trail. They operate through the existing guarded controller.

## Scope Brief

After the documentation handoff, save a request such as:

```json
{
  "objective": "Fix discount rounding without changing the pricing API",
  "risk": "routine",
  "constraints": ["Preserve the existing public pricing API"],
  "nonGoals": ["Do not redesign billing"],
  "decisions": [{
    "id": "currency",
    "owner": "user",
    "status": "resolved",
    "question": "Which currency behavior must remain?",
    "answer": "Keep the existing supported currency set",
    "basis": "The user request requires the existing contract"
  }],
  "conflicts": []
}
```

Decision owners are user or agent; statuses are open or resolved. A resolved decision
needs answer and basis. A source conflict needs topic, at least two sources, status,
and resolution when settled. Lists are bounded at 20 entries; use empty arrays when
there are none. Objective is at most 600 characters. The plan intent matches it exactly.

Existing user instructions can resolve a decision without another approval question.
Technical facts should be found in code/docs. Business rules or incompatible source
claims must not be guessed. Unresolved decisions/conflicts block plan sealing.

Routine/elevated/critical care caps sections at 120/90/60 lines and repair batches at
3/2/1 units. Sensitive path matches can only raise the declared care. All classes keep
real checks, native independent receipts, and passed-file locks. Inspect effective
care and its path reasons in status; names alone cannot establish semantic risk.

## Design Check

Invoke oma-design-auditor with Prompt exactly plan. The hook supplies the complete
bounded design packet and a new ticket. A packet over 30,000 bytes fails explicitly;
split scope rather than hide part of the plan. The auditor's native receipt contains
agent, planHash, verdict (pass/revise/unknown), all criteria, evidence, and findings.

The parent cannot submit this verdict or steer the auditor by message. A revision
revokes older tickets and review. A pass can close the design turn, and implementation
still waits for the next user turn. Target-file hash drift blocks start.

## Evidence Window

```text
node "<installed-plugin>/scripts/workflow.mjs" evidence .omg/drafts/evidence.json
```

```json
{ "check": "pricing", "offset": 0, "limit": 4096 }
```

The limit is 4..8192 UTF-8 bytes; offset is a byte cursor, not a line number. Returned
nextOffset is safe to use for the next page. Partial multibyte characters are not
silently emitted. Output includes totalBytes, offset/end, path, digest, integrity,
text, truncated, and nextOffset. Terminal escape sequences are removed from the
view while original bytes remain on disk. A changed recorded log fails integrity.
A legacy log without a stored digest is labeled legacy-unrecorded, not verified.

A window is evidence of that excerpt, not proof that a whole check passed. Use the
actual check status and retrieve further pages when necessary. The context pack is
state-derived and excludes complete logs and issued receipt tokens.

## Session Trail

Controller checkpoint creates a unique immutable JSON snapshot and a short Markdown
handoff under .omg/state/checkpoints/. The active reference stores a digest. Material
controller transitions and ordinary Stop also capture a checkpoint automatically.

Controller resume is read-only. It verifies record identity, owner, workspace, digest,
plan fingerprint, and source hashes. It reports current, state-advanced, source-changed,
plan-changed, or missing-checkpoint, plus bounded drift paths and current next action.
Corrupt or missing referenced records are explicit errors. It never loads a stale
snapshot over live state, transfers an owner, replays a verdict, or clears a lock.
A continuity-ready report still does not start code work or grant permission.

Use the existing owning conversation for continuation. Ownership conflicts, blocked
work, or locked-file changes require operator reconciliation with evidence retained.

[Full guard contract](guarded-workflow.md) · [Agent handoffs](agent-team-assembly.md)
