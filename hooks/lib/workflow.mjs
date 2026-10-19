import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { assert, within, protectedFile, digest, readState, saveState, owner, checkLocks, loadDraft, withStateLock } from './storage.mjs';
export { STATE, within, readState, withStateLock } from './storage.mjs';
import { validateBrief, requireSettled, careFor, fingerprint } from './brief.mjs';
import { contextPack, evidenceWindow, captureTrail, resumeView } from './continuity.mjs';
import { validateSection } from './reviews.mjs';
import { validatorInputs, inputHashes, assertValidatorBasis, assertEvidenceInputs } from './validation.mjs';
import { registerSources, readSource, requireReading, assertSourcesCurrent } from './reading.mjs';
import { repairGroups, groupIssues, selectRepairs } from './repairs.mjs';
import { readOnlyPaths, boundaryHashes, assertBoundaries } from './boundaries.mjs';
import { runProbe } from './probes.mjs';
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
  assert(Array.isArray(plan.checks) && plan.checks.length > 0 && plan.checks.length <= 100, 'Supply 1..100 executable checks.');
  unique(plan.checks.map(check => check.id), 'Check IDs must be unique.');
  for (const check of plan.checks) {
    assert(typeof check.id === 'string' && check.id.length <= 80 && /^[a-zA-Z0-9_-]+$/.test(check.id), 'Use simple check IDs.');
    assert(!check.id.startsWith('oma-'), 'The oma- check prefix is reserved for controller checks.');
    assert(Array.isArray(check.argv) && check.argv.length > 0 && check.argv.every(x => typeof x === 'string' && x.length > 0), 'Checks require argv arrays.');
    const executable = path.basename(check.argv[0]).replace(/\.exe$/i, '').toLowerCase();
    assert(!/^(?:cmd|powershell|pwsh|[a-z]*sh|wscript|cscript|mshta)$/.test(executable), 'Use a validator script, not a shell.');
    let script;
    if (/^(?:node|python[\d.]*)$/.test(executable)) {
      assert(check.argv.length >= 2 && !check.argv[1].startsWith('-'), 'Use a validator script, not an inline interpreter.');
      script = within(root, check.argv[1]);
      assert(fs.existsSync(path.join(root, script)) && fs.statSync(path.join(root, script)).isFile(), 'Validator script must exist inside the workspace before design is sealed.');
    }
    check.inputs = validatorInputs(root, check, script);
    assert(Array.isArray(check.files) && check.files.length > 0 && check.files.every(file => plan.files.includes(file)), 'Each check must name scoped files.');
    assert(Array.isArray(check.criteria) && check.criteria.length > 0 && check.criteria.every(x => plan.criteria.includes(x)), 'Each check must cover acceptance criteria.');
    assert(check.expectation === undefined || typeof check.expectation === 'string' && check.expectation.trim() && check.expectation.length <= 1200, 'Check expectation must be bounded text.');
  }
  for (const file of plan.files) assert(plan.checks.some(check => check.files.includes(file)), `No check covers ${file}.`);
  for (const criterion of plan.criteria) assert(plan.checks.some(check => check.criteria.includes(criterion)), `No check covers ${criterion}.`);
  assert(Array.isArray(plan.testFiles || []) && (plan.testFiles || []).every(file => plan.files.includes(file)), 'testFiles must be explicitly scoped.');
  assert(Array.isArray(plan.rewriteFiles || []) && (plan.rewriteFiles || []).every(file => plan.files.includes(file)), 'rewriteFiles must be explicitly scoped.');
  plan.readOnly = readOnlyPaths(root, plan);
  plan.repairGroups = repairGroups(plan);
  const rules = ['tautological-assert', 'swallowed-exception', 'synthetic-fallback', 'cleanup-scope-mutation', 'runtime-monkeypatch'];
  assert(Array.isArray(plan.astExemptions || []) && (plan.astExemptions || []).length <= 20, 'Declare at most 20 exact AST exemptions.');
  for (const exemption of plan.astExemptions || []) {
    assert(plan.files.includes(exemption.file) && exemption.file.endsWith('.py') && Number.isInteger(exemption.line) && exemption.line > 0 && rules.includes(exemption.rule), 'AST exemptions need a scoped Python file, exact line, and known rule.');
    assert(plan.criteria.includes(exemption.criterion) && typeof exemption.reason === 'string' && exemption.reason.trim().length >= 12 && exemption.reason.length <= 1200, 'AST exemptions need a criterion and concrete design justification.');
  }
  assert(plan.pythonExecutable === undefined || typeof plan.pythonExecutable === 'string' && plan.pythonExecutable.trim() && plan.pythonExecutable.length <= 512 && !/[\r\n\x00]/.test(plan.pythonExecutable), 'Invalid Python executable.');
  return plan;
}

