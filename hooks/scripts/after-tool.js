#!/usr/bin/env node
import { afterTool } from "../lib/lifecycle.mjs";
import { readInput } from "../lib/runtime.mjs";
try { process.stdout.write(JSON.stringify(afterTool(await readInput(), "gemini"))); }
catch { process.stdout.write("{}"); }
