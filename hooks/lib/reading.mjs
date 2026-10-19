import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { TextDecoder } from 'node:util';
import { assert, within, protectedFile, digest } from './storage.mjs';

function source(root, file) {
  const bytes = fs.readFileSync(path.join(root, within(root, file)));
  assert(bytes.length <= 4 * 1024 * 1024, 'Split source files larger than 4 MiB.');
  new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  return { bytes, hash: crypto.createHash('sha256').update(bytes).digest('hex') };
}

export function registerSources(root, request) {
  assert(Array.isArray(request.files) && request.files.length > 0 && request.files.length <= 50, 'Register 1..50 source files.');
  const files = request.files.map(file => within(root, file));
  assert(files.every(file => Buffer.byteLength(file) <= 512), 'Source paths must fit within 512 bytes.');
  assert(new Set(files).size === files.length, 'Source files must be unique.');
  return Object.fromEntries(files.map(file => {
    assert(!protectedFile(file), 'Protected runtime files cannot be research sources.');
    const { bytes, hash } = source(root, file);
    return [file, { hash, bytes: bytes.length, ranges: [], complete: false }];
  }));
}

export function readSource(root, state, request) {
  const file = within(root, request.file);
  const record = state.reading?.[file];
  assert(record, 'Register this source before reading it.');
  const { bytes, hash } = source(root, file);
  assert(hash === record.hash, 'Research source changed; register and read the sources again.');
  const offset = request.offset ?? 0;
  const limit = request.limit ?? 4096;
  assert(Number.isSafeInteger(offset) && offset >= 0 && offset <= bytes.length, 'Invalid source byte offset.');
  assert(Number.isInteger(limit) && limit >= 4 && limit <= 8192, 'Source window is 4..8192 bytes.');
  assert(offset === bytes.length || (bytes[offset] & 0xc0) !== 0x80, 'Source cursor must start on a UTF-8 boundary.');
  let end = Math.min(offset + limit, bytes.length);
  while (end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--;
  const ranges = [...record.ranges, [offset, end]].sort((a, b) => a[0] - b[0]);
  record.ranges = [];
  for (const range of ranges) {
    const last = record.ranges.at(-1);
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else record.ranges.push([...range]);
  }
  assert(record.ranges.length <= 2048, 'Too many disjoint read windows; use larger contiguous pages.');
  record.complete = record.ranges.length === 1 && record.ranges[0][0] === 0 && record.ranges[0][1] === bytes.length;
  return { file, hash, offset, end, totalBytes: bytes.length, nextOffset: end < bytes.length ? end : null,
    startLine: bytes.subarray(0, offset).toString('utf8').split('\n').length,
    complete: record.complete, text: bytes.subarray(offset, end).toString('utf8') };
}

export function requireReading(root, state, sources) {
  if (state.guardVersion !== 2) return;
  assert(state.reading && Array.isArray(sources), 'Register and read all research sources before handoff.');
  const files = Object.keys(state.reading);
  assert(files.length === sources.length && files.every(file => sources.includes(file)), 'Handoff must name every registered source exactly.');
  assert(files.every(file => state.reading[file].complete), 'Source coverage is incomplete; read every byte window before handoff.');
  assert(!(state.probes || []).some(probe => probe.required && probe.status !== 'pass'), 'A required research probe failed; report the external issue instead of guessing.');
  assertSourcesCurrent(root, state);
}

export function assertSourcesCurrent(root, state) {
  for (const [file, record] of Object.entries(state.reading || {})) {
    assert(digest(root, file) === record.hash, `Research source changed: ${file}. Reconcile the documented requirements.`);
  }
  for (const probe of state.probes || []) {
    assert(digest(root, probe.evidence) === probe.evidenceHash && digest(root, probe.receipt.path) === probe.receipt.hash, 'Research probe evidence integrity check failed.');
  }
}
