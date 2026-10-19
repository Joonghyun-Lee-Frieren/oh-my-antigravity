import fs from 'node:fs';
import path from 'node:path';
import { assert, within, protectedFile, digest } from './storage.mjs';

export function validatorInputs(root, check, script) {
  const declared = check.inputs ?? [];
  assert(Array.isArray(declared) && declared.length <= 100 && declared.every(file => typeof file === 'string' && file.length > 0 && Buffer.byteLength(file) <= 512), 'Validator inputs must be at most 100 workspace file paths.');
  const inputs = [...new Set([...declared, ...(script ? [script] : [])].map(file => within(root, file)))];
  assert(inputs.length <= 100, 'Validator inputs, including the script, must fit within 100 files.');
  for (const file of inputs) {
    assert(!protectedFile(file) && !file.startsWith('.omg/'), 'Validator inputs cannot use protected state or runtime paths.');
    assert(fs.existsSync(path.join(root, file)) && fs.statSync(path.join(root, file)).isFile(), `Validator input must be an existing workspace file: ${file}.`);
  }
  return inputs;
}

export function inputHashes(root, checks = []) {
  return Object.fromEntries([...new Set(checks.flatMap(check => check.inputs || []))].map(file => [file, digest(root, file)]));
}

export function assertValidatorBasis(root, state, starting = false) {
  for (const [file, hash] of Object.entries(state.validatorBasis || {})) {
    if (starting || !state.plan.files.includes(file)) {
      assert(digest(root, file) === hash, `Validator input changed since design: ${file}. Reconcile the plan before verification.`);
    }
  }
}

export function assertEvidenceInputs(root, checks = []) {
  for (const check of checks) {
    if (check.receipt) {
      assert(/^\.omg\/evidence\/[a-zA-Z0-9-]+\.json$/.test(check.receipt.path), 'Invalid execution receipt location.');
      assert(digest(root, check.receipt.path) === check.receipt.hash, 'Execution receipt integrity check failed.');
    }
    for (const [file, hash] of Object.entries(check.inputHashes || {})) {
      assert(digest(root, file) === hash, `Validator input changed after verification: ${file}. Evidence is stale.`);
    }
  }
}
