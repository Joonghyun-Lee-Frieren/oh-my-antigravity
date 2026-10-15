#!/usr/bin/env node
// Compatibility path retained for existing Gemini extension registrations.
import { selectModel } from "../lib/model-policy.mjs";
import { disabled, off, policyFor, readInput, trace } from "../lib/runtime.mjs";
try {
  const input = await readInput();
  const keys = ["model", "model-routing", "model-router", "model-preview", "model-banner", "oma-model-router", "oma-before-model-banner"];
  let output = {};
  if (input.llm_request && !off(process.env.OMG_MODEL_ROUTING) && !keys.some(disabled)) {
    const decision = selectModel(input, policyFor(input));
    trace(input, decision, "gemini");
    // Partial override: preserve SDK messages, function-call IDs and thought signatures.
    if (decision.model) output = { hookSpecificOutput: { llm_request: { model: decision.model } } };
  }
  process.stdout.write(JSON.stringify(output));
} catch { process.stdout.write("{}"); }
