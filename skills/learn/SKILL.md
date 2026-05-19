---
# REFACTORED: Integrated interactive selective save functionality into the learn skill.
# The extraction process now prioritizes common reusable patterns over simple chat logs.
# Default behavior is to save all identified patterns, allowing users to opt into selective saving.
name = "learn"
description = "Automatically extract reusable patterns from sessions and save them as learned skills/rules for future use."
---

# Learn Skill

Automatically evaluates OmA sessions to extract reusable patterns (error resolutions, workarounds, conventions) and save them to `.omg/rules/learned/`.

## When to Activate

- Setting up automatic pattern extraction from OmA sessions.
- Configuring the `SessionEnd` hook for session evaluation.
- Reviewing or curating learned skills in `.omg/rules/learned/`.
- Adjusting extraction thresholds or pattern categories.

## How It Works

This skill runs as a **SessionEnd hook** at the end of each session:

1. **Session Evaluation**: Checks if session has enough messages (default: 10+).
2. **Pattern Detection**: Identifies extractable patterns (errors, workarounds, styles).
3. **Skill Extraction**: Saves useful patterns as new rules in `.omg/rules/learned/`.

### Interactive Selective Save

When `/oma:learn` is run, the agent will:
1. Identify high-signal reusable patterns.
2. List these patterns with unique IDs.
3. **Ask the user** whether to save all or specific ones.
4. Default to saving all if not specified.

## Extraction Focus

The `learn` skill focuses on **reusable patterns** rather than simple chat history:
- **Common Error Resolutions**: How recurring errors were fixed.
- **Environment Workarounds**: Fixes for tool or framework quirks.
- **Style/Conventions**: Project-specific rules identified during work.
- **Corrected Behaviors**: Mistakes the agent should avoid in the future.

## Configuration

Edit `.omg/rules/learn.json` to customize:

```json
{
  "min_session_length": 10,
  "extraction_threshold": "medium",
  "auto_approve": false,
  "learned_skills_path": ".omg/rules/learned/",
  "patterns_to_detect": [
    "error_resolution",
    "user_corrections",
    "workarounds",
    "debugging_techniques",
    "project_specific"
  ],
  "ignore_patterns": [
    "simple_typos",
    "one_time_fixes",
    "external_api_issues"
  ]
}
```

## Related

- `/oma:memory` - Project-level knowledge.
- `/oma:rules` - Context-aware rule application.
- `/oma:learn` - Manual pattern extraction command.
