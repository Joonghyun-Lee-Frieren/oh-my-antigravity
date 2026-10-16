import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

export const STATE = '.omg/state/guard.json';
export const MAX_BATCH = 3;
export const SECTION_LINES = 120;
export const MAX_CYCLES = 6;

export function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Resolve every existing ancestor, including junctions, before accepting a path.
export function within(root, name) {
  assert(typeof name === 'string' && name.length > 0, 'A file path is required.');
  const base = fs.realpathSync(root);
  const target = path.resolve(base, name);
  let ancestor = target;
  while (!fs.existsSync(ancestor)) {
    const parent = path.dirname(ancestor);
    assert(parent !== ancestor, 'Cannot resolve path.');
    ancestor = parent;
  }
  const actual = path.resolve(fs.realpathSync(ancestor), path.relative(ancestor, target));
  const relative = path.relative(base, actual);
  assert(relative && !relative.startsWith('..') && !path.isAbsolute(relative), 'Path escapes workspace.');
  assert(!relative.includes(':') && !/[\x00-\x1f]/.test(relative), 'Unsupported file path.');
  return relative.split(path.sep).join('/');
}

export function protectedFile(name) {
  return /(^|\/)(\.git|\.agents|\.gemini|\.codex)(\/|$)/i.test(name)
    || /^\.omg\/(state|evidence)(\/|$)/i.test(name);
}

export function digest(root, name) {
  const file = path.join(root, within(root, name));
  return fs.existsSync(file) ? crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') : null;
}

export function readState(root) {
  const name = within(root, STATE);
  if (!fs.existsSync(path.join(root, name))) return null;
  const state = JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
  assert(state.schema === 1 && typeof state.owner === 'string', 'Invalid guard state; repair it as operator.');
  assert(['research', 'design', 'ready', 'implement', 'review', 'repair', 'complete', 'blocked'].includes(state.phase), 'Invalid workflow phase.');
  return state;
}

