import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { control, stop, readState, STATE, within, withStateLock } from '../hooks/lib/workflow.mjs';
import { handle, CONTROLLER } from '../hooks/scripts/guard.mjs';
import { catalog, modelPolicy } from '../scripts/model-policy.mjs';

const owner = 'owner-conversation';
function fixture(t, count = 1) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-guard-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, '.omg/drafts'), { recursive: true });
  fs.mkdirSync(path.join(root, 'src'), { recursive: true });
  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  const files = Array.from({ length: count }, (_, i) => `src/f${i}.js`);
  for (const file of files) fs.writeFileSync(path.join(root, file), 'export const value = 1;\n');
  fs.writeFileSync(path.join(root, 'scripts/pass.mjs'), 'console.log("real validator output");');
  fs.writeFileSync(path.join(root, 'scripts/fail.mjs'), 'console.error("real failure"); process.exitCode = 1;');
  const draft = (name, value) => {
    const file = `.omg/drafts/${name}.json`;
    fs.writeFileSync(path.join(root, file), JSON.stringify(value));
    return file;
  };
  const plan = { intent: 'Exercise guarded behavior', criteria: ['behavior'], files,
    checks: files.map((file, i) => ({ id: `c${i}`, argv: [process.execPath, 'scripts/pass.mjs'], files: [file], criteria: ['behavior'] })) };
  const call = (action, body) => control(root, owner, action, body ? draft(action, body) : undefined);
  const prepare = () => {
    call('init');
    call('handoff', { agent: 'oma-doc-reader', summary: 'Confirmed the public behavior from documentation.', sources: ['docs/spec.md'], unknowns: [] });
    call('plan', plan);
  };
  const end = (executionNum = 0, extra = {}) => stop(root, { conversationId: owner, executionNum, fullyIdle: true, terminationReason: 'model_stop', ...extra });
  const begin = () => { prepare(); end(); call('start'); };
  const review = (verdict = 'pass') => {
    for (const section of readState(root).sections) {
      call('review', { agent: 'oma-reviewer', section: section.id, hash: section.hash, verdict, criteria: ['behavior'], evidence: 'Read the supplied section and traced its behavior against the spec.', findings: [] });
    }
  };
  const pre = (name, args, conversationId = owner) => handle('pre', { workspacePaths: [root], conversationId, toolCall: { name, args } });
  return { root, files, draft, plan, call, prepare, end, begin, review, pre };
}

test('requires documentation and a separate design Stop before implementation', t => {
  const f = fixture(t);
  f.call('init');
  assert.throws(() => f.call('plan', f.plan), /documentation/);
  assert.throws(() => f.call('start'), /after the design/);
  f.call('handoff', { agent: 'oma-doc-reader', summary: 'Read the spec', sources: ['spec'], unknowns: [] });
  f.call('plan', f.plan);
  assert.throws(() => f.call('start'), /after the design/);
  assert.throws(() => f.pre('write_to_file', { TargetFile: f.files[0], CodeContent: 'code' }), /during design/);
  assert.equal(f.end().decision, 'allow');
  assert.equal(readState(f.root).phase, 'ready');
  f.call('start');
  assert.equal(f.pre('write_to_file', { TargetFile: f.files[0], CodeContent: 'code' }).decision, 'allow');
});

test('sealed scope, ownership, protected evidence, and test integrity are enforced', t => {
  const f = fixture(t); f.begin();
  assert.throws(() => f.pre('write_to_file', { TargetFile: 'outside.js', CodeContent: 'x' }), /scope/);
  assert.throws(() => f.pre('write_to_file', { TargetFile: f.files[0], CodeContent: 'x' }, 'worker'), /owning/);
  assert.throws(() => control(f.root, 'other', 'start'), /owning/);
  for (const file of ['.omg/state/guard.json', '.omg/evidence/pass.txt', '.git/config', '.agents/hooks.json']) {
    assert.throws(() => f.pre('write_to_file', { TargetFile: file, CodeContent: '{}' }), /owned/);
  }
  for (const content of ['test.skip("fake", () => {})', 'it.only("fake", () => {})', 'process.exit(0)']) {
    assert.throws(() => f.pre('replace_file_content', { TargetFile: f.files[0], ReplacementContent: content }), /manufacture|short-circuit/);
  }
  assert.throws(() => f.call('plan', f.plan), /before design/);
});

