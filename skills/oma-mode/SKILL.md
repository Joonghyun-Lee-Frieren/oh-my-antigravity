---
name: oma-mode
description: "Inspect or set OmA operating mode/profile (balanced, speed, deep, autopilot, ralph, ultrawork)."
---

Read [the protocol](references/protocol.md) for this command.
For code work, first read [the guard contract](../../docs/guide/guarded-workflow.md).
The guard contract takes precedence over legacy state-writing or same-turn execution instructions.
Only the owning main conversation writes code; subagents return read-only handoffs.
