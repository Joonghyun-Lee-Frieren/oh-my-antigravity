# Current model policy

Reference: 2026-10-15. The catalog in `config/models.json` contains Gemini 3.8 Flash
and Gemini 4 Argon. It is policy data, not a live model inventory or an entitlement
claim. Check `/model` in the authenticated host before choosing a concrete model.

| Policy | Planning / review | Execution / quick edits |
| --- | --- | --- |
| `auto` (default) | Inherit host selection | Inherit host selection |
| `balanced` | `gemini-3.8-flash` | `gemini-3.8-flash` |
| `quality` | `gemini-4-argon` | `gemini-3.8-flash` |
| `custom` | Validated operator map | Missing lanes use balanced |

## Native and compatibility behavior

Antigravity: `/oma model quality` stores a recommendation. Use `/model` or launch
`agy --model gemini-4-argon --effort high` to choose a native model. All shipped
agent descriptors default to `model: inherit`, preserving the operator's choice.
Native hooks cannot rewrite a model request; traces report `applied: false`.
An operator can explicitly change a native agent to a supported flash/pro tier.

Gemini: `/oma:model quality` selects an explicit BeforeModel override. Only
`hookSpecificOutput.llm_request.model` changes. Auto means no override, never an
API model literally named auto. Return to auto to preserve a host-selected model.

Custom lanes are planning, execution, quick_edit and review_verify. The command
normalizes quick to quick_edit. Missing custom lanes use balanced; a lane value
of auto preserves the host. Unknown future IDs are allowed after format validation,
but unknown capabilities do not receive guessed thinking-level recommendations.
An optional available_models array is an operator constraint, not live discovery.
Malformed IDs, removed presets or IDs outside that array fail open to the host.

## Thinking, tool use and caching

Both current models support low, medium and high thinking levels. The catalog
recommends high for planning/review, medium for execution and low for quick edits;
it does not mutate the SDK config. Do not send minimal/xhigh or mix legacy thinking
budgets with thinking levels. Leave function-call IDs, thought signatures and full
tool responses to the host SDK instead of rebuilding the conversation manually.

Flash supports explicit caching; Argon does not. With Argon, prefer stable prefixes
and host-managed implicit caching rather than creating cached content. OmA does
not enable new SDK APIs, long-decode behavior or parallel execution just by adding
an ID, and does not claim measured token savings, cache hits or lower latency.

## Migration and diagnostics

The former preview presets are removed from active defaults and examples, while
historical changelog entries are preserved. Review existing model.json mappings:
balanced now means Flash throughout, quality is Argon/Flash, and auto inherits.
Invalid old mappings do not silently force a guessed replacement model.

Set trace=true in .omg/state/model.json or OMG_MODEL_ROUTING_TRACE=1. Match the
current host, hashed session key and updated_at in
.omg/state/sessions/hooks-<session-key>/model-router-last.json. Old shared traces
are not current policy. Shared model-policy writes still require the orchestrator's
workflow lock; hook diagnostics use a separate per-session lock.

## Primary references

- [Gemini 3.8 Flash](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash)
- [Gemini 4 Argon](https://ai.google.dev/gemini-api/docs/models/gemini-4-argon)
- [Antigravity subagents](https://www.antigravity.google/docs/subagents/)
- [Gemini hook reference](https://geminicli.com/docs/hooks/reference/)
