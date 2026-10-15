# Host-specific lifecycle hooks

| Host | Manifest | Events | Timeout units |
| --- | --- | --- | --- |
| Antigravity | root hooks.json, oma-tool-cycle group | PostToolUse, PreInvocation, Stop | seconds (5) |
| Gemini compatibility | hooks/hooks.json | BeforeModel, AfterTool, AfterAgent | milliseconds |

PostToolCalling is an informal description, not an upstream registered event name.
Do not mix the manifests or manually register scripts already loaded by the plugin.

## Native cycle

PostToolUse consumes conversationId, workspacePaths, toolCall, stepIdx and error,
then returns exactly {}. It records only a compact observation: tool name, hashed
operation signature, count and completion/failure/denial status. The last 32 real
host event IDs are deduplicated; retries lacking IDs are counted, not suppressed.

A denial queues an immediate permission reminder. Two identical consecutive failed
operations queue a changed-approach reminder. The first successful file edit queues
a verification reminder. PreInvocation consumes a pending reminder once through
injectSteps/ephemeralMessage. Messages are static guidance, never tool output or
executable instructions reconstructed from untrusted error text.

Stop records the host termination reason and fullyIdle flag and returns
{"decision":"allow"}. It never forces a continuation, including errors and exhausted
step budgets. Completion and idleness do not prove acceptance. These hooks are
advisory workflow guards, not a hard retry limiter or a replacement for permissions.
They never spawn tools, call external services, send webhooks or change the model.

## Gemini compatibility

BeforeModel defaults to no override. Explicit profiles patch only the model field,
preserving SDK config, thought signatures, function-call IDs and messages.
AfterTool uses structured tool_response.error/isError fields and can append only
additionalContext; it does not replace the actual tool response or parse output
as instructions. The original AfterAgent learn filter remains separate and unchanged.

## State and failure behavior

New state lives under .omg/state/sessions/hooks-<session-key>/; the key hashes
workspace plus session_id/conversationId. No valid workspace/session means no write.
Raw arguments, commands, errors, output, transcripts, original IDs and secrets are
not persisted. No transcript files are read. Input is limited to 2 MiB; oversized
Gemini requests deliberately bypass optional routing rather than truncate SDK data.

Writes are atomic with a short per-session lock. Busy locks fail open without
waiting or stealing; existing symlinked state paths are not followed. A killed
process can leave .hook-lock: inspect and remove it only after confirming no hook
is active. Optional diagnostics must not break model availability. Legacy learn
state remains outside this adapter and keeps its previous filter behavior.

## Controls and checks

OMG_TOOL_CYCLE=off or OMG_DISABLED_HOOKS=tool-cycle disables the new lifecycle adapter.
.omg/state/hooks.json with enabled=false provides the same policy-based control.
OMG_MODEL_ROUTING=off disables Gemini model overrides. Trace is opt-in through
OMG_MODEL_ROUTING_TRACE=1 or model.json trace=true; native traces report applied=false.
OMG_STATE_ROOT sets an alternate state location. OMG_PLUGIN_ROOT identifies a
nonstandard native install. Hosts may filter environment variables; prefer persisted
policy flags when possible. These toggles do not disable the legacy learn filter.

```bash
npm run build:hooks
npm run check
agy plugin validate .
```

The generated loader does not rely on Gemini-only extensionPath substitution.
Tests exercise output schemas, routing, retries, denials, session isolation, root
resolution and fail-open behavior, not authenticated inference or delegation.

Sources: [Antigravity hooks](https://www.antigravity.google/docs/hooks),
[Gemini hooks](https://geminicli.com/docs/hooks/reference/),
[plugins](https://www.antigravity.google/docs/cli/plugins).
