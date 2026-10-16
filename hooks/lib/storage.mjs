import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const STATE = '.omg/state/guard.json';

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
  state.revision = (state.revision || 0) + 1;
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

export function withStateLock(root, operation) {
  const lock = path.join(root, within(root, '.omg/state/guard.lock'));
  fs.mkdirSync(path.dirname(lock), { recursive: true });
  // Atomic mkdir provides mutual exclusion across hook/controller processes.
  fs.mkdirSync(lock);
  try { return operation(); }
  finally { fs.rmdirSync(lock); }
}
