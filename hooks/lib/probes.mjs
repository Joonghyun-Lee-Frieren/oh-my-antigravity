import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { stripVTControlCharacters } from 'node:util';
import { assert, within, digest } from './storage.mjs';

export function runProbe(root, state, request) {
  const argv = request.argv;
  assert(Array.isArray(argv) && argv.length >= 2 && argv.every(item => typeof item === 'string'), 'Probe requires an argv array.');
  const version = argv.length === 2 && ['node', 'python', 'agy'].includes(argv[0]) && argv[1] === '--version';
  const help = argv[0] === 'agy' && argv.at(-1) === '--help' && argv.length <= 5 && argv.slice(1, -1).every(item => /^[a-z][a-z0-9-]{0,40}$/.test(item));
  assert(version || help, 'Research probes allow only node/python/agy --version and agy [topics] --help.');
  assert(request.required === undefined || typeof request.required === 'boolean', 'Probe required must be boolean.');
  assert((state.probes || []).length < 20, 'At most 20 research probes per workflow.');
  const run = spawnSync(argv[0] === 'node' ? process.execPath : argv[0], argv.slice(1), { cwd: root, encoding: 'utf8', shell: false, timeout: 10000, maxBuffer: 1024 * 1024 });
  const log = `${run.stdout || ''}${run.stderr || ''}${run.error ? `\n${run.error.message}` : ''}`;
  const id = crypto.randomUUID();
  const evidence = `.omg/evidence/${id}.txt`;
  fs.mkdirSync(path.join(root, within(root, '.omg/evidence')), { recursive: true });
  fs.writeFileSync(path.join(root, evidence), log, { flag: 'wx' });
  const record = { id, argv, required: request.required === true, status: run.status === 0 && !run.error ? 'pass' : 'fail',
    exitCode: run.status, signal: run.signal, evidence, evidenceHash: digest(root, evidence), at: new Date().toISOString() };
  const receiptPath = evidence.replace(/\.txt$/, '.json');
  fs.writeFileSync(path.join(root, receiptPath), `${JSON.stringify(record, null, 2)}\n`, { flag: 'wx' });
  record.receipt = { path: receiptPath, hash: digest(root, receiptPath) };
  state.probes = [...(state.probes || []), record];
  const bytes = Buffer.from(log);
  let end = Math.min(8192, bytes.length);
  while (end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--;
  return { ...record, text: stripVTControlCharacters(bytes.subarray(0, end).toString('utf8')), truncated: end < bytes.length };
}
