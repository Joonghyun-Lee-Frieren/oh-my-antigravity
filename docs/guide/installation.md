# Antigravity CLI installation

Install a current Antigravity CLI and Node.js 20+, then authenticate through the CLI.

```bash
agy plugin install https://github.com/Joonghyun-Lee-Frieren/oh-my-antigravity
agy plugin list
```

Inside the CLI, inspect `/plugin list` and `/hooks`. Native OmA commands are skills:
`/oma-team-plan`, `/oma-team-exec`, `/oma-team-verify`, and `/oma-status`.

For a development checkout:

```bash
git clone https://github.com/Joonghyun-Lee-Frieren/oh-my-antigravity.git
cd oh-my-antigravity
agy plugin validate .
agy plugin install .
```

Use the CLI's plugin manager to reinstall/refresh an existing bundle from its source.
Do not assume a Gemini extensions update command applies to native plugins. Remove
manually copied old OmA hooks so root `hooks.json` has one authoritative registration.
The native package uses `plugin.json`, `hooks.json`, `skills/`, `agents/`, and `rules/`.
`gemini-extension.json` is a migration marker, not the native manifest.

The CLI displays each skill as a slash command. Old `/oma:<name>` commands are now
`/oma-<name>`. TOML protocol sources live under `protocols/oma/`; they generate native
YAML skill wrappers and are not rediscovered as legacy commands.

Run `/oma-team-plan` to initialize, read documentation, and seal a design. End that
turn, then run `/oma-team-exec` in the next user turn. See the [guarded workflow
contract](guarded-workflow.md) for exact requests, evidence, locks, and recovery.

If hooks are missing, do not assume safety controls are active. Check client version,
Node availability, plugin validation, and runtime `/hooks`. A real authenticated
smoke test establishes runtime behavior; static validation alone does not.

Models: use `agy models`, then `agy --model <id>`. The balanced profile recommends
Gemini 4 Argon and Gemini 3.8 Flash. Account availability varies; select the Flash-only
profile explicitly when needed. Hooks do not force model changes.

[Official plugin documentation](https://antigravity.google/docs/plugins?tab=cli)
