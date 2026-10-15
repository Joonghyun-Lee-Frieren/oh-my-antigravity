import fs from "node:fs";

export const CATALOG = JSON.parse(fs.readFileSync(new URL("../../config/models.json", import.meta.url), "utf8"));
export const object = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const own = (o, k) => Object.hasOwn(o, k);
const lanes = Object.keys(CATALOG.lane_effort);
// Removed OmA presets, not a claim that the provider has retired every older model.
const removed = /^gemini-3(?:\.1)?-(?:pro|flash|flash-lite)-preview(?:-|$)/;
const roles = {
  "oma-director": "planning", "oma-architect": "planning", "oma-planner": "planning",
  "oma-product": "planning", "oma-consultant": "planning", "oma-consensus": "planning",
  "oma-researcher": "planning", "oma-interview": "planning", interview: "planning", "oma-executor": "execution",
  "oma-editor": "execution", "oma-quick": "quick_edit", "oma-reviewer": "review_verify",
  "oma-verifier": "review_verify", "oma-debugger": "review_verify",
};
const commands = {
  plan: "planning", "oma-plan": "planning", "team-plan": "planning", "team-prd": "planning",
  "team-assemble": "planning", goal: "planning", research: "planning", quick: "quick_edit",
  execute: "execution", "team-exec": "execution", review: "review_verify",
  "team-verify": "review_verify", "team-fix": "review_verify",
};
export function normalizeModel(value) {
  if (typeof value !== "string") return null;
  const id = value.trim().replace(/^models\//, "");
  return /^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,127}$/.test(id) && !removed.test(id) ? id : null;
}
export function detectLane(input = {}, policy = {}) {
  for (const lane of [input.oma_lane, input.metadata?.oma_lane, policy.active_lane]) {
    if (lanes.includes(lane)) return { lane, reason: "explicit-lane" };
  }
  for (const name of [input.agent_name, input.agent]) {
    if (typeof name === "string" && own(roles, name)) return { lane: roles[name], reason: "agent-role" };
  }
  const messages = Array.isArray(input.llm_request?.messages) ? input.llm_request.messages : [];
  const latest = messages.findLast((m) => m?.role === "user");
  const text = typeof input.prompt === "string" ? input.prompt : typeof latest?.content === "string" ? latest.content : "";
  const command = text.match(/^\s*(?:\/oma[: ]|\$)([a-z][a-z-]*)\b/i)?.[1]?.toLowerCase();
  if (command && own(commands, command)) return { lane: commands[command], reason: "current-command" };
  return { lane: "execution", reason: "default-execution" };
}
export function selectModel(input = {}, policy = {}) {
  if (!object(input)) input = {};
  if (!object(policy)) policy = {};
  const strategy = ["auto", "balanced", "quality", "custom"].includes(policy.strategy) ? policy.strategy : CATALOG.default_strategy;
  const { lane, reason } = detectLane(input, policy);
  const result = { strategy, lane, reason, requested: normalizeModel(input.modelName ?? input.llm_request?.model), model: null, effort: null, fallback: null };
  if (strategy === "auto") return result;
  const profile = CATALOG.profiles[strategy === "quality" ? "quality" : "balanced"];
  const overrides = strategy === "custom" && object(policy.lane_models) ? policy.lane_models : {};
  const raw = own(overrides, lane) ? overrides[lane] : profile[lane];
  if (raw === "auto") return result;
  const model = normalizeModel(raw);
  if (!model) return { ...result, fallback: "invalid-or-removed-preset" };
  // This is an operator constraint, not live model or entitlement discovery.
  if (Array.isArray(policy.available_models) && !policy.available_models.map(normalizeModel).includes(model)) {
    return { ...result, fallback: "not-in-configured-inventory" };
  }
  const base = model.replace(/-(low|medium|high)$/, "");
  const caps = own(CATALOG.models, base) ? CATALOG.models[base] : null;
  const effort = caps ? (caps.thinking_levels.includes(policy.lane_effort?.[lane]) ? policy.lane_effort[lane] : CATALOG.lane_effort[lane]) : null;
  return { ...result, model, effort };
}
