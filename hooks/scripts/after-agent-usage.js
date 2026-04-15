#!/usr/bin/env node
/*
 * OmG AfterAgent usage monitor hook.
 *
 * This hook reads the active Gemini transcript file and prints a compact
 * token-usage line after each completed agent turn.
 * It can include a compact cwd/worktree hint for multi-lane sessions.
 *
 * Repeated hook retries against the same transcript snapshot are treated as
 * already delivered so the usage line stays idempotent.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_STATE_RELATIVE_PATH = path.join(".omg", "state", "quota-watch.json");
const QUIET_HOOKS_ENV = "OMG_HOOKS_QUIET";
const STATE_ROOT_ENV = "OMG_STATE_ROOT";
const CWD_MODE_ENV = "OMG_USAGE_CWD_MODE";
const HOOK_PROFILE_ENV = "OMG_HOOK_PROFILE";
const DISABLED_HOOKS_ENV = "OMG_DISABLED_HOOKS";
const USAGE_HOOK_KEYS = new Set([
  "usage",
  "quota",
  "quota-watch",
  "omg-quota-watch-after-agent",
]);

function readStdinText() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => {
      resolve(data);
    });
    process.stdin.on("error", () => {
      resolve("");
    });
  });
}

function safeJsonParse(text, fallback = null) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function isTruthy(value) {
  if (typeof value !== "string") {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function parseCsvEnv(value) {
  if (typeof value !== "string") {
    return [];
  }
  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function resolveHookProfile() {
  const raw =
    typeof process.env[HOOK_PROFILE_ENV] === "string"
      ? process.env[HOOK_PROFILE_ENV].trim().toLowerCase()
      : "";
  if (raw === "minimal" || raw === "balanced" || raw === "strict") {
    return raw;
  }
  return "balanced";
}

function isHookDisabled(disabledHooks, candidates) {
  for (const candidate of candidates) {
    if (disabledHooks.includes(candidate)) {
      return true;
    }
  }
  return false;
}

function resolveStatePath(cwd) {
  const customStateRoot = process.env[STATE_ROOT_ENV];
  if (typeof customStateRoot === "string" && customStateRoot.trim()) {
    const stateRoot = path.isAbsolute(customStateRoot)
      ? customStateRoot.trim()
      : path.join(cwd, customStateRoot.trim());
    return path.join(stateRoot, "quota-watch.json");
  }
  return path.join(cwd, DEFAULT_STATE_RELATIVE_PATH);
}

function asNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function hashText(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(asNumber(value));
}

function normalizeDisplayPath(value) {
  return String(value).replace(/\\/g, "/");
}

function resolveCwdMode() {
  const raw = typeof process.env[CWD_MODE_ENV] === "string"
    ? process.env[CWD_MODE_ENV].trim().toLowerCase()
    : "";
  if (raw === "off" || raw === "leaf" || raw === "parent-leaf" || raw === "full") {
    return raw;
  }
  return "parent-leaf";
}

function formatCwdLabel(cwd, mode) {
  if (mode === "off") {
    return "";
  }

  const resolved = path.resolve(cwd || ".");
  const leaf = path.basename(resolved);

  if (mode === "full") {
    return normalizeDisplayPath(resolved);
  }

  if (mode === "leaf") {
    return leaf || normalizeDisplayPath(resolved);
  }

  const parent = path.basename(path.dirname(resolved));
  if (parent && leaf && parent !== leaf) {
    return `${normalizeDisplayPath(parent)}/${normalizeDisplayPath(leaf)}`;
  }

  return leaf || normalizeDisplayPath(resolved);
}

function detectProvider(modelName) {
  const normalized =
    typeof modelName === "string" ? modelName.trim().toLowerCase() : "";
  if (!normalized) {
    return "unknown";
  }
  if (normalized.startsWith("gemini")) {
    return "gemini";
  }
  const slashIndex = normalized.indexOf("/");
  if (slashIndex > 0) {
    return normalized.slice(0, slashIndex);
  }
  const dashIndex = normalized.indexOf("-");
  if (dashIndex > 0) {
    return normalized.slice(0, dashIndex);
  }
  return normalized;
}

function readState(statePath) {
  try {
    if (!fs.existsSync(statePath)) return {};
    const raw = fs.readFileSync(statePath, "utf8");
    const parsed = safeJsonParse(raw, {});
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

// Implement retry logic to handle file locks during parallel executions
function writeState(statePath, state, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      const dir = path.dirname(statePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
      return;
    } catch (err) {
      if (i === retries - 1) {
        // Fail-open: monitor should not block the main workflow
      } else {
        const end = Date.now() + 50;
        while (Date.now() < end) { /* sync sleep for 50ms */ }
      }
    }
  }
}

