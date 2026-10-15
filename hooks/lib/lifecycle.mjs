import path from "node:path";
import { selectModel } from "./model-policy.mjs";
import { disabled, off, hash, pathsFor, policyFor, readJson, trace, withSession } from "./runtime.mjs";
const edits = new Set(["write_file", "replace", "edit_file", "apply_patch", "write_to_file", "replace_file_content", "multi_replace_file_content"]);
const reminders = {
  denied: "OmA: the last action was denied. Do not retry unchanged or bypass permissions. Request approval or use an allowed alternative.",
  repeated: "OmA: the same operation failed repeatedly. Stop unchanged retries, inspect the cause, change the plan, or report the blocker.",
  edited: "OmA: a file-edit tool completed. Inspect the diff and run focused checks. Tool completion alone is not verification evidence.",
};
function enabled(input) {
  if (disabled("tool-cycle") || off(process.env.OMG_TOOL_CYCLE)) return false;
  const p = pathsFor(input);
  return !p || readJson(path.join(p.root, "hooks.json")).enabled !== false;
}
export function afterTool(input, host = "antigravity") {
  if (!enabled(input)) return {};
  const native = host === "antigravity";
  const name = native ? input.toolCall?.name : input.tool_name;
  if (typeof name !== "string" || !/^[a-zA-Z0-9_.:/-]{1,160}$/.test(name)) return {};
  const args = native ? input.toolCall?.args : input.tool_input;
  const error = native ? input.error : input.tool_response?.error ?? (input.tool_response?.isError ? "error" : "");
  const failed = Boolean(error);
  const denied = failed && /denied|permission|not allowed|rejected|approval required/i.test(typeof error === "string" ? error : JSON.stringify(error));
  const signature = hash(`${name}\0${JSON.stringify(args ?? {})}`);
  const id = native ? input.stepIdx : input.tool_call_id ?? input.toolCallId;
  const event = id !== null && id !== undefined ? hash(`${host}\0${id}\0${signature}\0${failed}`) : null;
  const message = withSession(input, (state) => {
    const seen = Array.isArray(state.seen) ? state.seen : [];
    if (event && seen.includes(event)) return "";
    if (event) state.seen = [...seen, event].slice(-32);
    const failures = failed ? (state.last?.signature === signature ? Math.min(100, (Number(state.last.failures) || 0) + 1) : 1) : 0;
    state.last = { tool: name, signature, failures, status: denied ? "denied" : failed ? "failed" : "completed" };
    state.observations = (Number(state.observations) || 0) + 1;
    state.updated_at = new Date().toISOString();
    if (!failed && state.pending?.key?.endsWith(`:${signature}`)) delete state.pending;
    const kind = denied ? "denied" : failures >= 2 ? "repeated" : !failed && edits.has(name) && !state.edit_reminded ? "edited" : null;
    const key = `${kind}:${signature}`;
    if (kind && state.last_reminder !== key) {
      state.pending = { kind, key };
      if (kind === "edited") state.edit_reminded = true;
      if (!native) { state.last_reminder = key; delete state.pending; return reminders[kind]; }
    }
    return "";
  });
  // Native PostToolUse is observation-only; never inject tools or change permissions.
  return !native && message ? { hookSpecificOutput: { additionalContext: message } } : {};
}
export function handleNative(input, event) {
  if (event === "PostToolUse") return afterTool(input);
  if (event === "Stop") {
    if (enabled(input)) withSession(input, (state) => {
      state.termination = ["model_stop", "max_steps_exceeded", "error"].includes(input.terminationReason) ? input.terminationReason : "unknown";
      state.fully_idle = input.fullyIdle === true;
      delete state.pending;
    });
    return { decision: "allow" }; // Never force continuation after cancellation or errors.
  }
  if (event !== "PreInvocation" || !enabled(input)) return {};
  trace(input, selectModel(input, policyFor(input)), "antigravity");
  const message = withSession(input, (state) => {
    const item = state.pending;
    delete state.pending;
    if (!item || !Object.hasOwn(reminders, item.kind) || state.last_reminder === item.key) return "";
    state.last_reminder = item.key;
    return reminders[item.kind];
  });
  return message ? { injectSteps: [{ ephemeralMessage: message }] } : {};
}
