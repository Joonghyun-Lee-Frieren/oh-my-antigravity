# Installation and migration

OmA 0.10.0 is a native Antigravity plugin with a separate Gemini CLI compatibility
entry point. Reference: Antigravity CLI 1.3.5, published 2026-10-14. Hook scripts
require Node.js 22 or later on the CLI's PATH.

```bash
agy --version
node --version
agy plugin install https://github.com/Joonghyun-Lee-Frieren/oh-my-antigravity
agy plugin list --json
```

Open `/skills`, `/agents` and `/hooks` to inspect loaded components. Use `/oma status`
or `/oma doctor`. The native oma skill loads one retained command procedure at a
time. Use `/oma-plan` for the planning skill without colliding with native controls.

```bash
agy --model gemini-3.8-flash --effort medium
agy --model gemini-4-argon --effort high
```

Check `/model` for account availability. Default OmA policy is auto and preserves
the host selection. Native agent descriptors explicitly inherit the host model.
They now declare tool allowlists; Antigravity otherwise defaults to no tools.
See [models](models.md) for recommendations and SDK capability boundaries.

## Gemini compatibility

```bash
gemini extensions install https://github.com/Joonghyun-Lee-Frieren/oh-my-antigravity
gemini extensions list
```

Use `/oma:status` and `/oma:model auto`. Gemini loads gemini-extension.json,
GEMINI.md, commands/oma and hooks/hooks.json. Antigravity loads plugin.json,
root hooks.json, skills, rules and native agents. Native agent tool names target
Antigravity; do not copy those descriptors into Gemini's custom-agent registry.
The native dispatcher translates compatibility command spelling for its host.

## Updates

Use the active host's plugin manager. For a clean native reinstall:

```bash
agy plugin uninstall oh-my-antigravity
agy plugin install https://github.com/Joonghyun-Lee-Frieren/oh-my-antigravity
```

For Gemini use `gemini extensions update oh-my-antigravity`. Restart sessions and
check /hooks for manually duplicated registrations. Do not combine the two hook
manifests. Remove previous project-level preview opt-ins only after checking whether
other installed extensions still require them; OmA no longer adds such an opt-in.

## Local development

```bash
git clone https://github.com/Joonghyun-Lee-Frieren/oh-my-antigravity.git
cd oh-my-antigravity
npm run check
agy plugin validate .
agy plugin install .
```

Fixture checks do not call a model. Account access, authenticated inference and
end-to-end delegation require a real logged-in CLI session. Hook diagnostics are
fail-open; a neutral response alone does not prove a hook was discovered.

## Nonstandard paths

The native loader checks the explicit OMG_PLUGIN_ROOT override, its development
working directory, standard staging under ~/.gemini/antigravity-cli/plugins/ and
~/.gemini/config/plugins/, and workspace .agents/plugins/ or _agents/plugins/.
Candidates must have the matching plugin manifest. For linked/nonstandard installs,
set OMG_PLUGIN_ROOT to the actual installed root before launching the host.
Use your shell's environment syntax; do not put credentials in this variable.

Sources: [plugins](https://www.antigravity.google/docs/cli/plugins),
[release 1.3.5](https://github.com/google-antigravity/antigravity-cli/releases/tag/1.3.5),
[subagents](https://www.antigravity.google/docs/subagents/).
