import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { object } from "./model-policy.mjs";

export const hash = (v) => crypto.createHash("sha256").update(String(v)).digest("hex").slice(0, 24);
export const on = (v) => /^(1|true|yes|on|trace)$/i.test(String(v ?? ""));
export const off = (v) => /^(0|false|no|off)$/i.test(String(v ?? ""));
export const disabled = (name) => (process.env.OMG_DISABLED_HOOKS ?? "").toLowerCase().split(",").map((v) => v.trim()).includes(name);
export async function readInput(stream = process.stdin) {
  stream.setEncoding?.("utf8");
  let text = "", size = 0;
  try {
    for await (const chunk of stream) {
      size += Buffer.byteLength(chunk);
      if (size > 2 * 1024 * 1024) return {};
      text += chunk;
    }
    const value = JSON.parse(text.replace(/^\uFEFF/, ""));
    return object(value) ? value : {};
  } catch { return {}; }
}
function directory(dir, create = false) {
  if (!path.isAbsolute(dir)) return false;
  let current = path.parse(dir).root;
  for (const part of dir.slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    try {
      if (create && !fs.existsSync(current)) fs.mkdirSync(current, { mode: 0o700 });
      const stat = fs.lstatSync(current);
      if (!stat.isDirectory() || stat.isSymbolicLink()) return false;
    } catch { return false; }
  }
  return true;
}
export function pathsFor(input) {
  const workspace = typeof input.cwd === "string" ? input.cwd : input.workspacePaths?.[0];
  if (typeof workspace !== "string" || !path.isAbsolute(workspace)) return null;
  let cwd;
  try { cwd = fs.realpathSync(workspace); if (!fs.statSync(cwd).isDirectory()) return null; } catch { return null; }
  const root = process.env.OMG_STATE_ROOT?.trim() ? path.resolve(cwd, process.env.OMG_STATE_ROOT.trim()) : path.join(cwd, ".omg", "state");
  const id = input.session_id ?? input.conversationId;
  const sessionDir = typeof id === "string" && id ? path.join(root, "sessions", `hooks-${hash(`${cwd}\0${id}`)}`) : null;
  return { cwd, root, sessionDir };
}
export function readJson(file, fallback = {}) {
  try {
    if (!directory(path.dirname(file))) return fallback;
    const stat = fs.lstatSync(file);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 128 * 1024) return fallback;
    const value = JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
    return object(value) ? value : fallback;
  } catch { return fallback; }
}
export const policyFor = (input) => {
  const paths = pathsFor(input);
  return paths ? readJson(path.join(paths.root, "model.json")) : {};
};
export function atomicJson(file, value) {
  if (!directory(path.dirname(file), true)) return false;
  const temp = `${file}.${process.pid}.${crypto.randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temp, `${JSON.stringify(value)}\n`, { flag: "wx", mode: 0o600 });
    fs.renameSync(temp, file);
    return true;
  } catch { return false; }
  finally { try { fs.unlinkSync(temp); } catch { /* Already renamed. */ } }
}
// Short per-session locking; never wait, steal locks or overwrite another session.
export function withSession(input, fn) {
  const p = pathsFor(input);
  if (!p?.sessionDir || !directory(p.sessionDir, true)) return null;
  const lock = path.join(p.sessionDir, ".hook-lock");
  try { fs.mkdirSync(lock, { mode: 0o700 }); } catch { return null; }
  try {
    const file = path.join(p.sessionDir, "tool-cycle.json");
    const state = readJson(file);
    const result = fn(state);
    return atomicJson(file, state) ? result : null;
  } finally { try { fs.rmdirSync(lock); } catch { /* No recursive removal. */ } }
}
export function trace(input, decision, host) {
  const p = pathsFor(input);
  if (p?.sessionDir && (on(process.env.OMG_MODEL_ROUTING_TRACE) || on(policyFor(input).trace))) {
    atomicJson(path.join(p.sessionDir, "model-router-last.json"), { ...decision, host, applied: host === "gemini" && Boolean(decision.model), updated_at: new Date().toISOString() });
  }
}
