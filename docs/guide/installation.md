# oh-my-antigravity Extension Installation Guide

This guide follows the official Gemini CLI Extensions workflow.

## Prerequisites

1. Gemini CLI installed (recommended `v0.38.0+`)
2. Gemini authentication completed
3. Local clone of this repository

Check quickly:

```bash
gemini --version
```

Compatibility note:

- If your existing scripts still use `--allowed-tools`, migrate to `--policy` profiles.
- OmG does not require preview-channel-only manifest features to run.
- OmG keeps `general.previewFeatures=true` for preview-backed runtime features, while balanced model routing uses explicit preview model IDs by default.

## Step 1: Clone Repository

```bash
git clone https://github.com/Joonghyun-Lee-Frieren/oh-my-antigravity.git
cd oh-my-antigravity
```

## Step 2: Install as Gemini Extension

Run from your terminal (non-interactive mode):

```bash
gemini extensions install https://github.com/Joonghyun-Lee-Frieren/oh-my-antigravity
```

## Step 3: Verify Extension Loaded

Inside Gemini interactive mode:

```text
/extensions list
```

Or from terminal:

```bash
gemini extensions list
```

You should see `oh-my-antigravity` in the extension list.

## Step 3.5: Preview Features

OmG defaults to explicit preview model IDs for balanced routing and keeps Gemini CLI preview features enabled for runtime features that still depend on the flag:

```json
{
  "general": {
    "previewFeatures": true
  }
}
```

Set this in `~/.gemini/settings.json` or your workspace `.gemini/settings.json`. This repository now ships the workspace setting enabled by default.

## Step 4: Verify Core Features

Run one command and one skill:

```text
/omg:status
```

```text
$plan "Plan a small refactor in this repository"
```

Optional hook-layer smoke test:

```text
/omg:hooks
/omg:hooks-validate
```

If agent delegation is needed:

```text
/omg:team "Implement a small feature with planning and review"
```

If dynamic team composition is needed before execution:

```text
/omg:team-assemble "Analyze competitors and draft a decision report"
```

## Note

No extension-level setting override is required for installation.

## Upgrade

1. Pull latest repository changes.
2. Restart Gemini CLI.
3. Re-run `gemini extensions list` to confirm latest metadata is loaded.

## Uninstall

From terminal:

```bash
gemini extensions uninstall oh-my-antigravity
```
