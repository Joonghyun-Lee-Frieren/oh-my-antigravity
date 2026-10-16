---
trigger: always_on
---

Use `/oma-<name>` skills for Antigravity; `/oma:<name>` TOML commands are legacy.
Read specifications through `oma-doc-reader`, then design in a separate user turn
from implementation. Read `docs/guide/guarded-workflow.md` in this plugin when
starting work. The workflow controller owns state and verification evidence.
Only the owning main conversation applies code; subagents return focused handoffs.
Report `blocked`, `fail`, or `unknown` honestly. Never fabricate responses, checks,
or successful service behavior. Review one bounded section per reviewer handoff.
