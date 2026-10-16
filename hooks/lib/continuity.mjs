import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { stripVTControlCharacters } from 'node:util';
import { assert, within, digest } from './storage.mjs';

export function nextAction(state) {
  if (!state) return 'init';
  if (state.phase === 'research') return 'handoff';
  if (state.phase === 'design') return !state.brief ? 'brief' : !state.designSealed ? 'plan'
    : state.planReview?.verdict === 'pass' ? 'end-design-turn' : state.planReview?.verdict === 'revise' ? 'revise-plan' : 'design-check';
  if (state.phase === 'review') return (state.sections || []).some(section => !state.reviews?.[section.id]) ? 'review-missing-sections' : 'end-review-execution';
  return ({ ready: 'start-next-user-turn', implement: 'verify', repair: 'repair-current-batch', blocked: 'operator-recovery', complete: 'report-result' })[state.phase];
}

export function contextPack(state) {
  if (!state) return { phase: 'uninitialized', next: 'init' };
  const pending = (state.sections || []).filter(item => !state.reviews?.[item.id]);
  const care = state.care ? { ...state.care, reasons: state.care.reasons.slice(0, 3), omittedReasons: Math.max(0, state.care.reasons.length - 3) } : null;
  const pack = { phase: state.phase, revision: state.revision || 0, owner: state.owner,
    intent: (state.brief?.objective || state.plan?.intent || '').slice(0, 600),
    care, planHash: state.planHash || null, designVerdict: state.planReview?.verdict || 'unknown',
    scope: (state.plan?.files || []).slice(0, 6),
    constraints: (state.brief?.constraints || []).slice(0, 5).map(item => item.slice(0, 180)),
    openDecisions: (state.brief?.decisions || []).filter(item => item.status === 'open').map(item => ({ id: item.id, owner: item.owner })).slice(0, 5),
    checks: (state.checks || []).slice(0, 8).map(item => ({ id: item.id, status: item.status, evidence: item.evidence })),
    checkCount: state.checks?.length || 0, pendingReviewCount: pending.length,
    nextSections: pending.slice(0, 3).map(({ id, file, start, end, hash }) => ({ id, file, start, end, hash })),
    lockedFileCount: Object.keys(state.locks || {}).length,
    batch: (state.batch || []).slice(0, 3).map(item => ({ id: item.id, files: item.files.slice(0, 2), omittedFiles: Math.max(0, item.files.length - 2) })),
    issueCount: state.issues?.length || 0, checkpoint: state.checkpoint || null,
    blocker: state.blocker?.slice(0, 600), next: nextAction(state),
    omitted: { files: Math.max(0, (state.plan?.files.length || 0) - 6), checks: Math.max(0, (state.checks?.length || 0) - 8), constraints: Math.max(0, (state.brief?.constraints.length || 0) - 5) } };
  if (Buffer.byteLength(JSON.stringify(pack)) > 16000) {
    pack.scope = []; pack.nextSections = []; pack.constraints = []; pack.batch = [];
    if (pack.care) pack.care.reasons = [];
    pack.omitted.largeIdentifiers = true;
  }
  return pack;
}

