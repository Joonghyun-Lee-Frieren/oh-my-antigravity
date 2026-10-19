import { assert } from './storage.mjs';

// OmA's narrow policy, not a claim to reproduce unpublished source exemptions.
export const EXEMPTIONS = ['style', 'wording', 'naming', 'equivalent-implementation', 'scope-expansion'];

export function judgeSection(state, receipt) {
  if (state.guardVersion !== 2) return receipt;
  const assessments = receipt.assessments;
  assert(Array.isArray(assessments) && assessments.length === state.plan.criteria.length, 'Supply one disconfirmation assessment per criterion.');
  assert(new Set(assessments.map(item => item.criterion)).size === assessments.length, 'Assessment criteria must be unique.');
  for (const item of assessments) {
    assert(state.plan.criteria.includes(item.criterion) && ['supported', 'violated', 'unknown', 'not-applicable'].includes(item.status), 'Assessment must cite a sealed criterion and a valid status.');
    assert(typeof item.evidence === 'string' && item.evidence.trim().length >= 12 && item.evidence.length <= 1200, 'Assessment needs concrete bounded evidence.');
    assert(typeof item.probe === 'string' && item.probe.trim().length >= 12 && item.probe.length <= 600, 'Describe the counterexample or failure path checked.');
  }
  const material = [], vetoed = [];
  for (const finding of receipt.findings) {
    if (finding.criterion == null && EXEMPTIONS.includes(finding.category)) { vetoed.push(finding); continue; }
    assert(state.plan.criteria.includes(finding.criterion), 'Material findings must cite a sealed criterion; do not expand scope.');
    assert(typeof finding.expected === 'string' && finding.expected.trim() && finding.expected.length <= 1200
      && typeof finding.observed === 'string' && finding.observed.trim() && finding.observed.length <= 1200, 'Findings need expected and observed behavior.');
    material.push(finding);
  }
  const unsupportedViolation = assessments.some(item => item.status === 'violated' && !material.some(finding => finding.criterion === item.criterion));
  const verdict = material.length ? 'fail' : receipt.verdict === 'unknown' || unsupportedViolation || assessments.some(item => item.status === 'unknown') ? 'unknown' : 'pass';
  return { ...receipt, workerVerdict: receipt.verdict, verdict, findings: material, vetoedFindings: vetoed };
}
