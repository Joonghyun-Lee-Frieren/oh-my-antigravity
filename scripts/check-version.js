import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.join(__dirname, "..", "package.json");
const extensionJsonPath = path.join(__dirname, "..", "gemini-extension.json");
const syncVersionPath = path.join(__dirname, "sync-version.js");

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const extensionJson = JSON.parse(fs.readFileSync(extensionJsonPath, "utf8"));
const pluginJson = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "plugin.json"), "utf8"));

const version = packageJson.version;
const errors = [];

if (pluginJson.name !== packageJson.name || !pluginJson.description) {
  errors.push("Native plugin name/description must match the package identity.");
}

console.log(`Source version (package.json): ${version}`);

if (extensionJson.version !== version) {
  errors.push(
    `gemini-extension.json version (${extensionJson.version}) does not match package.json (${version})`,
  );
}

if (!fs.existsSync(syncVersionPath)) {
  errors.push("scripts/sync-version.js is missing");
}

if (errors.length > 0) {
  console.error("Version check failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("All version checks passed.");
