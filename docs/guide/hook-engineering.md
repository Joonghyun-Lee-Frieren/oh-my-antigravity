# Hook Engineering Guide

OmA provides an extension-native hook layer for deterministic orchestration and safer autonomy loops.

## Why This Layer Exists

- Prevent repeated regressions in long `exec -> verify -> fix` loops
- Detect stall/drift signals earlier
- Apply guardrails without inflating the base prompt every turn

## Native Events

Hooks can be attached to these core extension-level events:

- `SessionStart`: Session initialization.
- `SessionEnd`: Session finalization.
- `BeforeAgent`: Before an agent turn begins.
- `AfterAgent`: After an agent turn completes (success, failure, or block).
- `BeforeModel`: Before a model request is sent.
- `AfterModel`: After a model response is received.
- `BeforeToolSelection`: Before the model decides which tool to call.
- `BeforeTool`: Before a specific tool is executed.
- `AfterTool`: After a tool execution returns.
- `PreCompress`: Before context window compaction/summarization.
- `Notification`: When a system or agent notification is issued.

## Derived Signals

Derived signals are state-driven mappings that allow for higher-level orchestration:

- `session-start`: Triggered by `SessionStart`.
- `stage-transition`: Triggered by `AfterAgent` (e.g., plan -> exec).
- `blocker-raised`: Triggered by `AfterAgent` when a new blocker is identified.
- `agent-blocked`: Triggered by `AfterAgent` when execution is paused.
- `agent-finished-early`: Triggered by `AfterAgent` when a goal is completed before all tasks are exhausted.
- `pre-verify`: Triggered by `BeforeTool` for critical validation.
- `post-verify`: Triggered by `AfterTool` to confirm outcome.
- `checkpoint-save`: Triggered by `AfterTool` when state is persisted.
- `blocker-repeat`: Triggered by `Notification` or `AfterAgent` when the same blocker persists.
- `loop-stall`: Triggered by `Notification` or `AfterAgent` when a loop fails to progress.
- `risk-spike`: Triggered by `Notification` or `AfterAgent` on high failure density.
- `context-drift`: Triggered by `PreCompress` when summary entropy is high.
- `token-burst`: Triggered by `AfterModel` when token usage exceeds thresholds.

## Deterministic Lanes

Use a fixed lane order to keep behavior predictable:

1. `P0-safety`
2. `P1-quality`
3. `P2-optimization`

Recommended behavior:

- `P0-safety`: fail-closed only for explicit safety violations
- `P1-quality`: retryable, with bounded timeout/debounce
- `P2-optimization`: fail-open to avoid blocking delivery

## Efficiency Controls

- Idempotency key per `(event, task, stage)` tuple
- Debounce repeated triggers in noisy loops
- Timeout budgets per lane
- Cooldown for repeatedly failing hooks

## Runtime Knobs

- `OMG_HOOKS_QUIET=1`: suppresses non-essential learn-signal hook status lines while keeping fail-open behavior.
- `OMG_STATE_ROOT=<dir>`: overrides the default `.omg/state` location for retained hook state such as `learn-watch.json`.
- `OMG_DISABLED_HOOKS=model-routing`: disables only the quiet `BeforeModel` model router.
- `OMG_DISABLED_HOOKS=learn`: disables only the retained learn-signal `AfterAgent` hook.
- `GEMINI_PLANS_DIR`: when provided by Gemini CLI, can be used by hook/plan policy to reference native plan-session storage without guessing paths.

Note: OmA no longer ships the quota-watch usage monitor hook. Use Gemini CLI's native `/model` or `/stats model` output when authoritative usage or quota visibility is needed.

## Team Safety Policy

In delegated/worker sub-agent turns:

- Side-effect hooks stay disabled by default
- Read-only diagnostics and guardrail hooks remain available
- Side effects require explicit user opt-in

## Suggested Workflow

1. `/oma:hooks-init`
2. `/oma:hooks`
3. `/oma:hooks-validate`
4. `/oma:hooks-test`

Then run `/oma:autopilot` or `/oma:loop` with validated hook policy.
