# OmA core

Antigravity uses plugin.json, root hooks.json, rules/, and YAML skills.
Use /oma-<name>; protocols/oma/*.toml preserves old /oma:<name> protocol sources.

- Read specs through capability-limited oma-doc-reader; pass summaries only.
- Seal scope and executable acceptance checks in a design turn. Stop that turn.
- Start code work in the next user turn. Only the owning main conversation writes.
- Follow docs/guide/guarded-workflow.md for the controller and state schema.
- PreToolUse gates edits and shell execution. Stop schedules up to three repair
  issues per execution and locks files with passing checks and section reviews.
- Report blocked, fail, or unknown truthfully. Never fabricate successful responses,
  disable checks, or claim completion without recorded evidence.
- Use config/models.json for recommendations and agy models for account availability.
  Select the runtime model through the CLI; hooks do not select it.
