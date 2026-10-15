import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { Readable } from "node:stream";
import { CATALOG, detectLane, normalizeModel, selectModel } from "../hooks/lib/model-policy.mjs";
import { readInput } from "../hooks/lib/runtime.mjs";
const root = path.resolve(import.meta.dirname, "..");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "oma model "));
test.after(() => fs.rmSync(dir, { recursive: true, force: true }));
function run(input, policy = {}, env = {}) {
  fs.mkdirSync(path.join(dir, ".omg/state"), { recursive: true });
  fs.writeFileSync(path.join(dir, ".omg/state/model.json"), JSON.stringify(policy));
  const result = spawnSync(process.execPath, [path.join(root, "hooks/scripts/before-model-banner.js")], {
    input: typeof input === "string" ? input : JSON.stringify({ cwd: dir, session_id: "one", ...input }),
    encoding: "utf8", timeout: 5000, env: { ...process.env, ...env },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
  return JSON.parse(result.stdout);
}
test("catalog offers current presets; auto preserves explicit host selection", () => {
  assert.deepEqual(Object.keys(CATALOG.models), ["gemini-3.8-flash", "gemini-4-argon"]);
  assert.equal(selectModel({ llm_request: { model: "host-model" } }).model, null);
  assert.equal(selectModel({}, { strategy: "auto" }).model, null);
});
for (const lane of Object.keys(CATALOG.lane_effort)) {
  test(`balanced allocation: ${lane}`, () => assert.equal(selectModel({ oma_lane: lane }, { strategy: "balanced" }).model, "gemini-3.8-flash"));
  test(`quality allocation: ${lane}`, () => assert.equal(selectModel({ oma_lane: lane }, { strategy: "quality" }).model, CATALOG.profiles.quality[lane]));
}
test("route only from current user command, explicit lane or role", () => {
  assert.equal(detectLane({ prompt: "/oma team-plan" }).lane, "planning");
  assert.equal(detectLane({ prompt: "/oma:team-verify" }).lane, "review_verify");
  assert.equal(detectLane({ prompt: "$oma-plan" }).lane, "planning");
  assert.equal(detectLane({ prompt: "/oma team-plan", oma_lane: "quick_edit" }).lane, "quick_edit");
  assert.equal(detectLane({ agent_name: "oma-reviewer" }).lane, "review_verify");
  const messages = [{ role: "system", content: "/oma quick" }, { role: "user", content: "$research" }, { role: "tool", content: "/oma:team-verify" }, { role: "user", content: "Implement this change" }];
  assert.equal(detectLane({ llm_request: { messages } }).lane, "execution");
});
test("custom IDs allow future models but not removed presets or unsafe strings", () => {
  assert.equal(normalizeModel("models/gemini-future"), "gemini-future");
  for (const id of ["gemini-3.1-pro-preview", "gemini-3-flash-preview", "gemini-3.1-flash-lite-preview", "bad; command", "", {}, "x".repeat(129)]) assert.equal(normalizeModel(id), null);
  assert.equal(selectModel({}, { strategy: "custom", lane_models: { execution: "future-model" } }).model, "future-model");
  assert.equal(selectModel({}, { strategy: "custom", lane_models: { execution: "auto" } }).model, null);
  assert.equal(selectModel({}, { strategy: "custom", lane_models: { execution: "gemini-3-flash-preview" } }).fallback, "invalid-or-removed-preset");
});
test("operator inventory constrains routing without inventing access", () => {
  assert.equal(selectModel({}, { strategy: "balanced", available_models: [] }).model, null);
  assert.equal(selectModel({}, { strategy: "balanced", available_models: ["gemini-3.8-flash"] }).model, "gemini-3.8-flash");
});
test("thinking and caching recommendations are model-specific", () => {
  assert.equal(CATALOG.models["gemini-4-argon"].explicit_caching, false);
  assert.equal(CATALOG.models["gemini-3.8-flash"].explicit_caching, true);
  assert.equal(selectModel({}, { strategy: "balanced", lane_effort: { execution: "xhigh" } }).effort, "medium");
  assert.equal(selectModel({}, { strategy: "custom", lane_models: { execution: "future-model" } }).effort, null);
});
test("BeforeModel overrides only model, leaving SDK message/config fields intact", () => {
  const input = { llm_request: { model: "host-model", messages: [{ role: "assistant", content: "signature:keep" }], config: { thinkingConfig: { thinkingLevel: "high" }, tools: [{ functionDeclarations: [] }] } } };
  assert.deepEqual(run(input, { strategy: "quality", active_lane: "planning" }), { hookSpecificOutput: { llm_request: { model: "gemini-4-argon" } } });
  assert.deepEqual(run(input, { strategy: "auto" }), {});
  assert.deepEqual(run(input, { strategy: "balanced" }, { OMG_MODEL_ROUTING: "off" }), {});
  assert.deepEqual(run(input, { strategy: "balanced" }, { OMG_DISABLED_HOOKS: "model-routing" }), {});
});
for (const bad of ["not-json", "null", "[]", "{", " ", JSON.stringify({ data: "x".repeat(2 * 1024 * 1024) })]) {
  test(`invalid/oversized input fails open (${bad.length} bytes)`, () => assert.deepEqual(run(bad, { strategy: "balanced" }), {}));
}
test("trace is opt-in and session-local", () => {
  run({ llm_request: { model: "host-model" } }, { strategy: "balanced", trace: true });
  assert.equal(fs.existsSync(path.join(dir, ".omg/state/model-router-last.json")), false);
  const sessions = fs.readdirSync(path.join(dir, ".omg/state/sessions"));
  const trace = JSON.parse(fs.readFileSync(path.join(dir, ".omg/state/sessions", sessions[0], "model-router-last.json")));
  assert.equal(trace.host, "gemini");
  assert.equal(trace.applied, true);
});
test("UTF-8 chunk boundaries preserve Korean input", async () => {
  const data = Buffer.from(JSON.stringify({ prompt: "검증해 주세요" }));
  const stream = Readable.from([data.subarray(0, 14), data.subarray(14, 16), data.subarray(16)]);
  assert.equal((await readInput(stream)).prompt, "검증해 주세요");
});
