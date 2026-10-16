import crypto from 'node:crypto';
import { assert } from './storage.mjs';

export const CARE = {
  routine: { sectionLines: 120, batchSize: 3, cycles: 6 },
  elevated: { sectionLines: 90, batchSize: 2, cycles: 5 },
  critical: { sectionLines: 60, batchSize: 1, cycles: 4 },
};

export function fingerprint(value) {
  const stable = item => Array.isArray(item) ? item.map(stable)
    : item && typeof item === 'object' ? Object.fromEntries(Object.keys(item).sort().map(key => [key, stable(item[key])])) : item;
  return crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
}

function text(value, label, limit = 1200) {
  assert(typeof value === 'string' && value.trim() && value.length <= limit, `${label} must be a nonempty, bounded string.`);
  return value.trim();
}

export function validateBrief(input) {
  const list = (value, label) => {
    assert(Array.isArray(value) && value.length <= 20, `${label} must be an array of at most 20 items.`);
    return value.map(item => text(item, label));
  };
  const objective = text(input.objective, 'Objective', 600);
  assert(Object.hasOwn(CARE, input.risk), 'Risk is routine, elevated, or critical.');
  assert(Array.isArray(input.decisions) && input.decisions.length <= 20, 'Supply a bounded decisions array.');
  const decisions = input.decisions.map(item => {
    assert(['user', 'agent'].includes(item.owner), 'Decision owner must be user or agent.');
    assert(['open', 'resolved'].includes(item.status), 'Decision status must be open or resolved.');
    const decision = { id: text(item.id, 'Decision ID', 80), question: text(item.question, 'Decision question'), owner: item.owner, status: item.status };
    if (item.status === 'resolved') {
      decision.answer = text(item.answer, 'Decision answer');
      decision.basis = text(item.basis, 'Decision basis');
    }
    return decision;
  });
  assert(new Set(decisions.map(item => item.id)).size === decisions.length, 'Decision IDs must be unique.');
  assert(Array.isArray(input.conflicts) && input.conflicts.length <= 20, 'Supply a bounded source-conflicts array.');
  const conflicts = input.conflicts.map(item => {
    assert(['open', 'resolved'].includes(item.status), 'Conflict status must be open or resolved.');
    const sources = list(item.sources, 'Conflict sources');
    assert(sources.length >= 2, 'A source conflict needs at least two sources.');
    return { topic: text(item.topic, 'Conflict topic'), sources, status: item.status,
      ...(item.status === 'resolved' ? { resolution: text(item.resolution, 'Conflict resolution') } : {}) };
  });
  return { objective, risk: input.risk, constraints: list(input.constraints, 'Constraints'), nonGoals: list(input.nonGoals, 'Non-goals'), decisions, conflicts };
}

export function requireSettled(brief, plan) {
  assert(brief, 'Submit a Scope Brief before sealing a plan.');
  assert(brief.objective === plan.intent, 'Plan intent must match the Scope Brief objective exactly.');
  assert(!brief.decisions.some(item => item.status === 'open'), 'Unresolved decisions must be settled before sealing.');
  assert(!brief.conflicts.some(item => item.status === 'open'), 'Conflicting sources must be resolved explicitly before sealing.');
}

export function careFor(brief, plan) {
  let risk = brief.risk;
  const critical = plan.files.filter(file => /(^|\/)(auth|security|permissions|migrations?)(\/|\.)|^hooks\/|^scripts\/workflow\.mjs$/i.test(file));
  const elevated = plan.files.filter(file => /(^|\/)(config|api|contracts?)(\/|\.)/i.test(file));
  if (critical.length) risk = 'critical';
  else if (elevated.length && risk === 'routine') risk = 'elevated';
  return { risk, ...CARE[risk], reasons: critical.length ? critical : elevated };
}
