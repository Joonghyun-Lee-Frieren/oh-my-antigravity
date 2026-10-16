# oh-my-antigravity (OmA)

[![Version](https://img.shields.io/badge/version-1.1.0-0d8a83)](history.md)
[![Checks](https://img.shields.io/github/actions/workflow/status/Joonghyun-Lee-Frieren/oh-my-antigravity/version-check.yml?branch=main&label=checks)](https://github.com/Joonghyun-Lee-Frieren/oh-my-antigravity/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](../LICENSE)

[Website](https://joonghyun-lee-frieren.github.io/oh-my-antigravity/) · [History](history.md) · [English](../README.md) · [한국어](README_ko.md) · [日本語](README_ja.md) · [Français](README_fr.md) · [中文](README_zh.md) · [Español](README_es.md)

面向工程任务的原生 **Antigravity CLI 插件**，提供独立的设计轮次、只读文档代理、
编辑门控、真实验证证据和小范围审查。

<p align="center"><img src="../resources/image/oma_logo_02.png" alt="OmA" width="360"></p>

## 安装

需要最新的 Antigravity CLI 和 Node.js 20 或更高版本。

```bash
agy plugin install https://github.com/Joonghyun-Lee-Frieren/oh-my-antigravity
agy plugin list
```

在 CLI 中查看 `/plugin list` 和 `/hooks`，然后开始：

```text
/oma-team-plan 描述变更及其验收标准
```

文档阅读代理会返回简明摘要。记录 Scope Brief，锁定文件范围和验证项，再请求独立的
Design Check。通过后，**结束设计轮次**。在下一轮执行：

```text
/oma-team-exec 实现已锁定的计划
```

运行 `/oma-team-verify` 收集剩余的分节审查。当验证或审查失败时，Stop 钩子会安排修复批次。
缺少服务、权限或证据时，可以以 `blocked` 或 `unknown` 结束；系统从不强制要求成功的答复。

准确的控制器命令、JSON 示例、恢复方法和约束边界，请参阅
[受保护工作流指南](guide/guarded-workflow.md)。

## v1.1.0 新功能

| 功能 | 行为 |
| --- | --- |
| **Scope Brief** | 记录目标、约束、非目标、决策负责人和资料冲突；未解决的事项会阻止计划锁定 |
| **Design Check** | 只读审计代理在设计轮次结束前检查计划的确切版本；计划变更会使先前的审查失效 |
| **Evidence Window** | 使用有界的 UTF-8 字节游标读取经过完整性检查的日志片段；完整输出保留在磁盘上 |
| **Session Trail** | 不可变的 JSON/Markdown 检查点保留当前意图和下一步操作；恢复时检测资料或计划的变化 |
| **原生审查回执** | 审查代理从另一段对话自行提交结果；父对话无法编写 PASS 或引导审查 |
| **Care 配置** | routine/elevated/critical 范围分别采用 120/90/60 行的分节和 3/2/1 个修复单元的批次，同时保留所有验证和锁定 |

敏感路径只能提高谨慎级别。精简的状态和上下文包不会将完整日志及回执票据放入常规模型上下文。
验证仍会执行，缺少证据时仍保持 unknown。请参阅[模式定义与示例](guide/session-continuity.md)。

## 模型

推荐配置来自 [config/models.json](../config/models.json)，已于 2026-10-16 对照
[官方模型可用性](https://antigravity.google/docs/models)进行核查。

| 角色 | Balanced 配置 | Flash 配置 |
| --- | --- | --- |
| 设计与规划 | `gemini-4-argon-high` | `gemini-3.8-flash-high` |
| 实现 | `gemini-3.8-flash-medium` | `gemini-3.8-flash-medium` |
| 快速任务 | `gemini-3.8-flash-low` | `gemini-3.8-flash-low` |
| 审查与验证 | `gemini-4-argon-high` | `gemini-3.8-flash-high` |

使用 `agy models` 查看账户可用的模型，通过 `agy --model <id>` 或运行时选择器进行选择。
子代理使用 `model: inherit`。`/oma-model` 会解释各项配置；`auto` 表示保留当前选定的运行时模型，
`custom` 则需要指定全部四种角色。配置仅提供推荐，不会自动切换模型：原生钩子契约没有覆盖模型的
输出字段。如果 Argon 不可用，请明确选择 Flash 配置。较旧的企业模型可能仍然可用，
但不包含在随插件发布的默认配置中。

## 工作流与角色

插件提供 60 个简短技能，其中包括 49 个 `/oma-<name>` 命令入口，以及 16 个能力受限的代理。
请仅使用与当前任务相关的流程。

| 命令 | 用途 |
| --- | --- |
| `/oma-team-plan`, `/oma-team-prd` | 文档交接、范围、验收标准与设计 |
| `/oma-brief` | 目标、约束、决策责任与资料冲突 |
| `/oma-design-check` | 独立检查已锁定计划的确切版本 |
| `/oma-evidence` | 读取有界且经过完整性检查的验证器日志片段 |
| `/oma-checkpoint`, `/oma-resume` | 不可变交接记录与只读连续性检查 |
| `/oma-team-exec` | 在下一用户轮次实现已锁定的范围 |
| `/oma-team-verify` | 真实验证与逐节审查交接 |
| `/oma-team-fix` | Stop 选定的批次，最多包含三个修复单元 |
| `/oma-goal`, `/oma-ultragoal` | 使用相同轮次和证据门控跟踪交付 |
| `/oma-status`, `/oma-doctor` | 阶段、所有权、证据缺口、锁定与阻塞因素 |
| `/oma-model` | 当前模型推荐与运行时选择 |
| `/oma-hooks`, `/oma-hooks-validate` | 原生钩子检查与安全诊断 |
| `/oma-stop`, `/oma-cancel` | 停止并保留证据和锁定 |

`oma-doc-reader` 阅读规格说明。`oma-planner` 和 `oma-architect` 协助设计。
`oma-executor` 提出补丁；只有拥有所有权的主对话才能应用补丁。
`oma-design-auditor` 检查已锁定的计划。`oma-reviewer` 检查一个范围受限的分节；
`oma-verifier` 检查验收证据。所有随插件发布的工作代理均排除写入、shell、MCP 和委派工具。

工作流的权威状态位于 `.omg/state/guard.json`；执行日志位于 `.omg/evidence/`。
代理使用 `.omg/drafts/` 存放请求和辅助笔记。只有控制器拥有保护状态、证据和检查点。
钩子使用真实发送者身份捕获独立审查代理的消息。每个工作流只允许一个工作区和一个写入者；
隔离的 worktree 应使用各自独立的工作流。

## 从 v1.0 或 Gemini CLI 升级

使用 `agy plugin install` 重新安装原生插件。新计划需要已解决所有待定事项的 Scope Brief 和原生
Design Check。独立角色需要携带真实子对话 ID 的原生 send_message 钩子；运行时缺少支持时，
结果仍为 unknown。现有 v1.0 的已锁定状态可以通过旧版回执路径完成，但新计划始终使用原生路径。
Session Trail 只检查当前状态，不会恢复旧的所有权、批准或锁定。

原生命令使用 `/oma-team-exec`，替代 `/oma:team-exec`。旧的 TOML 协议源文件位于
`protocols/oma/`，用于生成原生技能包装层；它们放在运行时旧版 `commands/` 发现目录之外，
以避免重复注册。

`gemini-extension.json` 保留为迁移标记。请移除手动复制的旧钩子。Gemini `BeforeModel` 路由器、
路由跟踪标志和 `AfterAgent` 学习提示均已移除。请明确使用 `/oma-learn`，并通过 CLI 选择模型。

已通过的文件会保持锁定，包括在后续工作流中。解除锁定、修改已锁定的范围，或恢复被阻塞或属于其他
对话的状态，都需要操作人员在受保护代理之外明确操作。恢复时请保留先前的证据。

框架约束的是代理工具，并非操作系统沙箱。验证器是受信任的项目代码。行为验证和审查代理仍需识别
语义层面的伪造。一个修复单元是一个失败的验证器或一个未通过的分节，其中可能包含多条诊断信息。
请参阅[完整契约](guide/guarded-workflow.md)。

## 开发

```bash
npm test
npm run test:skills
npm run test:generated
npm run test:version
agy plugin validate .
```

在 `protocols/oma/` 中编辑命令流程，然后运行 `npm run build:skills`。
核心技能流程位于各入口旁的 `references/` 中。
测试覆盖轮次边界、shell 或路径绕过、所有权、失败或缺失的验证、审查覆盖、过期证据、锁定、
修复上限、取消和重试上限。v1.1 还覆盖资料冲突、设计回执失效、身份冒充、重放、谨慎级别提升、
UTF-8 日志分页、检查点损坏，以及恢复时的资料变化。

## 特别鸣谢

**特别感谢 [@hyunuk.lim](https://www.threads.com/@hyunuk.lim) (threads)。**
他的讨论串和帖子为本次重构提供了很大帮助，包括更小的技能、物理工具约束、诚实的失败、
有界修复和聚焦审查。

本项目也受到 Jeongkyu Shin 的观点启发而发展：围绕模型构建的工程框架与模型本身同样重要。

[MIT License](../LICENSE) · [Sponsor](https://github.com/sponsors/Joonghyun-Lee-Frieren)