export function saveState(root, state) {
  const name = within(root, STATE);
  fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
  const temporary = path.join(root, within(root, `${STATE}.${crypto.randomUUID()}.tmp`));
  state.updatedAt = new Date().toISOString();
  fs.writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`, { flag: 'wx' });
  fs.renameSync(temporary, path.join(root, name));
}

export function owner(state, conversation) {
  assert(conversation && state?.owner === conversation, 'Only the owning conversation may control this workflow.');
}

export function checkLocks(root, state) {
  for (const [file, hash] of Object.entries(state?.locks || {})) {
    assert(digest(root, file) === hash, `Locked file changed outside the workflow: ${file}. Operator recovery required.`);
  }
}

export function loadDraft(root, name) {
  const file = within(root, name);
  assert(file.startsWith('.omg/drafts/') && file.endsWith('.json'), 'Requests must be .omg/drafts/*.json.');
  return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
}

function unique(items, message) {
  assert(Array.isArray(items) && items.length > 0 && new Set(items).size === items.length, message);
}

function validatePlan(root, plan) {
  assert(typeof plan.intent === 'string' && plan.intent.trim(), 'Intent is required.');
  unique(plan.criteria, 'Supply unique acceptance criteria.');
  assert(plan.criteria.every(x => typeof x === 'string' && x.trim()), 'Criteria must be strings.');
  unique(plan.files, 'Supply an exact, unique file scope.');
  plan.files = plan.files.map(file => within(root, file));
  unique(plan.files, 'File paths must not alias one another.');
  assert(plan.files.every(file => !protectedFile(file) && !file.startsWith('.omg/')), 'Plan contains a protected path.');
  assert(Array.isArray(plan.checks) && plan.checks.length > 0, 'At least one executable check is required.');
  unique(plan.checks.map(check => check.id), 'Check IDs must be unique.');
  for (const check of plan.checks) {
    assert(/^[a-zA-Z0-9_-]+$/.test(check.id), 'Use simple check IDs.');
    assert(Array.isArray(check.argv) && check.argv.length > 0 && check.argv.every(x => typeof x === 'string' && x.length > 0), 'Checks require argv arrays.');
    const executable = path.basename(check.argv[0]).replace(/\.exe$/i, '').toLowerCase();
    assert(!/^(?:cmd|powershell|pwsh|[a-z]*sh|wscript|cscript|mshta)$/.test(executable), 'Use a validator script, not a shell.');
    if (/^(?:node|python[\d.]*)$/.test(executable)) {
      assert(check.argv.length >= 2 && !check.argv[1].startsWith('-'), 'Use a validator script, not an inline interpreter.');
      const script = within(root, check.argv[1]);
      assert(fs.existsSync(path.join(root, script)) && fs.statSync(path.join(root, script)).isFile(), 'Validator script must exist inside the workspace before design is sealed.');
    }
    assert(Array.isArray(check.files) && check.files.length > 0 && check.files.every(file => plan.files.includes(file)), 'Each check must name scoped files.');
    assert(Array.isArray(check.criteria) && check.criteria.length > 0 && check.criteria.every(x => plan.criteria.includes(x)), 'Each check must cover acceptance criteria.');
  }
  for (const file of plan.files) assert(plan.checks.some(check => check.files.includes(file)), `No check covers ${file}.`);
  for (const criterion of plan.criteria) assert(plan.checks.some(check => check.criteria.includes(criterion)), `No check covers ${criterion}.`);
  assert(Array.isArray(plan.testFiles || []) && (plan.testFiles || []).every(file => plan.files.includes(file)), 'testFiles must be explicitly scoped.');
  return plan;
}

export function withStateLock(root, operation) {
  const lock = path.join(root, within(root, '.omg/state/guard.lock'));
  fs.mkdirSync(path.dirname(lock), { recursive: true });
  // Atomic mkdir provides mutual exclusion across hook/controller processes.
  fs.mkdirSync(lock);
  try { return operation(); }
  finally { fs.rmdirSync(lock); }
}

export function control(root, conversation, action, draftName) {
  return withStateLock(root, () => controlUnlocked(root, conversation, action, draftName));
}

function controlUnlocked(root, conversation, action, draftName) {
  let state = readState(root);
  if (action === 'status') return state || { phase: 'uninitialized' };
  if (action === 'init') {
    assert(!state || state.phase === 'complete', 'An active or blocked workflow already exists.');
    assert(conversation, 'Conversation ownership is required.');
    state = { schema: 1, owner: conversation, phase: 'research', cycle: 0, nudges: 0, locks: state?.locks || {}, issues: [], batch: [], reviews: {} };
  } else {
    owner(state, conversation);
    checkLocks(root, state);
    if (action === 'block') {
      const request = loadDraft(root, draftName);
      assert(typeof request.reason === 'string' && request.reason.trim(), 'State the actual blocker.');
      state.phase = 'blocked';
      state.blocker = request.reason;
    } else if (action === 'handoff') {
      assert(state.phase === 'research', 'Handoff is only accepted in research.');
      const handoff = loadDraft(root, draftName);
      assert(handoff.agent === 'oma-doc-reader' && typeof handoff.summary === 'string' && handoff.summary.trim(), 'A doc-reader summary is required.');
      assert(Array.isArray(handoff.sources) && handoff.sources.length > 0 && handoff.sources.every(source => typeof source === 'string' && source.trim()), 'Document sources are required.');
      assert(Array.isArray(handoff.unknowns), 'State unknowns explicitly.');
      state.handoff = handoff;
      state.phase = 'design';
    } else if (action === 'plan') {
      assert(state.phase === 'design', 'Read documentation and submit a handoff before design.');
      state.plan = validatePlan(root, loadDraft(root, draftName));
      assert(state.plan.files.every(file => !state.locks[file]), 'Reopening locked code requires operator recovery.');
      state.designSealed = true;
    } else if (action === 'start') {
      assert(state.phase === 'ready', 'Implementation starts only after the design execution has stopped.');
      state.phase = 'implement';
    } else if (action === 'verify') {
      assert(['implement', 'repair'].includes(state.phase), 'Verification requires an implementation or repair batch.');
      verify(root, state);
    } else if (action === 'review') {
      assert(state.phase === 'review', 'Run verification before submitting section reviews.');
      const receipt = loadDraft(root, draftName);
      const section = state.sections.find(section => section.id === receipt.section);
      assert(section && receipt.hash === section.hash, 'Review must identify a current section and its hash.');
      assert(digest(root, section.file) === section.hash, 'Code changed since verification.');
      assert(receipt.agent === 'oma-reviewer', 'Use the read-only section reviewer.');
      assert(['pass', 'fail', 'unknown'].includes(receipt.verdict), 'Review verdict is pass, fail, or unknown.');
      assert(typeof receipt.evidence === 'string' && receipt.evidence.trim().length >= 12, 'Concrete review evidence is required.');
      assert(Array.isArray(receipt.criteria) && state.plan.criteria.every(item => receipt.criteria.includes(item)), 'Reviewer must account for every acceptance criterion, including those not applicable to this section.');
      assert(Array.isArray(receipt.findings), 'Supply findings, including an empty array when none exist.');
      for (const finding of receipt.findings) {
        assert(Number.isInteger(finding.line) && finding.line >= section.start && finding.line <= section.end && typeof finding.reason === 'string' && finding.reason.trim(), 'Findings require a line inside the section and a reproducible reason.');
      }
      assert(receipt.verdict !== 'pass' || receipt.findings.length === 0, 'A section with open findings cannot pass.');
      state.reviews[section.id] = receipt;
    } else {
      throw new Error(`Unknown workflow action: ${action}`);
    }
  }
  saveState(root, state);
  return state;
}

function verify(root, state) {
  const before = Object.fromEntries(state.plan.files.map(file => [file, digest(root, file)]));
  state.checks = state.plan.checks.map(check => {
    // No shell, no agent-supplied result, no success fallback. Validators are trusted project code.
    const run = spawnSync(check.argv[0], check.argv.slice(1), { cwd: root, encoding: 'utf8', timeout: 30000, maxBuffer: 1024 * 1024, shell: false });
    const log = `${run.stdout || ''}${run.stderr || ''}${run.error ? `\n${run.error.message}` : ''}`;
    const evidence = `.omg/evidence/${crypto.randomUUID()}.txt`;
    fs.mkdirSync(path.dirname(path.join(root, within(root, evidence))), { recursive: true });
    fs.writeFileSync(path.join(root, evidence), log, { flag: 'wx' });
    return { id: check.id, files: check.files, criteria: check.criteria, argv: check.argv, exitCode: run.status, signal: run.signal, status: run.status === 0 && !run.error ? 'pass' : 'fail', evidence, at: new Date().toISOString() };
  });
  checkLocks(root, state);
  state.hashes = Object.fromEntries(state.plan.files.map(file => [file, digest(root, file)]));
  assert(state.plan.files.every(file => before[file] === state.hashes[file]), 'Validator modified scoped code; evidence rejected.');
  state.sections = [];
  for (const file of state.plan.files) {
    const hash = state.hashes[file];
    assert(hash, `Scoped file is missing: ${file}. Report a blocker for unsupported deletions.`);
    const lines = fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/).length;
    for (let start = 1; start <= lines; start += SECTION_LINES) {
      state.sections.push({ id: `${file}:${start}`, file, start, end: Math.min(start + SECTION_LINES - 1, lines), hash });
    }
  }
  state.reviews = {};
  state.phase = 'review';
  state.nudges = 0;
}

export function stop(root, input) {
  return withStateLock(root, () => stopUnlocked(root, input));
}

function stopUnlocked(root, input) {
  const state = readState(root);
  if (!state || state.owner !== input.conversationId) return { decision: 'allow' };
  assert(Number.isInteger(input.executionNum) && input.executionNum >= 0, 'Stop requires a valid executionNum.');
  checkLocks(root, state);
  // Never restart cancellation, errors, exhausted execution, or live async work.
  if (input.fullyIdle !== true || input.terminationReason !== 'model_stop' || input.error) return { decision: 'allow' };
  const token = String(input.executionNum);
  if (state.lastStop === token) return { decision: 'allow', reason: 'Duplicate Stop event ignored.' };
  state.lastStop = token;
  let output = { decision: 'allow' };
  if (state.phase === 'design' && state.designSealed) {
    state.phase = 'ready';
    output.reason = 'Design sealed. Start implementation in the next user turn with /oma-team-exec.';
  } else if (['implement', 'repair'].includes(state.phase)) {
    state.nudges += 1;
    if (state.nudges <= 2) output = { decision: 'continue', reason: 'Run workflow verify for this slice, then request read-only section reviews. Report a blocker if verification cannot run.' };
    else { state.phase = 'blocked'; state.blocker = 'Verification was not supplied after two continuations.'; }
  } else if (state.phase === 'review') {
    const missing = state.sections.filter(section => !state.reviews[section.id]);
    if (missing.length > 0) {
      output.reason = `${missing.length} section review(s) missing: status remains unknown. Resume with /oma-team-verify.`;
    } else {
      assert(state.plan.files.every(file => digest(root, file) === state.hashes[file]), 'Code changed after verification; cannot accept stale evidence.');
      const issues = state.checks.filter(check => check.status !== 'pass').map(check => ({ id: `check:${check.id}`, files: check.files, reason: `Validator ${check.id} failed; see ${check.evidence}` }));
      for (const section of state.sections) {
        const receipt = state.reviews[section.id];
        if (receipt.verdict !== 'pass') issues.push({ id: `review:${section.id}`, files: [section.file], reason: receipt.evidence });
      }
      // A whole file locks only after every section and every covering check passed.
      for (const file of state.plan.files) {
        if (!issues.some(issue => issue.files.includes(file))) state.locks[file] = state.hashes[file];
      }
      state.issues = issues;
      if (issues.length === 0) { state.phase = 'complete'; state.batch = []; }
      else {
        const signature = issues.map(issue => issue.id).sort().join('|') + JSON.stringify(state.hashes);
        state.stagnant = signature === state.lastFailure ? (state.stagnant || 0) + 1 : 0;
        state.lastFailure = signature;
        state.cycle += 1;
        state.batch = issues.slice(0, MAX_BATCH);
        if (state.cycle > MAX_CYCLES || state.stagnant >= 2 || state.batch.some(issue => issue.files.some(file => state.locks[file]))) {
          state.phase = 'blocked';
          state.blocker = 'Repair limit, repeated failure, or a regression in locked code requires operator recovery.';
        } else {
          state.phase = 'repair';
          output = { decision: 'continue', reason: `Repair only this batch (maximum ${MAX_BATCH} issues): ${JSON.stringify(state.batch)}. Passed files are locked. Run verify and section reviews before another batch.` };
        }
      }
    }
  }
  saveState(root, state);
  return output;
}
