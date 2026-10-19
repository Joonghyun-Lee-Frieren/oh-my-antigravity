import { assert } from './storage.mjs';

const id = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value);

export function repairGroups(plan) {
  const groups = plan.repairGroups ?? plan.checks.map(check => ({ id: check.id, checks: [check.id], dependsOn: [] }));
  assert(Array.isArray(groups) && groups.length > 0 && groups.length <= 100, 'Supply 1..100 repair groups.');
  const ids = groups.map(group => group.id);
  assert(ids.every(id) && new Set(ids).size === ids.length, 'Repair group IDs must be unique simple names.');
  const checks = groups.flatMap(group => group.checks || []);
  assert(checks.length === plan.checks.length && new Set(checks).size === checks.length && plan.checks.every(check => checks.includes(check.id)), 'Repair groups must partition every check exactly once.');
  for (const group of groups) {
    assert(Array.isArray(group.checks) && group.checks.length > 0, 'Every repair group needs checks.');
    assert(Array.isArray(group.dependsOn) && new Set(group.dependsOn).size === group.dependsOn.length && group.dependsOn.every(dep => ids.includes(dep) && dep !== group.id), 'Repair dependencies must name other groups.');
  }
  const ordered = [], pending = [...groups];
  while (pending.length) {
    const index = pending.findIndex(group => group.dependsOn.every(dep => ordered.some(item => item.id === dep)));
    assert(index !== -1, 'Repair dependencies contain a cycle.');
    ordered.push(pending.splice(index, 1)[0]);
  }
  return ordered;
}

export function groupIssues(state) {
  const grouped = [];
  for (const check of state.checks.filter(check => !state.plan.checks.some(declared => declared.id === check.id) && check.status !== 'pass')) {
    grouped.push({ id: `group:${check.id}`, checks: [check.id], files: check.files, dependsOn: [], reason: 'Automatic integrity check failed.' });
  }
  const groups = state.plan.repairGroups || state.plan.checks.map(check => ({ id: check.id, checks: [check.id], dependsOn: [] }));
  for (const group of groups) {
    const checks = state.checks.filter(check => group.checks.includes(check.id) && check.status !== 'pass');
    if (checks.length) grouped.push({ id: `group:${group.id}`, checks: checks.map(check => check.id),
      files: [...new Set(checks.flatMap(check => check.files))], dependsOn: group.dependsOn,
      reason: `Failed checks in ${group.id}: ${checks.map(check => check.id).join(', ')}` });
  }
  for (const section of state.sections) {
    const receipt = state.reviews[section.id];
    if (receipt.verdict !== 'pass') grouped.push({ id: `review:${section.id}`, section: section.id, checks: [], files: [section.file], reason: receipt.evidence });
  }
  return grouped;
}

export function selectRepairs(state, issues, signature, maximum) {
  const history = state.failureHistory || [];
  const previous = history.at(-1);
  const oscillating = previous && previous.signature !== signature && history.slice(0, -1).some(item => item.signature === signature);
  if (oscillating) state.repairFocus = 'oscillation';
  else if (previous && issues.length < previous.count) delete state.repairFocus;
  state.failureHistory = [...history, { signature, count: issues.length }].slice(-6);
  const size = state.repairFocus ? 1 : maximum;
  state.batch = issues.slice(0, size);
  return size;
}