// Improve CWD resolution to avoid collisions between projects
function deriveCwd(hookInput) {
  if (typeof hookInput?.cwd === "string" && hookInput.cwd) {
    return hookInput.cwd;
  }

  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    return path.resolve(__dirname, "..", "..");
  }
}

function buildUsageFromTranscript(transcript) {
  const messages = Array.isArray(transcript?.messages) ? transcript.messages : [];
  const geminiMessages = messages.filter(
    (msg) =>
      msg &&
      msg.type === "gemini" &&
      msg.tokens &&
      typeof msg.tokens === "object"
  );

  if (geminiMessages.length === 0) {
    return null;
  }

  const latest = geminiMessages[geminiMessages.length - 1];
  const totals = {
    input: 0,
    output: 0,
    cached: 0,
    thoughts: 0,
    tool: 0,
    total: 0,
  };
  const byModel = {};
  const byProvider = {};

  for (const msg of geminiMessages) {
    const t = msg.tokens || {};
    totals.input += asNumber(t.input);
    totals.output += asNumber(t.output);
    totals.cached += asNumber(t.cached);
    totals.thoughts += asNumber(t.thoughts);
    totals.tool += asNumber(t.tool);
    totals.total += asNumber(t.total);

    const model = typeof msg.model === "string" && msg.model ? msg.model : "unknown";
    const provider = detectProvider(model);
    if (!byModel[model]) {
      byModel[model] = 0;
    }
    byModel[model] += asNumber(t.total);
    if (!byProvider[provider]) {
      byProvider[provider] = 0;
    }
    byProvider[provider] += asNumber(t.total);
  }

  const latestModel =
    typeof latest.model === "string" && latest.model ? latest.model : "unknown";
  const latestTokens = latest.tokens || {};

  return {
    latest: {
      model: latestModel,
      input: asNumber(latestTokens.input),
      output: asNumber(latestTokens.output),
      cached: asNumber(latestTokens.cached),
      total: asNumber(latestTokens.total),
    },
    session: totals,
    byModel,
    byProvider,
  };
}

function buildMonitorLine(usage, turnCount, cwdLabel) {
  return [
    `[OMG][USAGE][TURN ${turnCount}]`,
    ...(cwdLabel ? [`cwd=${cwdLabel}`] : []),
    `turn=${formatNumber(usage.latest.total)} tok`,
    `(in ${formatNumber(usage.latest.input)} / out ${formatNumber(usage.latest.output)} / cache ${formatNumber(usage.latest.cached)})`,
    `session=${formatNumber(usage.session.total)} tok`,
    `model=${usage.latest.model} ${formatNumber(usage.byModel[usage.latest.model] || 0)} tok`,
    `remaining=/stats model`,
  ].join(" ");
}

function buildEventKey(sessionId, transcriptPath, transcriptRaw) {
  const sessionPart = typeof sessionId === "string" && sessionId ? sessionId : "unknown";
  if (typeof transcriptRaw === "string") {
    return `${sessionPart}:transcript:${hashText(transcriptRaw)}`;
  }

  const sourcePart =
    typeof transcriptPath === "string" && transcriptPath ? transcriptPath : "missing";
  return `${sessionPart}:transcript-missing:${sourcePart}`;
}

function emitHookOutput(systemMessage) {
  const output = {
    decision: "allow",
    systemMessage,
  };
  process.stdout.write(JSON.stringify(output));
}

