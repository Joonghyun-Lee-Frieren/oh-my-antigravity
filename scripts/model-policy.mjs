#!/usr/bin/env node
import fs from 'node:fs';

export const catalog = JSON.parse(fs.readFileSync(new URL('../config/models.json', import.meta.url), 'utf8'));
export function isAllowedModel(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  const id = value.trim().toLowerCase();
  if (Object.entries(catalog.orchestrators).some(([slug, entry]) => id === slug || id === entry.name.toLowerCase())) return true;
  return Object.entries(catalog.models).some(([model, spec]) =>
    id === model || spec.efforts.some(effort => id === `${model}-${effort}`));
}
export function modelPolicy(strategy = 'balanced', overrides = {}) {
  if (strategy === 'auto') return { strategy, lanes: {}, runtime: 'inherit the selected CLI model' };
  if (strategy === 'custom') {
    const lanes = {};
    for (const lane of Object.keys(catalog.profiles.balanced)) {
      if (typeof overrides[lane] !== 'string' || !overrides[lane].trim()) throw new Error(`Custom profile is missing ${lane}.`);
      if (!isAllowedModel(overrides[lane])) throw new Error(`Custom profile has an unsupported model for ${lane}.`);
      lanes[lane] = overrides[lane];
    }
    return { strategy, lanes, runtime: 'explicit CLI selection required' };
  }
  if (!catalog.profiles[strategy]) throw new Error(`Unknown model strategy: ${strategy}`);
  return { strategy, lanes: catalog.profiles[strategy], runtime: 'agy --model <lane-model>; agent model: inherit', verifiedOn: catalog.verifiedOn };
}
if (process.argv[1] && import.meta.url === (await import('node:url')).pathToFileURL(process.argv[1]).href) {
  try { console.log(JSON.stringify(modelPolicy(process.argv[2]), null, 2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
