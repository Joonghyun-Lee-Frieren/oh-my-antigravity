import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

import { assert, within, protectedFile, digest, readState, saveState, owner, checkLocks, loadDraft, withStateLock } from './storage.mjs';
export { STATE, within, readState, withStateLock } from './storage.mjs';
import { validateBrief, requireSettled, careFor, fingerprint } from './brief.mjs';
import { contextPack, evidenceWindow, captureTrail, resumeView } from './continuity.mjs';
import { validateSection } from './reviews.mjs';
export const MAX_BATCH = 3;
export const SECTION_LINES = 120;
export const MAX_CYCLES = 6;

function unique(items, message) {
  assert(Array.isArray(items) && items.length > 0 && new Set(items).size === items.length, message);
}

function validatePlan(root, plan) {
  assert(typeof plan.intent === 'string' && plan.intent.trim(), 'Intent is required.');
  unique(plan.criteria, 'Supply unique acceptance criteria.');
  assert(plan.criteria.every(x => typeof x === 'string' && x.trim()), 'Criteria must be strings.');
  unique(plan.files, 'Supply an exact, unique file scope.');
  plan.files = plan.files.map(file => within(root, file));
  assert(plan.files.length <= 100 && plan.files.every(file => Buffer.byteLength(file) <= 512), 'Split oversized file scopes into smaller plans.');
  unique(plan.files, 'File paths must not alias one another.');
  assert(plan.files.every(file => !protectedFile(file) && !file.startsWith('.omg/')), 'Plan contains a protected path.');
  assert(Array.isArray(plan.checks) && plan.checks.length > 0, 'At least one executable check is required.');
  unique(plan.checks.map(check => check.id), 'Check IDs must be unique.');
  for (const check of plan.checks) {
    assert(typeof check.id === 'string' && check.id.length <= 80 && /^[a-zA-Z0-9_-]+$/.test(check.id), 'Use simple check IDs.');
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

export function control(root, conversation, action, draftName) {
  return withStateLock(root, () => controlUnlocked(root, conversation, action, draftName));
}

function controlUnlocked(root, conversation, action, draftName) {
  let state = readState(root);
  if (['status', 'context'].includes(action)) return contextPack(state);
  if (action === 'resume') return resumeView(root, state);
  if (action === 'evidence') return evidenceWindow(root, state, loadDraft(root, draftName));
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
      assert(handoff.summary.length <= 6000 && handoff.sources.length <= 20 && handoff.unknowns.length <= 20, 'Documentation handoff is too large; summarize before design.');
      state.handoff = handoff;
      state.phase = 'design';
    } else if (action === 'brief') {
      assert(state.phase === 'design', 'Scope Brief requires a documentation handoff first.');
      state.brief = validateBrief(loadDraft(root, draftName));
      state.designSealed = false;
      delete state.planHash;
      delete state.planReview;
      state.tickets = {};
    } else if (action === 'plan') {
      assert(state.phase === 'design', 'Read documentation and submit a handoff before design.');
      state.plan = validatePlan(root, loadDraft(root, draftName));
      requireSettled(state.brief, state.plan);
      assert(state.plan.files.every(file => !state.locks[file]), 'Reopening locked code requires operator recovery.');
      state.care = careFor(state.brief, state.plan);
      state.planHash = fingerprint({ brief: state.brief, plan: state.plan, care: state.care });
      state.planBasis = Object.fromEntries(state.plan.files.map(file => [file, digest(root, file)]));
      state.receiptMode = 'native';
      state.tickets = {};
      delete state.planReview;
      state.designSealed = true;
    } else if (action === 'start') {
      assert(state.phase === 'ready', 'Implementation starts only after the design execution has stopped.');
      assert(!state.planBasis || state.plan.files.every(file => digest(root, file) === state.planBasis[file]), 'Source changed after design; reconcile the plan before starting.');
      state.phase = 'implement';
    } else if (action === 'verify') {
      assert(['implement', 'repair'].includes(state.phase), 'Verification requires an implementation or repair batch.');
      verify(root, state);
    } else if (action === 'review') {
      assert(state.phase === 'review', 'Run verification before submitting section reviews.');
      assert(state.receiptMode !== 'native', 'Parent-written reviews are disabled; the assigned reviewer must send its own receipt.');
      const receipt = loadDraft(root, draftName);
      validateSection(root, state, receipt);
      state.reviews[receipt.section] = receipt;
    } else if (action === 'checkpoint') {
      // Captured below together with other material controller transitions.
    } else {
      throw new Error(`Unknown workflow action: ${action}`);
    }
  }
  if (['plan', 'start', 'verify', 'block', 'checkpoint'].includes(action)) captureTrail(root, state, action);
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
    return { id: check.id, files: check.files, criteria: check.criteria, argv: check.argv, exitCode: run.status, signal: run.signal, status: run.status === 0 && !run.error ? 'pass' : 'fail', evidence, evidenceHash: digest(root, evidence), at: new Date().toISOString() };
  });
  checkLocks(root, state);
  state.hashes = Object.fromEntries(state.plan.files.map(file => [file, digest(root, file)]));
  assert(state.plan.files.every(file => before[file] === state.hashes[file]), 'Validator modified scoped code; evidence rejected.');
  state.sections = [];
  for (const file of state.plan.files) {
    const hash = state.hashes[file];
    assert(hash, `Scoped file is missing: ${file}. Report a blocker for unsupported deletions.`);
    const lines = fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/).length;
    const sectionLines = state.care?.sectionLines || SECTION_LINES;
    for (let start = 1; start <= lines; start += sectionLines) {
      state.sections.push({ id: `${file}:${start}`, file, start, end: Math.min(start + sectionLines - 1, lines), hash });
    }
  }
  state.reviews = {};
  state.tickets = {};
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
    if (state.receiptMode === 'native' && (state.planReview?.verdict !== 'pass' || state.planReview?.planHash !== state.planHash)) {
      output.reason = 'Design Check is missing or has open findings. Keep this turn in design; request the independent auditor or revise the plan.';
    } else {
      state.phase = 'ready';
      output.reason = 'Design sealed. Start implementation in the next user turn with /oma-team-exec.';
    }
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
      for (const check of state.checks) {
        assert(fs.existsSync(path.join(root, within(root, check.evidence))), 'Verification log is missing; evidence cannot pass.');
        assert(!check.evidenceHash || digest(root, check.evidence) === check.evidenceHash, 'Verification log changed after review; evidence cannot pass.');
      }
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
        const batchSize = state.care?.batchSize || MAX_BATCH;
        state.batch = issues.slice(0, batchSize);
        if (state.cycle > (state.care?.cycles || MAX_CYCLES) || state.stagnant >= 2 || state.batch.some(issue => issue.files.some(file => state.locks[file]))) {
          state.phase = 'blocked';
          state.blocker = 'Repair limit, repeated failure, or a regression in locked code requires operator recovery.';
        } else {
          state.phase = 'repair';
          output = { decision: 'continue', reason: `Repair only this batch (maximum ${batchSize} issues): ${JSON.stringify(contextPack(state).batch)}. File lists may be abbreviated; read the exact active scope from guard state when needed. Passed files are locked. Run verify and native section reviews before another batch.` };
        }
      }
    }
  }
  captureTrail(root, state, `stop:${state.phase}`);
  saveState(root, state);
  return output;
}
