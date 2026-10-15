import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const skillsRoot = path.join(__dirname, "..", "skills");

function parseFrontmatter(content) {
  const normalized = content.replace(/^\uFEFF/, "");
  const match = normalized.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    return { error: "missing frontmatter block" };
  }

  const body = match[1];
  const result = {};

  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const kv = line.match(/^([A-Za-z0-9_-]+)\s*:\s*"(.*)"$/);
    if (!kv) {
      return { error: `invalid frontmatter line: ${rawLine}` };
    }
    const [, key, value] = kv;
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      return { error: `duplicate frontmatter key: ${key}` };
    }
    result[key] = value;
  }

  return { data: result };
}

const errors = [];
const skillNames = new Map();

if (!fs.existsSync(skillsRoot)) {
  console.error("skills directory is missing");
  process.exit(1);
}

const skillDirs = fs
  .readdirSync(skillsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

for (const dirName of skillDirs) {
  const skillPath = path.join(skillsRoot, dirName, "SKILL.md");
  if (!fs.existsSync(skillPath)) {
    errors.push(`${dirName}: missing SKILL.md`);
    continue;
  }

  const content = fs.readFileSync(skillPath, "utf8");
  const parsed = parseFrontmatter(content);
  if (parsed.error) {
    errors.push(`${dirName}: ${parsed.error}`);
    continue;
  }

  const metadata = parsed.data;
  const name = typeof metadata.name === "string" ? metadata.name.trim() : "";
  const description =
    typeof metadata.description === "string" ? metadata.description.trim() : "";

  if (!name) {
    errors.push(`${dirName}: missing frontmatter key "name"`);
  }
  if (!description) {
    errors.push(`${dirName}: missing frontmatter key "description"`);
  }
  if (name && name !== dirName) {
    errors.push(`${dirName}: frontmatter name "${name}" must match directory name`);
  }

  if (name) {
    if (skillNames.has(name)) {
      errors.push(
        `${dirName}: duplicate skill name "${name}" also found in ${skillNames.get(name)}`,
      );
    } else {
      skillNames.set(name, dirName);
    }
  }
}

if (errors.length > 0) {
  console.error("Skill metadata check failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Checked ${skillDirs.length} skills.`);
console.log("All skill metadata checks passed.");
