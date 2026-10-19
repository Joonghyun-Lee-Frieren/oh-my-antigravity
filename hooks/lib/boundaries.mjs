import fs from 'node:fs';
import path from 'node:path';
import { assert, within, digest, protectedFile } from './storage.mjs';
import { fingerprint } from './brief.mjs';

export function readOnlyPaths(root, plan) {
  const paths = plan.readOnly ?? [];
  assert(Array.isArray(paths) && paths.length <= 20, 'Declare at most 20 read-only paths.');
  return paths.map(item => {
    const file = within(root, item);
    assert(!protectedFile(file) && !file.startsWith('.omg/') && fs.existsSync(path.join(root, file)), 'Read-only paths must exist outside protected runtime state.');
    assert(!plan.files.some(target => target === file || target.startsWith(file + '/')), 'Implementation scope overlaps a read-only path.');
    return file;
  });
}

export function boundaryHashes(root, paths = []) {
  const hashes = {};
  let count = 0;
  function visit(file) {
    assert(++count <= 2000, 'Read-only snapshot exceeds 2000 entries; narrow the boundary.');
    const normalized = within(root, file);
    const target = path.join(root, normalized);
    assert(!fs.lstatSync(target).isSymbolicLink(), 'Read-only snapshots cannot follow symbolic links or junctions.');
    if (fs.statSync(target).isDirectory()) return fs.readdirSync(target).sort().map(name => [name, visit(`${normalized}/${name}`)]);
    assert(fs.statSync(target).isFile(), 'Unsupported read-only entry.');
    return digest(root, normalized);
  }
  for (const file of paths) hashes[file] = fingerprint(visit(file));
  return hashes;
}

export function assertBoundaries(root, state) {
  if (!state.boundaryBasis) return;
  const current = boundaryHashes(root, state.plan.readOnly);
  assert(fingerprint(current) === fingerprint(state.boundaryBasis), 'Read-only dependency boundary changed; preserve evidence and report DEPENDENCY_DEFECT or operator recovery.');
}
