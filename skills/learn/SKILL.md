---
name: "learn"
description: "Extract reusable patterns — error resolutions, workarounds, and conventions — from completed OmG sessions and persist them as learned rules in .omg/rules/learned/. Use when setting up automatic pattern extraction, configuring the SessionEnd hook, reviewing learned skills, or adjusting extraction thresholds."
user-invocable: true
triggers:
  - "extract patterns from session"
  - "learn from this session"
  - "save reusable patterns"
  - "configure session learning"
  - "review learned rules"
---

# Learn Skill

Evaluate OmG sessions to extract reusable patterns (error resolutions, workarounds, conventions) and save them to `.omg/rules/learned/`.

## When to Activate

- Setting up automatic pattern extraction from OmG sessions
- Configuring the `SessionEnd` hook for session evaluation
- Reviewing or curating learned skills in `.omg/rules/learned/`
- Adjusting extraction thresholds or pattern categories

## How It Works

Runs as a **SessionEnd hook** at the end of each session:

1. **Session Evaluation**: Check if session has enough messages (default: 10+).
2. **Pattern Detection**: Identify extractable patterns (errors, workarounds, styles).
3. **Skill Extraction**: Save useful patterns as new rules in `.omg/rules/learned/`.

### Interactive Selective Save

When `/omg:learn` is run manually:

1. Identify high-signal reusable patterns.
2. List patterns with unique IDs.
3. Ask the user whether to save all or specific ones.
4. Default to saving all if not specified.

## Extraction Focus

Prioritize **reusable patterns** over simple chat history:

- **Common Error Resolutions**: How recurring errors were fixed
- **Environment Workarounds**: Fixes for tool or framework quirks
- **Style/Conventions**: Project-specific rules identified during work
- **Corrected Behaviors**: Mistakes the agent should avoid in the future

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

- `/omg:memory` — Project-level knowledge
- `/omg:rules` — Context-aware rule application
- `/omg:learn` — Manual pattern extraction command
