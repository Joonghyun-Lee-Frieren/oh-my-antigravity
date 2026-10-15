import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
const root = path.resolve(import.meta.dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const json = (file) => JSON.parse(read(file));
assert.deepEqual(Object.keys(json("plugin.json")).sort(), ["description", "name"]);
assert.equal(json("plugin.json").name, "oh-my-antigravity");
assert.equal(json("package.json").version, json("gemini-extension.json").version);
const native = json("hooks.json")["oma-tool-cycle"];
assert.deepEqual(Object.keys(native).sort(), ["PostToolUse", "PreInvocation", "Stop"]);
for (const groups of Object.values(native)) for (const group of groups) for (const hook of group.hooks ?? [group]) {
  assert.equal(hook.timeout, 5);
  assert.doesNotMatch(hook.command, /\$\{extensionPath\}/);
}
const gemini = json("hooks/hooks.json").hooks;
assert.deepEqual(Object.keys(gemini).sort(), ["AfterAgent", "AfterTool", "BeforeModel"]);
for (const groups of Object.values(gemini)) for (const group of groups) for (const hook of group.hooks) {
  assert.ok(hook.timeout >= 1000);
  assert.match(hook.command, /\$\{extensionPath\}/);
}
for (const file of fs.readdirSync(path.join(root, "commands/oma"))) {
  assert.doesNotMatch(read(`commands/oma/${file}`), /\$ARGUMENTS|gemini-3(?:\.1)?-(?:pro|flash|flash-lite)-preview/);
}
const tools = new Set(["view_file", "grep_search", "find_by_name", "list_dir", "write_to_file", "replace_file_content", "multi_replace_file_content", "run_command", "search_web", "read_url_content", "invoke_subagent", "send_message", "manage_subagents"]);
for (const file of fs.readdirSync(path.join(root, "agents"))) {
  const meta = read(`agents/${file}`).split("---")[1];
  assert.match(meta, /^name: .+/m);
  assert.match(meta, /^description: .+/m);
  assert.match(meta, /^model: inherit$/m);
  assert.match(meta, /^subagent: true$/m);
  assert.match(meta, /^mainAgent: (true|false)$/m);
  assert.match(meta, /^commandExecutionPolicy: sandbox$/m);
  const list = [...meta.matchAll(/^  - (.+)$/gm)].map((m) => m[1]);
  assert.ok(list.length > 0, `No tools: ${file}`);
  for (const tool of list) assert.ok(tools.has(tool), `${file}: unknown tool ${tool}`);
}
const result = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], { cwd: root, encoding: "utf8", shell: process.platform === "win32" });
assert.equal(result.status, 0, result.stderr);
const files = new Set(JSON.parse(result.stdout)[0].files.map((f) => f.path));
for (const file of ["plugin.json", "hooks.json", "config/models.json", "rules/oma.md", "skills/oma/SKILL.md", "hooks/lib/lifecycle.mjs", "hooks/lib/runtime.mjs", "hooks/lib/model-policy.mjs", "tests/lifecycle.test.mjs", "scripts/check-version.js", "resources/image/oma_logo_02.png"]) assert.ok(files.has(file), `Missing packed file ${file}`);
console.log(`Validated both host manifests, 14 native agent descriptors and ${files.size} packed files.`);
