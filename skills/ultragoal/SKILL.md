---
name: ultragoal
description: "Manage durable multi-goal workflows with sequential execution, repo-native checkpointing, and fail-closed safety."
---

Read [the workflow](references/workflow.md) when this skill applies.
For code work, follow [the guard contract](../../docs/guide/guarded-workflow.md) first.
Design and implementation require separate user turns. Only the owning main conversation writes code.
Missing evidence is unknown; honest failure is a valid outcome.