async function main() {
  const rawInput = await readStdinText();
  const hookInput = safeJsonParse(rawInput, {});

  const cwd = deriveCwd(hookInput);
  const sessionId =
    typeof hookInput?.session_id === "string" && hookInput.session_id
      ? hookInput.session_id
      : "unknown";
  const transcriptPath =
    typeof hookInput?.transcript_path === "string" && hookInput.transcript_path
      ? hookInput.transcript_path
      : "";

  const statePath = resolveStatePath(cwd);
  const quietHooks = isTruthy(process.env[QUIET_HOOKS_ENV]);
  const hookProfile = resolveHookProfile();
  const disabledHooks = parseCsvEnv(process.env[DISABLED_HOOKS_ENV]);
  const usageHookDisabled = isHookDisabled(disabledHooks, [...USAGE_HOOK_KEYS]);
  if (usageHookDisabled) {
    emitHookOutput("");
    return;
  }
  const cwdMode = resolveCwdMode();
  const cwdLabel = formatCwdLabel(cwd, cwdMode);
  const prevState = readState(statePath);
  let line;
  let nextTurnCount = prevState.last_session_id === sessionId ? asNumber(prevState.turn_count) : 0;
  let eventKey = buildEventKey(sessionId, transcriptPath, null);
  let lastTranscriptHash = null;

  if (transcriptPath && fs.existsSync(transcriptPath)) {
    const transcriptRaw = fs.readFileSync(transcriptPath, "utf8");
    lastTranscriptHash = hashText(transcriptRaw);
    eventKey = buildEventKey(sessionId, transcriptPath, transcriptRaw);

    const duplicateEvent =
      prevState.last_session_id === sessionId && prevState.last_event_key === eventKey;
    if (duplicateEvent) {
      emitHookOutput("");
      return;
    }

    nextTurnCount += 1;

    const transcript = safeJsonParse(transcriptRaw, null);
    const usage = buildUsageFromTranscript(transcript);
    if (usage) {
      line = buildMonitorLine(usage, nextTurnCount, cwdLabel);
      writeState(statePath, {
        turn_count: nextTurnCount,
        last_session_id: sessionId,
        last_event_key: eventKey,
        last_transcript_hash: lastTranscriptHash,
        last_model: usage.latest.model,
        last_provider: detectProvider(usage.latest.model),
        last_turn_total_tokens: usage.latest.total,
        last_session_total_tokens: usage.session.total,
        session_totals_by_model: usage.byModel,
        session_totals_by_provider: usage.byProvider,
        cwd_mode: cwdMode,
        last_cwd_label: cwdLabel,
        updated_at: new Date().toISOString(),
      });
    }
  } else {
    eventKey = buildEventKey(sessionId, transcriptPath, null);
    const duplicateEvent =
      prevState.last_session_id === sessionId && prevState.last_event_key === eventKey;
    if (duplicateEvent) {
      emitHookOutput("");
      return;
    }

    nextTurnCount += 1;
  }

  if (!line) {
    line = [
      `[OMG][USAGE][TURN ${nextTurnCount}]`,
      ...(cwdLabel ? [`cwd=${cwdLabel}`] : []),
      "usage=unavailable",
      "remaining=/stats model",
    ].join(" ");
    writeState(statePath, {
      turn_count: nextTurnCount,
      last_session_id: sessionId,
      last_event_key: eventKey,
      ...(lastTranscriptHash ? { last_transcript_hash: lastTranscriptHash } : {}),
      cwd_mode: cwdMode,
      last_cwd_label: cwdLabel,
      updated_at: new Date().toISOString(),
    });
  }

  const suppressOutput = quietHooks || hookProfile === "minimal";
  emitHookOutput(suppressOutput ? "" : line);
}

main().catch((error) => {
  const quietHooks = isTruthy(process.env[QUIET_HOOKS_ENV]);
  const fallback = {
    decision: "allow",
    systemMessage: quietHooks
      ? ""
      : `[OMG][USAGE] monitor-hook error: ${error?.message || String(error)}`,
  };
  process.stdout.write(JSON.stringify(fallback));
});
