import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { afterTool, handleNative } from "../hooks/lib/lifecycle.mjs";
import { pathsFor, readJson } from "../hooks/lib/runtime.mjs";
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "oma hooks "));
const root = path.resolve(import.meta.dirname, "..");
test.after(() => fs.rmSync(dir, { recursive: true, force: true }));
const input = (session, extra = {}) => ({ conversationId: session, workspacePaths: [dir], modelName: "gemini-4-argon", ...extra });
const call = (session, stepIdx, error = "") => input(session, { stepIdx, toolCall: { name: "run_command", args: { CommandLine: "echo SECRET_TEST_INPUT" } }, error });
const state = (i) => readJson(path.join(pathsFor(i).sessionDir, "tool-cycle.json"));
test("PostToolUse emits {}; repeated failures produce one next-call reminder", () => {
  assert.deepEqual(handleNative(call("failure", 1, "exit 1"), "PostToolUse"), {});
  assert.deepEqual(handleNative(input("failure"), "PreInvocation"), {});
  handleNative(call("failure", 2, "exit 1"), "PostToolUse");
  assert.match(handleNative(input("failure"), "PreInvocation").injectSteps[0].ephemeralMessage, /Stop unchanged retries/);
  assert.deepEqual(handleNative(input("failure"), "PreInvocation"), {});
  handleNative(call("failure", 3, "exit 1"), "PostToolUse");
  assert.deepEqual(handleNative(input("failure"), "PreInvocation"), {});
});
test("denial reminder never stores raw data or overrides permissions", () => {
  handleNative(call("denied", 1, "Permission denied: SECRET_ERROR"), "PostToolUse");
  const out = handleNative(input("denied"), "PreInvocation");
  assert.deepEqual(Object.keys(out), ["injectSteps"]);
  assert.match(out.injectSteps[0].ephemeralMessage, /Do not retry/);
  assert.doesNotMatch(JSON.stringify(state(input("denied"))), /SECRET|CommandLine|Permission denied/);
});
test("real event IDs are idempotent", () => {
  handleNative(call("replay", 1, "failed"), "PostToolUse");
  handleNative(call("replay", 1, "failed"), "PostToolUse");
  assert.equal(state(input("replay")).observations, 1);
});
test("identical retries without an ID are not accidentally deduplicated", () => {
  handleNative(call("no-id", undefined, "failed"), "PostToolUse");
  handleNative(call("no-id", undefined, "failed"), "PostToolUse");
  assert.equal(state(input("no-id")).observations, 2);
  assert.equal(state(input("no-id")).last.failures, 2);
});
test("file edits request verification only once and do not claim tests passed", () => {
  const edit = input("edit", { stepIdx: 1, toolCall: { name: "write_to_file", args: { TargetFile: "a.js" } } });
  handleNative(edit, "PostToolUse");
  assert.match(handleNative(input("edit"), "PreInvocation").injectSteps[0].ephemeralMessage, /not verification/);
  handleNative({ ...edit, stepIdx: 2 }, "PostToolUse");
  assert.deepEqual(handleNative(input("edit"), "PreInvocation"), {});
  assert.equal(state(edit).last.status, "completed");
  assert.equal(state(edit).verified, undefined);
});
test("success resets failures and clears an obsolete pending reminder", () => {
  handleNative(call("success", 1, "permission denied"), "PostToolUse");
  handleNative(call("success", 2), "PostToolUse");
  assert.equal(state(input("success")).last.failures, 0);
  assert.deepEqual(handleNative(input("success"), "PreInvocation"), {});
});
for (const reason of ["model_stop", "max_steps_exceeded", "error"]) test(`Stop respects ${reason}`, () => {
  assert.deepEqual(handleNative(input(`stop-${reason}`, { terminationReason: reason, fullyIdle: false }), "Stop"), { decision: "allow" });
  assert.equal(state(input(`stop-${reason}`)).fully_idle, false);
});
test("session IDs are isolated and cannot traverse paths", () => {
  handleNative(call("../../escape", 1, "denied"), "PostToolUse");
  assert.deepEqual(handleNative(input("different"), "PreInvocation"), {});
  assert.match(pathsFor(input("../../escape")).sessionDir, /hooks-[a-f0-9]{24}$/);
});
test("busy locks fail open without waiting or clobbering state", () => {
  fs.mkdirSync(path.join(pathsFor(input("busy")).sessionDir, ".hook-lock"), { recursive: true });
  assert.deepEqual(handleNative(call("busy", 1, "denied"), "PostToolUse"), {});
  assert.deepEqual(state(input("busy")), {});
});
test("missing metadata and unknown events are no-ops", () => {
  assert.deepEqual(handleNative({ toolCall: { name: "run_command" }, error: "denied" }, "PostToolUse"), {});
  assert.equal(pathsFor({ cwd: "relative" }), null);
  assert.deepEqual(handleNative(input("bad", { toolCall: { name: "evil; command" } }), "PostToolUse"), {});
  assert.deepEqual(handleNative(input("bad"), "PostToolCalling"), {});
});
test("Gemini appends context without replacing tool responses", () => {
  const out = afterTool({ cwd: dir, session_id: "gemini", tool_name: "run_shell_command", tool_input: { command: "SECRET" }, tool_response: { error: "permission denied" } }, "gemini");
  assert.deepEqual(Object.keys(out.hookSpecificOutput), ["additionalContext"]);
  assert.match(out.hookSpecificOutput.additionalContext, /Do not retry/);
  assert.doesNotMatch(JSON.stringify(out), /SECRET/);
});
test("native traces never claim applied model overrides", () => {
  const p = pathsFor(input("trace"));
  fs.mkdirSync(p.root, { recursive: true });
  fs.writeFileSync(path.join(p.root, "model.json"), JSON.stringify({ strategy: "quality", trace: true }));
  assert.deepEqual(handleNative(input("trace"), "PreInvocation"), {});
  const trace = readJson(path.join(p.sessionDir, "model-router-last.json"));
  assert.equal(trace.applied, false);
  assert.equal(trace.host, "antigravity");
});
test("policy disable prevents lifecycle writes", () => {
  const p = pathsFor(input("disabled"));
  fs.writeFileSync(path.join(p.root, "hooks.json"), JSON.stringify({ enabled: false }));
  try {
    assert.deepEqual(handleNative(call("disabled", 1, "denied"), "PostToolUse"), {});
    assert.deepEqual(state(input("disabled")), {});
  } finally { fs.unlinkSync(path.join(p.root, "hooks.json")); }
});
test("existing symlinked state cannot redirect writes", { skip: process.platform === "win32" }, () => {
  const workspace = fs.mkdtempSync(path.join(dir, "symlink-"));
  const outside = fs.mkdtempSync(path.join(dir, "outside-"));
  fs.symlinkSync(outside, path.join(workspace, ".omg"), "dir");
  handleNative({ ...call("symlink", 1, "denied"), workspacePaths: [workspace] }, "PostToolUse");
  assert.deepEqual(fs.readdirSync(outside), []);
});
for (const mode of ["override", "staged"]) test(`native loader works from ${mode} paths containing spaces`, () => {
  const home = path.join(dir, `home ${mode}`);
  const plugin = mode === "staged" ? path.join(home, ".gemini/antigravity-cli/plugins/oh-my-antigravity") : path.join(home, "plugin root");
  fs.mkdirSync(plugin, { recursive: true });
  for (const file of ["plugin.json", "hooks/lib", "config"]) fs.cpSync(path.join(root, file), path.join(plugin, file), { recursive: true });
  const hooks = JSON.parse(fs.readFileSync(path.join(root, "hooks.json")))["oma-tool-cycle"];
  for (const [event, handlers] of Object.entries(hooks)) {
    const command = (handlers[0].hooks?.[0] ?? handlers[0]).command;
    const result = spawnSync(command, { shell: true, input: JSON.stringify(call(`loader-${mode}-${event}`, 1)), cwd: dir, encoding: "utf8", timeout: 5000, env: { ...process.env, HOME: home, USERPROFILE: home, OMG_PLUGIN_ROOT: mode === "override" ? plugin : "" } });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, "");
    assert.deepEqual(JSON.parse(result.stdout), event === "Stop" ? { decision: "allow" } : {});
    if (event === "PostToolUse") assert.equal(state(input(`loader-${mode}-${event}`)).observations, 1);
  }
});