export function evidenceWindow(root, state, request) {
  const check = state?.checks?.find(check => check.id === request.check);
  assert(check, 'Unknown check evidence.');
  assert(/^\.omg\/evidence\/[a-zA-Z0-9-]+\.txt$/.test(check.evidence), 'Invalid evidence location.');
  const offset = request.offset ?? 0;
  const limit = request.limit ?? 4096;
  assert(Number.isSafeInteger(offset) && offset >= 0, 'Evidence offset must be a nonnegative byte offset.');
  assert(Number.isInteger(limit) && limit >= 4 && limit <= 8192, 'Evidence window is 4..8192 bytes.');
  const file = path.join(root, within(root, check.evidence));
  const bytes = fs.readFileSync(file);
  const hash = crypto.createHash('sha256').update(bytes).digest('hex');
  assert(!check.evidenceHash || check.evidenceHash === hash, 'Evidence integrity check failed.');
  assert(offset <= bytes.length, 'Evidence offset exceeds the log size.');
  assert(offset === bytes.length || (bytes[offset] & 0xc0) !== 0x80, 'Evidence offset must start on a UTF-8 boundary.');
  let end = Math.min(offset + limit, bytes.length);
  while (end < bytes.length && end > offset && (bytes[end] & 0xc0) === 0x80) end -= 1;
  return { check: check.id, path: check.evidence, hash, integrity: check.evidenceHash ? 'verified' : 'legacy-unrecorded',
    totalBytes: bytes.length, offset, end, nextOffset: end < bytes.length ? end : null,
    truncated: end < bytes.length, text: stripVTControlCharacters(bytes.subarray(offset, end).toString('utf8')) };
}

export function captureTrail(root, state, reason) {
  const id = crypto.randomUUID();
  const record = { schema: 1, id, owner: state.owner, workspace: fs.realpathSync(root), phase: state.phase,
    revision: (state.revision || 0) + 1, reason, at: new Date().toISOString(), planHash: state.planHash || null,
    sourceHashes: Object.fromEntries((state.plan?.files || []).map(file => [file, digest(root, file)])), pack: contextPack(state) };
  delete record.pack.checkpoint;
  const relative = `.omg/state/checkpoints/${id}.json`;
  const target = path.join(root, within(root, relative));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const bytes = Buffer.from(`${JSON.stringify(record, null, 2)}\n`);
  fs.writeFileSync(target, bytes, { flag: 'wx' });
  const note = `# Session Trail\n\n- Phase: ${record.phase}\n- Revision: ${record.revision}\n- Reason: ${reason}\n- Intent: ${record.pack.intent}\n- Next: ${record.pack.next}\n- Checks: ${record.pack.checkCount}\n- Pending reviews: ${record.pack.pendingReviewCount}\n- Locked files: ${record.pack.lockedFileCount}\n\nJSON record: ${id}.json\n`;
  fs.writeFileSync(target.replace(/\.json$/, '.md'), note, { flag: 'wx' });
  state.checkpoint = { id, path: relative, hash: crypto.createHash('sha256').update(bytes).digest('hex'), revision: record.revision, reason };
}

export function resumeView(root, state) {
  const pack = contextPack(state);
  if (!state?.checkpoint) return { ...pack, continuity: 'missing-checkpoint', ready: false };
  const reference = state.checkpoint;
  assert(reference.path === `.omg/state/checkpoints/${reference.id}.json`, 'Invalid checkpoint reference.');
  const file = path.join(root, within(root, reference.path));
  const bytes = fs.readFileSync(file);
  assert(crypto.createHash('sha256').update(bytes).digest('hex') === reference.hash, 'Checkpoint integrity check failed.');
  const snapshot = JSON.parse(bytes.toString('utf8'));
  assert(snapshot.schema === 1 && snapshot.id === reference.id && snapshot.owner === state.owner, 'Checkpoint identity mismatch.');
  assert(snapshot.workspace === fs.realpathSync(root), 'Checkpoint belongs to a different workspace.');
  const changedFiles = Object.entries(snapshot.sourceHashes).filter(([file, hash]) => digest(root, file) !== hash).map(([file]) => file);
  const samePlan = snapshot.planHash === (state.planHash || null);
  return { ...pack, continuity: !samePlan ? 'plan-changed' : changedFiles.length ? 'source-changed' : snapshot.revision === state.revision ? 'current' : 'state-advanced',
    changedFiles: changedFiles.slice(0, 12), changedFileCount: changedFiles.length,
    ready: samePlan && changedFiles.length === 0 && state.phase !== 'blocked',
    note: 'This read does not restore state, transfer ownership, start work, or clear locks.' };
}