test('rejects traversal, absolute escapes, and junction aliases', t => {
  const f = fixture(t);
  assert.throws(() => within(f.root, '../escape.js'), /escapes/);
  assert.throws(() => within(f.root, path.join(os.tmpdir(), 'escape.js')), /escapes/);
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-outside-'));
  t.after(() => fs.rmSync(outside, { recursive: true, force: true }));
  fs.symlinkSync(outside, path.join(f.root, 'junction'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => within(f.root, 'junction/new/file.js'), /escapes/);
});

test('only exact installed controller invocations pass the shell gate', t => {
  const f = fixture(t);
  const command = `node "${CONTROLLER}" init`;
  const result = f.pre('run_command', { CommandLine: command, Cwd: 'untrusted' });
  assert.equal(result.decision, 'allow');
  assert.equal(result.overwrite.Cwd, f.root);
  assert.ok(result.overwrite.CommandLine.includes(owner));
  for (const text of [`${command}; echo bypass`, `${command} --owner other`, 'node -e "process.exit(0)"', 'python edit.py', 'git reset --hard', 'npm test || true', `node "${CONTROLLER}.fake" init`]) {
    assert.throws(() => f.pre('run_command', { CommandLine: text }), /restricted/);
  }
  assert.throws(() => f.pre('manage_task', { Action: 'send_input', Input: 'echo bypass' }), /outside/);
  assert.throws(() => f.pre('mcp_arbitrary_write', {}), /outside/);
  assert.throws(() => f.pre('define_subagent', {}), /outside/);
  assert.throws(() => f.pre('invoke_subagent', { Subagents: [{ TypeName: 'self' }] }), /capability/);
  assert.equal(f.pre('invoke_subagent', { Subagents: [{ TypeName: 'oma-doc-reader' }] }).decision, 'allow');
});

test('real validator failure cannot be converted to pass by review prose', t => {
  const f = fixture(t); f.plan.checks[0].argv[1] = 'scripts/fail.mjs'; f.begin();
  f.call('verify'); f.review();
  const state = readState(f.root);
  assert.equal(state.checks[0].exitCode, 1);
  assert.equal(state.checks[0].status, 'fail');
  assert.match(fs.readFileSync(path.join(f.root, state.checks[0].evidence), 'utf8'), /real failure/);
  assert.equal(f.end(1).decision, 'continue');
  assert.equal(readState(f.root).phase, 'repair');
  assert.deepEqual(readState(f.root).locks, {});
});

test('complete section coverage locks passing code and rejects stale evidence', t => {
  const f = fixture(t); f.begin();
  fs.writeFileSync(path.join(f.root, f.files[0]), 'const value = 1;\n'.repeat(250));
  f.call('verify');
  assert.equal(readState(f.root).sections.length, 3);
  assert.ok(readState(f.root).sections.every(s => s.end - s.start < 120));
  assert.equal(f.end(1).decision, 'allow');
  assert.equal(readState(f.root).phase, 'review');
  f.review(); f.end(2);
  assert.equal(readState(f.root).phase, 'complete');
  assert.ok(readState(f.root).locks[f.files[0]]);
  fs.writeFileSync(path.join(f.root, f.files[0]), 'changed outside');
  assert.throws(() => f.pre('view_file', { AbsolutePath: f.files[0] }), /Locked file changed/);
});

test('hash changes after verification invalidate review submission and Stop', t => {
  const f = fixture(t); f.begin(); f.call('verify'); f.review();
  fs.appendFileSync(path.join(f.root, f.files[0]), 'changed');
  assert.throws(() => f.pre('invoke_subagent', { Subagents: [{ TypeName: 'oma-reviewer', Prompt: `${f.files[0]}:1` }] }), /changed after verification/);
  assert.throws(() => f.review(), /changed since verification/);
  assert.throws(() => f.end(1), /changed after verification/);
});

test('reviewer invocation physically receives exactly one bounded source section', t => {
  const f = fixture(t); f.begin();
  fs.writeFileSync(path.join(f.root, f.files[0]), 'const line = 1;\n'.repeat(250));
  f.call('verify');
  assert.throws(() => f.pre('invoke_subagent', { Subagents: [{ TypeName: 'oma-reviewer', Prompt: 'Review this entire repository' }] }), /exact current section/);
  const result = f.pre('invoke_subagent', { Subagents: [{ TypeName: 'oma-reviewer', Prompt: `${f.files[0]}:1` }] });
  const prompt = JSON.parse(result.overwrite.Subagents[0].Prompt);
  assert.equal(prompt.content.split('\n').length, 120);
  assert.equal(prompt.file, f.files[0]);
  assert.ok(prompt.hash);
});

test('Stop schedules only three repairs and keeps already-passed files locked', t => {
  const f = fixture(t, 6);
  for (let i = 0; i < 5; i++) f.plan.checks[i].argv[1] = 'scripts/fail.mjs';
  f.begin(); f.call('verify'); f.review(); f.end(1);
  let state = readState(f.root);
  assert.equal(state.batch.length, 3);
  assert.equal(state.issues.length, 5);
  assert.ok(state.locks[f.files[5]]);
  assert.throws(() => f.pre('write_to_file', { TargetFile: f.files[4], CodeContent: 'fix later' }), /current three/);
  assert.throws(() => f.pre('write_to_file', { TargetFile: f.files[5], CodeContent: 'regress' }), /locked/);
  assert.equal(f.pre('write_to_file', { TargetFile: f.files[0], CodeContent: 'fix now' }).decision, 'allow');
  f.end(1); // duplicate must not advance the cycle
  assert.equal(readState(f.root).cycle, 1);
  fs.writeFileSync(path.join(f.root, 'scripts/fail.mjs'), 'console.log("fixed");');
  f.call('verify'); f.review(); f.end(2);
  state = readState(f.root);
  assert.equal(state.phase, 'complete');
  assert.equal(Object.keys(state.locks).length, 6);
});

test('unknown review is repairable; findings require a line within the assigned section', t => {
  const f = fixture(t); f.begin(); f.call('verify');
  const s = readState(f.root).sections[0];
  assert.throws(() => f.call('review', { agent: 'oma-reviewer', section: s.id, hash: s.hash, verdict: 'fail', criteria: ['behavior'], evidence: 'A concrete reproduction is available.', findings: [{ line: 9999, reason: 'out of scope' }] }), /inside the section/);
  f.review('unknown'); f.end(1);
  assert.equal(readState(f.root).phase, 'repair');
});

test('cancellation, background work, errors, and retry bounds do not loop indefinitely', t => {
  const f = fixture(t); f.begin();
  for (const extra of [{ terminationReason: 'cancelled' }, { fullyIdle: false }, { terminationReason: 'error', error: 'failure' }, { terminationReason: 'max_steps_exceeded' }]) {
    assert.equal(f.end(1, extra).decision, 'allow');
    assert.equal(readState(f.root).phase, 'implement');
  }
  assert.equal(f.end(2).decision, 'continue');
  assert.equal(f.end(3).decision, 'continue');
  assert.equal(f.end(4).decision, 'allow');
  assert.equal(readState(f.root).phase, 'blocked');
});

test('unchanged failing batches stop at the stagnation bound', t => {
  const f = fixture(t); f.plan.checks[0].argv[1] = 'scripts/fail.mjs'; f.begin();
  for (let cycle = 1; cycle <= 3; cycle++) { f.call('verify'); f.review(); f.end(cycle); }
  assert.equal(readState(f.root).phase, 'blocked');
});

test('missing binaries and validators that modify source never establish success', t => {
  const f = fixture(t); f.plan.checks[0].argv = ['oma-validator-that-does-not-exist']; f.begin();
  f.call('verify');
  assert.equal(readState(f.root).checks[0].status, 'fail');
  assert.equal(readState(f.root).checks[0].exitCode, null);
});

test('validator source modification invalidates the evidence', t => {
  const f = fixture(t);
  fs.writeFileSync(path.join(f.root, 'scripts/pass.mjs'), 'import fs from "node:fs"; fs.writeFileSync("src/f0.js", "mutated");');
  f.begin();
  assert.throws(() => f.call('verify'), /modified scoped code/);
  assert.equal(readState(f.root).phase, 'implement');
});

test('blocked is an honest terminal outcome and no worker can reset the workflow', t => {
  const f = fixture(t); f.begin();
  f.call('block', { reason: 'The staging dependency is unavailable.' });
  assert.equal(f.end(1).decision, 'allow');
  assert.equal(readState(f.root).phase, 'blocked');
  assert.throws(() => f.call('init'), /already exists/);
});

test('state writes are mutually exclusive and corrupt input fails closed as one JSON object', t => {
  const f = fixture(t); f.prepare();
  assert.throws(() => withStateLock(f.root, () => f.call('status')), /EEXIST/);
  fs.writeFileSync(path.join(f.root, STATE), '{corrupt');
  assert.throws(() => f.pre('write_to_file', { TargetFile: f.files[0], CodeContent: 'x' }));
  const run = spawnSync(process.execPath, ['hooks/scripts/guard.mjs', 'pre'], { input: '{bad', encoding: 'utf8' });
  assert.equal(JSON.parse(run.stdout).decision, 'deny');
  assert.ok(run.stderr.includes('guard'));
});

test('current model profiles use maintained IDs and custom never silently fills missing lanes', () => {
  assert.deepEqual(Object.keys(catalog.models), ['gemini-4-argon', 'gemini-3.8-flash']);
  assert.equal(modelPolicy().lanes.planning, 'gemini-4-argon-high');
  assert.ok(Object.values(modelPolicy('flash').lanes).every(id => id.startsWith('gemini-3.8-flash-')));
  assert.deepEqual(modelPolicy('auto').lanes, {});
  assert.throws(() => modelPolicy('custom', { planning: 'custom' }), /missing execution/);
});

test('sealed validators reject shell and Windows interpreter inline bypasses', t => {
  const f = fixture(t); f.call('init');
  f.call('handoff', { agent: 'oma-doc-reader', summary: 'Read specification', sources: ['spec'], unknowns: [] });
  for (const argv of [['node.exe', '-e', 'true'], ['python.exe', '-c', 'pass'], ['bash.exe', '-c', 'true'], ['pwsh.exe', '-Command', 'exit 0']]) {
    const plan = { ...f.plan, checks: [{ ...f.plan.checks[0], argv }] };
    assert.throws(() => f.call('plan', plan), /validator script/);
  }
});
