# Memory and durable state

Keep always-on context short. Put task-specific procedures in references and pass
summaries at agent boundaries. Retain facts, decisions, sources, and unknowns rather
than full transcripts.

| Location | Owner / use |
| --- | --- |
| .omg/state/guard.json | Controller-owned phase, plan, check results, sections, receipts, batch, locks |
| .omg/evidence/ | Controller-owned actual check output |
| .omg/drafts/ | Main-conversation request JSON and auxiliary taskboard/checkpoint/memory notes |
| skills/*/references/ | Versioned procedures loaded only when needed |
| config/models.json | Maintained model recommendations with verification date and sources |

Workers return summaries; they do not mutate any shared artifact. Native file tools
cannot overwrite guard state or evidence. The state owner is the conversation ID
from hook metadata, not a self-declared name in a draft.

Use /oma-learn explicitly to extract useful lessons into drafts. The old automatic
learn nudge is removed. Review lessons before making them permanent project rules;
a single failure should not become a universal restriction.

A blocked workflow is retained, including its failed evidence. Operator recovery
must preserve the prior record and explicitly reopen scope/locks when required.
A stale guard.lock directory after a killed controller also needs operator inspection.

See [the workflow contract](guarded-workflow.md).
