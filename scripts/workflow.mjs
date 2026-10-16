#!/usr/bin/env node
import path from 'node:path';
import { control } from '../hooks/lib/workflow.mjs';
import { contextPack } from '../hooks/lib/continuity.mjs';

// Hook overwrites root/owner from trusted event metadata before this command runs.
const [action, draft, root, conversation] = process.argv.slice(2);
try {
  const state = control(path.resolve(root), conversation, action, draft === '-' ? undefined : draft);
  process.stdout.write(`${JSON.stringify(state.schema === 1 ? contextPack(state) : state, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
