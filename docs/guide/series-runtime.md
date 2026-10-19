# Runtime safeguards from Part 1–7

v1.2 implements the runtime architecture described in the user-provided
`Coding_for_100_percent_Summary_and_Architecture.md` (SHA-256
`f114dcb9379b8b40b47f2c986f5ce77d1cb8666ce24efb876d9fd168adb93638`).
The supplied file is a summary of Hyunuk Lim's *Coding for 100%, not 98%* series.
The [main article](https://medium.com/@dev.hyunuk/3f86bb9b8ab7) remains the reading link.
The implementation does not claim to reproduce the series' benchmark results or
guarantee zero defects in arbitrary code.

| Part | OmA implementation | Practical boundary |
| --- | --- | --- |
| 1: runtime enforcement | Owner/phase/path gates, real checks, hash locks, independent receipts | Native hooks must run with truthful runtime identities |
| 2: regression and overwrite shortcuts | Passed-file locks; existing files over 400 lines require targeted edits or a sealed `rewriteFiles` declaration | Tool guards are not OS file permissions |
| 3: incomplete reading | Registered source snapshots; bounded UTF-8 windows; complete coverage and hash checks before handoff | Proves delivery of selected bytes, not understanding or selection of every needed source |
| 4: broken dependencies | Read-only directory fingerprints and typed `DEPENDENCY_DEFECT` / external failure exits | A failure classification is a diagnosis supported by real evidence, not automatically proven root cause |
| 5: fake success | Python AST checks plus immutable JSON execution receipts binding argv, exit status, log/source/input hashes | Narrow structural checks complement behavioral tests and review |
| 6: repair overload | Dependency-ordered repair groups, bounded diagnostics, passed-file locks, A→B→A detection and one-group focus | A group can contain several checks; cycle/stagnation limits still stop unproductive work |
| 7: review manipulation | Heading-aware Markdown shards, fresh conversation per shard, replaced prompts, disconfirmation assessments and a deterministic judge | Independent judgments can still be wrong; missing support stays unknown |

## Read the selected sources completely

New workflows use `guardVersion: 2`. Before handoff:

```text
node "<installed-plugin>/scripts/workflow.mjs" sources .omg/drafts/sources.json
node "<installed-plugin>/scripts/workflow.mjs" read .omg/drafts/read.json
```

```json
{ "files": [".omg/drafts/sources/spec.md", "sdk/companion.py"] }
```

```json
{ "file": ".omg/drafts/sources/spec.md", "offset": 0, "limit": 4096 }
```

Register 1–50 UTF-8 files, each at most 4 MiB. A read returns its SHA-256, byte
range, start line, text, and `nextOffset`. Page until null, including the middle
and tail. Overlaps are merged; skipped bytes leave coverage incomplete. The
handoff must name every registered file exactly. Searches and raw viewer previews
do not establish coverage. Sources cannot change between handoff, design,
implementation and acceptance. Use immutable local snapshots for remote sources
or documents being edited; preserve original URL, version, and capture date in
their headers. No network fetch or source discovery is fabricated by the controller.

Send focused files/shards to read-only doc readers and retain their concise
requirements, signatures, constraints, and unknowns. Controller coverage records
what was delivered to the owner; it does not attest a worker's comprehension.

`/oma-probe` runs a narrow research-only allowlist: `node/python/agy --version`
and `agy [up to three simple topics] --help`. It stores real output and a JSON
receipt, returning at most 8192 UTF-8 bytes. Set `required: true` when a failed
probe must prevent handoff. This does not execute SDK imports or arbitrary project
scripts; inspect exact SDK source and companion examples through source windows.

## Preserve dependencies and avoid accidental rewrites

Plans may declare:

```json
{
  "readOnly": ["vendor", "specs"],
  "rewriteFiles": ["docs/generated-guide.md"],
  "repairGroups": [
    { "id": "core", "checks": ["core-tests"], "dependsOn": [] },
    { "id": "integration", "checks": ["api-tests"], "dependsOn": ["core"] }
  ]
}
```

These are additional fields in the normal plan. `readOnly` paths must exist,
cannot overlap the edit scope, and are fingerprinted recursively (at most 2000
entries). Added/deleted/changed entries invalidate the boundary. Symlinks and
junctions are rejected in these snapshots. Known dependency boundaries do not
constitute a sandbox for trusted project validators.

For existing files over 400 lines, whole-file writes require an exact scoped
`rewriteFiles` declaration reviewed with the design. Other edits must supply exact
existing target chunks totaling at most 200 lines per call. A planned rewrite
still requires all behavioral checks and section reviews.

`repairGroups` partition every sealed check exactly once and form an acyclic
dependency graph. The controller orders them, groups failing related checks and
keeps automatic integrity failures visible. Default groups contain one check.
Routine/elevated/critical care selects at most 3/2/1 repair units. Repeated A→B→A
failure signatures reduce the next batch to one group; fewer remaining units
can clear that focus. Stable repeated failures and cycle limits still block.

`/oma-repair-context` returns only active groups, real log excerpts and expected
behavior (`check.expectation`, or its acceptance criteria), with source references.
Default is one diagnostic per group. Optional `{ "group": "group:core",
"offset": 0, "limit": 2 }` pages up to two checks from one active group.
`nextCheckOffset`, omitted file/source counts, and log cursors make truncation
explicit. Full exact scope remains in the sealed state; no backlog edits are allowed.

## Exit honestly

```json
{
  "code": "DEPENDENCY_DEFECT",
  "dependency": "vendor/sdk",
  "reason": "The sealed behavioral check reproduces the dependency contract failure.",
  "checks": ["api-tests"]
}
```

Submit through controller `block` or `/oma-failure`. Dependency defects require
at least one actual failed check and a named dependency. Other codes are
`EXTERNAL_ISSUE`, `RULE_CONFLICT`, `MISSING_CAPABILITY`, or legacy `UNSPECIFIED`.
Live phase becomes `blocked`, while `failure.status` is `failed`. Evidence,
receipts, locks and the failed result remain. The agent cannot clear the blocker
or substitute dummy success. This exit can be used before all reviews complete.

## Python AST and real execution receipts

Scoped `.py` files automatically add `oma-python` verification. The shipped helper
uses Python's AST parser without importing or executing target code. It detects:

- Unconditionally truthy constant assertions.
- `except: pass` suppression and direct literal fallback returns in handlers.
- `locals()` / `globals()` mutation in cleanup blocks.
- Replacement of imported members with local functions/classes/lambdas, including `setattr`.
- Syntax errors.

Python 3.9+ is needed only for Python scopes; missing Python is a failed check,
never a skipped success. Set `pythonExecutable` to the intended interpreter.
Legitimate exceptions must be declared in the sealed plan, for example:

```json
{
  "astExemptions": [{
    "file": "src/cache.py", "line": 42, "rule": "synthetic-fallback",
    "criterion": "optional-cache-miss",
    "reason": "The specified optional cache contract explicitly returns None on a miss."
  }]
}
```

At most 20 exemptions, each exact file/line/rule and criterion, are allowed.
The independent design auditor sees this policy; syntax errors cannot be waived.
Findings and applied exemptions remain in the actual log. There is no global bypass.
These checks cannot determine whether every assertion is meaningful, discover
arbitrary indirect monkeypatches, prove API behavior, or prove cleanup occurred.
Behavioral validators and focused review remain necessary.

Each execution writes `.omg/evidence/<id>.txt` and a new JSON receipt with actual
argv, exit status/signal/time, log digest, scoped source hashes and declared input
hashes. Python receipts also bind the installed AST helper and exemption policy.
The active state stores the receipt path and digest; tampering invalidates review
and completion. These receipts are produced directly by the controller executing
the checks. OmA uses its existing native hooks rather than inventing an unsupported
PostToolUse payload contract. They are not OS-attested execution proofs.

## Blind shards and a deterministic judge

Markdown sections split at `##` headings, with the current care line cap inside
each heading. Other source keeps bounded line shards. A fresh child conversation
judges one shard per verification. Parent prompt/role extras are removed and
replaced with the issued packet. Parent coaching and author-written verdicts
remain blocked; the native sender and single-use ticket are recorded.

Schema-2 section receipts add:

```json
{
  "assessments": [{
    "criterion": "rounding",
    "status": "supported",
    "probe": "Checked the half-cent boundary and the negative-value path.",
    "evidence": "Lines 18–24 round once at the specified currency boundary."
  }],
  "findings": [{
    "line": 18, "criterion": "rounding",
    "expected": "Round once at the currency boundary.",
    "observed": "This path rounds the intermediate amount first.",
    "reason": "A half-cent input produces a different final invoice."
  }]
}
```

This excerpt demonstrates both field shapes; a material finding makes the verdict
fail even if the worker requested pass. Every criterion needs one assessment with
status `supported`, `violated`, `unknown`, or `not-applicable`, concrete evidence,
and a short counterexample probe. Unsubstantiated violations and missing proof
stay unknown. The judge never needs a worker's private reasoning.

The supplied summary names five engineering exemptions without their exact
definitions. OmA explicitly defines its own narrow categories: `style`, `wording`,
`naming`, `equivalent-implementation`, and `scope-expansion`. A suggestion with
`criterion: null` and one of these categories is retained as a vetoed suggestion.
It cannot create a repair requirement. A cited explicit requirement is never
exempt, including naming, security, correctness and cleanup requirements.
The judge retains `workerVerdict` and `vetoedFindings`. All-supported assessments
with only vetoed suggestions can pass; worker unknown remains unknown. This is
deterministic scope control, not proof of semantic correctness.

Existing sealed v1.0/v1.1 workflows retain their previous receipt contract.
New workflows use version 2; recovery does not silently upgrade, transfer ownership,
reopen locks or replay old verdicts. Start a new scoped workflow for the new gates.