export function control(root, conversation, action, draftName) {
  return withStateLock(root, () => controlUnlocked(root, conversation, action, draftName));
}

function controlUnlocked(root, conversation, action, draftName) {
  let state = readState(root);
  let result;
  if (['status', 'context'].includes(action)) return contextPack(state);
  if (action === 'resume') return resumeView(root, state);
  if (action === 'evidence') return evidenceWindow(root, state, loadDraft(root, draftName));
  if (action === 'repair-context') {
    assert(state?.phase === 'repair', 'There is no active repair batch.');
    const request = draftName ? loadDraft(root, draftName) : {};
    const offset = request.offset ?? 0, limit = request.limit ?? 1;
    assert(Number.isSafeInteger(offset) && offset >= 0 && Number.isInteger(limit) && limit >= 1 && limit <= 2, 'Repair diagnostics use a nonnegative check offset and limit 1..2.');
    assert(request.group === undefined || state.batch.some(issue => issue.id === request.group), 'Inspect only a currently active repair group.');
    const batch = request.group ? state.batch.filter(issue => issue.id === request.group) : state.batch;
    const view = { phase: state.phase, focus: state.repairFocus || 'normal', sources: state.handoff.sources.slice(0, 5), omittedSources: Math.max(0, state.handoff.sources.length - 5),
      batch: batch.map(issue => ({ id: issue.id, reason: issue.reason.slice(0, 600), reasonTruncated: issue.reason.length > 600,
      files: issue.files.slice(0, 3), omittedFiles: Math.max(0, issue.files.length - 3),
      ...(issue.section ? { review: { verdict: state.reviews[issue.section].verdict,
        findings: state.reviews[issue.section].findings.slice(offset, offset + limit),
        nextFindingOffset: offset + limit < state.reviews[issue.section].findings.length ? offset + limit : null } } : {}),
      checkCount: issue.checks?.length || 0, nextCheckOffset: offset + limit < (issue.checks?.length || 0) ? offset + limit : null,
      diagnostics: (issue.checks || []).slice(offset, offset + limit).map(id => {
        const check = state.checks.find(item => item.id === id);
        return { check: id, expected: check.expectation || check.criteria.join('; '), exitCode: check.exitCode,
          observed: evidenceWindow(root, state, { check: id, limit: 512 }) };
      }) })) };
    assert(Buffer.byteLength(JSON.stringify(view)) <= 30000, 'Repair context too large; request one active group at a time.');
    return view;
  }
  if (action === 'init') {
    assert(!state || state.phase === 'complete', 'An active or blocked workflow already exists.');
    assert(conversation, 'Conversation ownership is required.');
    state = { schema: 1, guardVersion: 2, owner: conversation, phase: 'research', cycle: 0, nudges: 0, locks: state?.locks || {}, issues: [], batch: [], reviews: {} };
  } else {
    owner(state, conversation);
    checkLocks(root, state);
    if (action === 'block') {
      const request = loadDraft(root, draftName);
      assert(typeof request.reason === 'string' && request.reason.trim() && request.reason.length <= 1200, 'State the actual bounded blocker.');
      const code = request.code || 'UNSPECIFIED';
      assert(['UNSPECIFIED', 'DEPENDENCY_DEFECT', 'EXTERNAL_ISSUE', 'RULE_CONFLICT', 'MISSING_CAPABILITY'].includes(code), 'Use a known failure code.');
      const checks = request.checks || [];
      assert(request.dependency === undefined || typeof request.dependency === 'string' && request.dependency.trim() && request.dependency.length <= 512, 'Dependency must be bounded text.');
      assert(Array.isArray(checks) && checks.length <= 10 && checks.every(id => state.checks?.some(check => check.id === id && check.status === 'fail')), 'Failure evidence must reference actual failed checks.');
      assert(code !== 'DEPENDENCY_DEFECT' || checks.length > 0 && typeof request.dependency === 'string' && request.dependency.trim() && request.dependency.length <= 512, 'DEPENDENCY_DEFECT requires the dependency and a real failed check.');
      state.phase = 'blocked';
      state.blocker = request.reason;
      state.failure = { status: 'failed', code, reason: request.reason, checks, ...(request.dependency ? { dependency: request.dependency } : {}) };
    } else if (action === 'sources') {
      assert(state.phase === 'research', 'Source registration is only accepted during research.');
      state.reading = registerSources(root, loadDraft(root, draftName));
    } else if (action === 'probe') {
      assert(state.phase === 'research', 'Introspection probes are only accepted during research.');
      result = runProbe(root, state, loadDraft(root, draftName));
    } else if (action === 'read') {
      assert(state.phase === 'research', 'Source reading is only accepted during research.');
      result = readSource(root, state, loadDraft(root, draftName));
    } else if (action === 'handoff') {
      assert(state.phase === 'research', 'Handoff is only accepted in research.');
      const handoff = loadDraft(root, draftName);
      assert(handoff.agent === 'oma-doc-reader' && typeof handoff.summary === 'string' && handoff.summary.trim(), 'A doc-reader summary is required.');
      assert(Array.isArray(handoff.sources) && handoff.sources.length > 0 && handoff.sources.every(source => typeof source === 'string' && source.trim()), 'Document sources are required.');
      assert(Array.isArray(handoff.unknowns), 'State unknowns explicitly.');
      assert(handoff.summary.length <= 6000 && handoff.sources.length <= 50 && handoff.unknowns.length <= 20, 'Documentation handoff is too large; summarize before design.');
      requireReading(root, state, handoff.sources);
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
      requireReading(root, state, state.handoff.sources);
      requireSettled(state.brief, state.plan);
      assert(state.plan.files.every(file => !state.locks[file]), 'Reopening locked code requires operator recovery.');
      state.care = careFor(state.brief, state.plan);
      state.planHash = fingerprint({ brief: state.brief, plan: state.plan, care: state.care });
      state.planBasis = Object.fromEntries(state.plan.files.map(file => [file, digest(root, file)]));
      state.validatorBasis = inputHashes(root, state.plan.checks);
      state.boundaryBasis = boundaryHashes(root, state.plan.readOnly);
      state.receiptMode = 'native';
      state.tickets = {};
      delete state.planReview;
      state.designSealed = true;
    } else if (action === 'start') {
      assert(state.phase === 'ready', 'Implementation starts only after the design execution has stopped.');
      assert(!state.planBasis || state.plan.files.every(file => digest(root, file) === state.planBasis[file]), 'Source changed after design; reconcile the plan before starting.');
      assertValidatorBasis(root, state, true);
      assertSourcesCurrent(root, state);
      assertBoundaries(root, state);
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
  return result || state;
}

function verify(root, state) {
  assertValidatorBasis(root, state);
  assertSourcesCurrent(root, state);
  assertBoundaries(root, state);
  const checks = [...state.plan.checks];
  const pythonFiles = state.guardVersion === 2 ? state.plan.files.filter(file => file.endsWith('.py')) : [];
  const pythonGuard = fileURLToPath(new URL('../../scripts/python-guard.py', import.meta.url));
  if (pythonFiles.length) checks.unshift({ id: 'oma-python', argv: [state.plan.pythonExecutable || 'python', pythonGuard, ...pythonFiles],
    inputs: pythonFiles, files: pythonFiles, criteria: state.plan.criteria, expectation: 'Python AST integrity rules or exact design-reviewed exemptions',
    policyHash: fingerprint(state.plan.astExemptions || []), validatorHash: crypto.createHash('sha256').update(fs.readFileSync(pythonGuard)).digest('hex') });
  const inputsBefore = inputHashes(root, checks);
  const before = Object.fromEntries(state.plan.files.map(file => [file, digest(root, file)]));
  state.checks = checks.map(check => {
    // No shell, no agent-supplied result, no success fallback. Validators are trusted project code.
    const run = spawnSync(check.argv[0], check.argv.slice(1), { cwd: root, encoding: 'utf8', timeout: 30000, maxBuffer: 1024 * 1024, shell: false,
      ...(check.id === 'oma-python' ? { input: JSON.stringify({ exemptions: state.plan.astExemptions || [] }) } : {}) });
    const log = `${run.stdout || ''}${run.stderr || ''}${run.error ? `\n${run.error.message}` : ''}`;
    const evidence = `.omg/evidence/${crypto.randomUUID()}.txt`;
    fs.mkdirSync(path.dirname(path.join(root, within(root, evidence))), { recursive: true });
    fs.writeFileSync(path.join(root, evidence), log, { flag: 'wx' });
    const record = { id: check.id, files: check.files, criteria: check.criteria, argv: check.argv, expectation: check.expectation,
      inputHashes: Object.fromEntries((check.inputs || []).map(file => [file, inputsBefore[file]])),
      exitCode: run.status, signal: run.signal, status: run.status === 0 && !run.error ? 'pass' : 'fail', evidence, evidenceHash: digest(root, evidence), at: new Date().toISOString() };
    const receipt = { schema: 1, ...record, sourceHashes: before, ...(check.validatorHash ? { validatorHash: check.validatorHash, policyHash: check.policyHash } : {}) };
    const receiptPath = evidence.replace(/\.txt$/, '.json');
    fs.writeFileSync(path.join(root, receiptPath), `${JSON.stringify(receipt, null, 2)}\n`, { flag: 'wx' });
    return { ...record, receipt: { path: receiptPath, hash: digest(root, receiptPath) } };
  });
  assertEvidenceInputs(root, state.checks);
  assertSourcesCurrent(root, state);
  assertBoundaries(root, state);
  checkLocks(root, state);
  state.hashes = Object.fromEntries(state.plan.files.map(file => [file, digest(root, file)]));
  assert(state.plan.files.every(file => before[file] === state.hashes[file]), 'Validator modified scoped code; evidence rejected.');
  state.sections = [];
  for (const file of state.plan.files) {
    const hash = state.hashes[file];
    assert(hash, `Scoped file is missing: ${file}. Report a blocker for unsupported deletions.`);
    const lines = fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/).length;
    const sectionLines = state.care?.sectionLines || SECTION_LINES;
    const sourceLines = fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/);
    const boundaries = file.endsWith('.md') ? [1, ...sourceLines.flatMap((line, index) => index > 0 && /^##\s+/.test(line) ? [index + 1] : []), lines + 1] : [1, lines + 1];
    for (let index = 0; index < boundaries.length - 1; index++) {
      for (let start = boundaries[index]; start < boundaries[index + 1]; start += sectionLines) {
        state.sections.push({ id: `${file}:${start}`, file, start, end: Math.min(start + sectionLines - 1, boundaries[index + 1] - 1), hash });
      }
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
    assertEvidenceInputs(root, state.checks);
    assertSourcesCurrent(root, state);
    assertBoundaries(root, state);
    const missing = state.sections.filter(section => !state.reviews[section.id]);
    if (missing.length > 0) {
      output.reason = `${missing.length} section review(s) missing: status remains unknown. Resume with /oma-team-verify.`;
    } else {
      assert(state.plan.files.every(file => digest(root, file) === state.hashes[file]), 'Code changed after verification; cannot accept stale evidence.');
      for (const check of state.checks) {
        assert(fs.existsSync(path.join(root, within(root, check.evidence))), 'Verification log is missing; evidence cannot pass.');
        assert(!check.evidenceHash || digest(root, check.evidence) === check.evidenceHash, 'Verification log changed after review; evidence cannot pass.');
      }
      const issues = groupIssues(state);
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
        const batchSize = selectRepairs(state, issues, signature, state.care?.batchSize || MAX_BATCH);
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
