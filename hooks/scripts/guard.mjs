#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assert, within, protectedFile, readState, checkLocks, owner } from '../lib/storage.mjs';
import { stop } from '../lib/workflow.mjs';
import { issueReview, captureReceipt } from '../lib/reviews.mjs';
import { contextPack } from '../lib/continuity.mjs';

export const CONTROLLER = fileURLToPath(new URL('../../scripts/workflow.mjs', import.meta.url));
const READ_TOOLS = new Set(['view_file', 'list_dir', 'find_by_name', 'grep_search', 'search_web', 'read_url_content', 'list_permissions', 'ask_question', 'ask_permission']);
const WRITE_TOOLS = new Set(['write_to_file', 'replace_file_content', 'multi_replace_file_content']);
const AGENTS = new Set(['oma-design-auditor', 'oma-doc-reader', 'oma-researcher', 'oma-planner', 'oma-architect', 'oma-executor', 'oma-reviewer', 'oma-verifier', 'oma-debugger', 'oma-director', 'oma-quick', 'oma-product', 'oma-consultant', 'oma-editor', 'oma-interview', 'oma-consensus']);

function quote(value) {
  assert(typeof value === 'string' && !/["$`%!\r\n]/.test(value), 'Unsupported characters in command metadata.');
  return `"${value}"`;
}

function commandRequest(command) {
  // Deliberately not a shell parser. Accept one exact controller invocation only.
  const match = /^node\s+(?:"([^"\r\n]+)"|([^\s"']+))\s+(init|status|context|sources|read|probe|brief|handoff|plan|start|verify|review|block|evidence|checkpoint|resume|repair-context)(?:\s+(\.omg\/drafts\/[a-zA-Z0-9_./-]+\.json))?\s*$/.exec(command || '');
  if (!match || path.resolve(match[1] || match[2]) !== path.resolve(CONTROLLER)) return null;
  return { action: match[3], draft: match[4] || '-' };
}

export function pre(root, input) {
  const state = readState(root);
  checkLocks(root, state);
  const tool = input.toolCall;
  assert(tool && typeof tool.name === 'string' && tool.args && typeof tool.args === 'object', 'Malformed tool call.');
  const args = tool.args;
  if (READ_TOOLS.has(tool.name)) {
    const readPath = tool.name === 'view_file' ? args.AbsolutePath : tool.name === 'grep_search' ? args.SearchPath : null;
    if (typeof readPath === 'string') {
      const absolute = path.resolve(root, readPath);
      const local = path.relative(root, absolute);
      const file = local && !local.startsWith('..') && !path.isAbsolute(local) ? within(root, absolute) : null;
      if (file?.startsWith('.omg/evidence/')) {
        throw new Error('Use controller evidence or the issued review packet for a bounded, integrity-checked Evidence Window.');
      }
    }
    return { decision: 'allow' };
  }
  if (tool.name === 'manage_task' && ['list', 'status', 'kill'].includes(args.Action)) return { decision: 'allow' };
  if (tool.name === 'manage_subagents' && ['list', 'kill', 'kill_all'].includes(args.Action)) return { decision: 'allow' };
  if (tool.name === 'send_message') {
    assert(input.conversationId !== state?.owner, 'The parent cannot steer independent reviewers; issue a new bounded handoff instead.');
    let message;
    try { message = JSON.parse(args.Message); } catch { /* A malformed message has no review authority. */ }
    assert(message?.omaReceipt, 'Reviewer messages must contain an issued native receipt.');
    captureReceipt(root, input.conversationId, args.Recipient, message.omaReceipt);
    return { decision: 'allow' };
  }
  if (tool.name === 'invoke_subagent') {
    assert(Array.isArray(args.Subagents) && args.Subagents.length > 0 && args.Subagents.every(agent => AGENTS.has(agent.TypeName)), 'Only shipped capability-limited OmA agents may be invoked.');
    assert(args.Subagents.every(agent => !agent.Workspace || ['inherit', 'share'].includes(agent.Workspace)), 'Guarded agents must use this workspace; use a separate workflow for another worktree.');
    const subagents = args.Subagents.map(agent => {
      if (!['oma-reviewer', 'oma-design-auditor'].includes(agent.TypeName)) return agent;
      const packet = issueReview(root, input.conversationId, agent.TypeName === 'oma-reviewer' ? 'section' : 'design', agent.Prompt);
      return { TypeName: agent.TypeName, Workspace: 'share', Role: 'Make an independent evidence-based judgment of only this packet. Submit your own receipt through send_message.', Prompt: JSON.stringify(packet) };
    });
    return { decision: 'allow', overwrite: { Subagents: subagents } };
  }
  if (tool.name === 'run_command') {
    const request = commandRequest(args.CommandLine);
    assert(request, 'Shell execution is restricted to the OmA workflow controller. Use native read tools, scoped edit tools, and sealed verification commands.');
    assert(input.conversationId, 'Missing conversation identity.');
    if (state && !['status', 'context', 'resume', 'evidence', 'repair-context'].includes(request.action)) owner(state, input.conversationId);
    if (!state) assert(['init', 'status', 'context', 'resume'].includes(request.action), 'Initialize the workflow first.');
    const command = [process.execPath, CONTROLLER, request.action, request.draft, root, input.conversationId].map(quote).join(' ');
    return { decision: 'allow', overwrite: { CommandLine: command, Cwd: root, WaitMsBeforeAsync: 1000, RunPersistent: false } };
  }
  if (WRITE_TOOLS.has(tool.name)) {
    owner(state, input.conversationId);
    const file = within(root, args.TargetFile);
    const absolute = path.resolve(root, file);
    const plugin = path.resolve(fileURLToPath(new URL('../../', import.meta.url)));
    assert(!(absolute === plugin || absolute.startsWith(plugin + path.sep)), 'Installed plugin assets cannot be edited by the guarded agent.');
    assert(!protectedFile(file), 'Guard state, evidence, runtime configuration, and Git internals are controller/operator-owned.');
    assert(!state.reading?.[file], 'Registered research sources are immutable; create a new versioned snapshot and reconcile the workflow.');
    if (file.startsWith('.omg/drafts/')) return { decision: 'allow' };
    assert(!file.startsWith('.omg/'), 'Use .omg/drafts/ for handoff artifacts.');
    assert(['implement', 'repair'].includes(state.phase), `Code edits are unavailable during ${state.phase}. Finish design and end that turn first.`);
    assert(state.plan.files.includes(file), 'File is outside the sealed implementation scope.');
    assert(!state.locks[file], 'Passed code is locked; operator must explicitly reopen it.');
    if (fs.existsSync(absolute)) {
      const original = fs.readFileSync(absolute, 'utf8');
      if (original.split(/\r?\n/).length > 400 && !(state.plan.rewriteFiles || []).includes(file)) {
        assert(tool.name !== 'write_to_file', 'Bulk overwrite of an existing file over 400 lines requires a sealed rewriteFiles declaration; use targeted edits.');
        const targets = tool.name === 'replace_file_content' ? [args.TargetContent] : args.ReplacementChunks?.map(chunk => chunk.TargetContent);
        assert(targets?.length && targets.every(target => typeof target === 'string' && target.length > 0 && original.includes(target))
          && targets.reduce((sum, target) => sum + target.split(/\r?\n/).length, 0) <= 200, 'Large-file edits require exact existing target chunks covering at most 200 lines per call.');
      }
    }
    if (state.phase === 'repair') assert(state.batch.some(issue => issue.files.includes(file)), 'File is outside the current three-issue repair batch.');
    const isTest = /(^|\/)(__tests__|tests?|fixtures?)(\/|\.)|\.(test|spec)\.[^/]+$/i.test(file);
    if (isTest) assert((state.plan.testFiles || []).includes(file), 'Tests and fixtures need an explicit testFiles declaration in the sealed plan.');
    const added = tool.name === 'write_to_file' ? args.CodeContent
      : tool.name === 'replace_file_content' ? args.ReplacementContent
        : args.ReplacementChunks?.map(chunk => chunk.ReplacementContent).join('\n');
    assert(typeof added === 'string', 'Missing edit content.');
    assert(!/\b(?:test|it|describe)\s*\.\s*(?:skip|only|todo)\s*\(|\b(?:xit|xdescribe)\s*\(/.test(added), 'Do not disable or narrow validation to manufacture a pass.');
    assert(!/\bprocess\s*\.\s*exit\s*\(\s*0\s*\)/.test(added), 'Do not short-circuit execution with a success exit.');
    return { decision: 'allow' };
  }
  throw new Error(`Tool ${tool.name} is outside the guarded tool surface; report the missing capability honestly.`);
}

export function handle(event, input) {
  assert(Array.isArray(input.workspacePaths) && input.workspacePaths.length === 1, 'Guard requires exactly one workspace; isolate each lane.');
  const root = fs.realpathSync(input.workspacePaths[0]);
  if (event === 'pre') return pre(root, input);
  if (event === 'stop') return stop(root, input);
  if (event === 'context') {
    const state = readState(root);
    const message = `OmA: ${JSON.stringify(contextPack(state))}\nController: node "${CONTROLLER}" <action> [ .omg/drafts/request.json ]. Use Scope Brief and Design Check before ending design; implement in the next user turn. Reviewers send their own native receipts. Never invent success. Read docs/guide/guarded-workflow.md for the protocol. Select runtime models through the CLI.`;
    return { injectSteps: [{ ephemeralMessage: message }] };
  }
  throw new Error('Unknown hook event.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const event = process.argv[2];
  let raw = '';
  try {
    for await (const chunk of process.stdin) raw += chunk;
    const input = JSON.parse(raw);
    process.stdout.write(JSON.stringify(handle(event, input)));
  } catch (error) {
    // Safety hooks fail closed. Stop errors do not cause unbounded continuations.
    const output = event === 'context'
      ? { injectSteps: [{ ephemeralMessage: `OmA guard error: ${error.message}. Stop and report this blocker.` }] }
      : { decision: event === 'stop' ? 'allow' : 'deny', reason: `OmA guard error: ${error.message}` };
    process.stdout.write(JSON.stringify(output));
    process.stderr.write(`OmA guard: ${error.message}\n`);
  }
}
