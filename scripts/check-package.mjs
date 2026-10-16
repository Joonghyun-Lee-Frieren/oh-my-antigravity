import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const json = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const plugin = json('plugin.json');
assert.deepEqual(Object.keys(plugin).sort(), ['$schema', 'description', 'name']);
assert.equal(plugin.name, 'oh-my-antigravity');
assert.ok(!fs.existsSync(path.join(root, 'commands')), 'Legacy commands must not be discovered alongside native skills.');
const hooks = json('hooks.json');
assert.deepEqual(Object.keys(hooks), ['oma-workflow']);
assert.deepEqual(Object.keys(hooks['oma-workflow']), ['PreToolUse', 'PreInvocation', 'Stop']);
for (const event of Object.values(hooks['oma-workflow'])) {
  const handler = event[0].hooks?.[0] || event[0];
  assert.equal(handler.timeout, 10);
  const script = /node \.\/(\S+) (?:pre|context|stop)$/.exec(handler.command)?.[1];
  assert.ok(script && fs.existsSync(path.join(root, script)), 'Hook script must ship in package.');
}
const allowed = new Set(['view_file', 'list_dir', 'find_by_name', 'grep_search', 'search_web', 'read_url_content']);
const agents = fs.readdirSync(path.join(root, 'agents')).filter(name => name.endsWith('.md'));
for (const file of agents) {
  const source = fs.readFileSync(path.join(root, 'agents', file), 'utf8');
  const front = /^---\n([\s\S]*?)\n---/.exec(source.replace(/\r\n/g, '\n'))?.[1];
  assert.ok(front, `${file}: YAML frontmatter required`);
  const tools = /^tools: \[([^\]]+)\]$/m.exec(front)?.[1].split(',').map(x => x.trim());
  const receiptAgent = ['reviewer.md', 'design-auditor.md'].includes(file);
  assert.ok(tools?.length && tools.every(tool => allowed.has(tool) || (receiptAgent && tool === 'send_message')), `${file}: worker must have read-only capabilities`);
  if (receiptAgent) assert.ok(tools.includes('send_message'), `${file}: independent receipt tool required`);
  assert.match(front, /^commandExecutionPolicy: off$/m);
  assert.match(front, /^mainAgent: false$/m);
  assert.match(front, /^model: inherit$/m);
}
console.log(`Native package and ${agents.length} read-only agent definitions passed.`);
