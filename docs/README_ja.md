# oh-my-gemini-cli (OmG)

[![Release](https://img.shields.io/github/v/tag/Joonghyun-Lee-Frieren/oh-my-gemini-cli?sort=semver&label=release)](https://github.com/Joonghyun-Lee-Frieren/oh-my-gemini-cli/releases)
[![Version Check](https://img.shields.io/github/actions/workflow/status/Joonghyun-Lee-Frieren/oh-my-gemini-cli/version-check.yml?branch=main&label=version%20check)](https://github.com/Joonghyun-Lee-Frieren/oh-my-gemini-cli/actions/workflows/version-check.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](../LICENSE)
[![Stars](https://img.shields.io/github/stars/Joonghyun-Lee-Frieren/oh-my-gemini-cli?style=social)](https://github.com/Joonghyun-Lee-Frieren/oh-my-gemini-cli/stargazers)
[![Gemini Extension](https://img.shields.io/badge/Gemini-Extension-0d8a83)](https://geminicli.com/extensions/?name=Joonghyun-Lee-Frierenoh-my-gemini-cli)
[![Sponsor](https://img.shields.io/badge/Sponsor-GitHub_Sponsors-ea4aaa?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/Joonghyun-Lee-Frieren)

[ランディングページ](https://joonghyun-lee-frieren.github.io/oh-my-gemini-cli/) | [更新履歴](./history.md)

[한국어](./README_ko.md) | [日本語](./README_ja.md) | [Français](./README_fr.md) | [中文](./README_zh.md) | [Español](./README_es.md)

Gemini CLI 向けの、コンテキストエンジニアリング駆動マルチエージェント・ワークフローパックです。

> "Claude Code の中核的な競争力は Opus や Sonnet ではなく、Claude Code そのものです。驚くことに、同じ harness を接続すると Gemini も非常にうまく動きます。"
>
> - Jeongkyu Shin (Lablup Inc. CEO), YouTube インタビューより

この観察からこのプロジェクトは始まりました。
"その harness モデルを Gemini CLI に持ち込んだらどうなるか?"

OmG は Gemini CLI を単発セッションのアシスタントから、役割分離された構造的なエンジニアリングワークフローへ拡張します。

<p align="center">
  <img src="../resources/image/omg_logo_02.jpg" alt="OmG Logo" width="280" />
</p>

## クイックスタート

### インストール

公式の Gemini Extensions コマンドで GitHub からインストールします。

```bash
gemini extensions install https://github.com/Joonghyun-Lee-Frieren/oh-my-gemini-cli
```

インタラクティブモードで確認:

```text
/extensions list
```

ターミナルモードで確認:

```bash
gemini extensions list
```

スモークテスト:

```text
/omg:status
```

注意: extension の install/update はインタラクティブな slash-command モードではなく、ターミナルモード (`gemini extensions ...`) で実行されます。

## v0.5.0 の新機能

- OmG のオーケストレーション層全体に、Claude 由来の prompt-ops hardening を追加:
  - 並列 lane を安全にする `critical-path` と `sidecar` の委譲ルール
  - 計画/実行段階での `read-before-modify` と `minimal-diff` ポリシー
  - denied tool/permission 時の回復契約 (盲目的な再試行なし)
  - verifier/reviewer の証拠ゲートを厳格化 (`pass|fail|unknown` 規律)
- コア prompt surface を更新:
  - `context/omg-core.md`
  - `agents/{director,planner,executor,reviewer,verifier}.md`
  - `commands/omg/{team-assemble,team,team-plan,team-exec,team-verify,team-fix,doctor}.toml`
  - `skills/{plan,execute}/SKILL.md`
- retained-skill 診断を修正し、`/omg:doctor` が現行 deep-work skill (`$omg-plan`, `$deep-dive` を含む) を全て検証するよう改善
- extension/package version を `0.5.0` に更新し、README・韓国語 README・landing docs・history を刷新

## 概要

| 項目 | 概要 |
| --- | --- |
| 提供形態 | 公式 Gemini CLI extension (`gemini-extension.json`) |
| 中核構成 | `GEMINI.md`, `agents/`, `commands/`, `skills/`, `context/` |
| 主な用途 | plan -> execute -> review ループを必要とする複雑実装タスク |
| 操作面 | slash-command-first の `/omg:*` 制御面 + 8 つの deep-work `$skills` ( `omg-plan` エイリアス含む ) + sub-agent 委譲 |
| 既定モデル戦略 | 判断/受け入れゲートは `gemini-3.1-pro-preview`、実装中心作業は `gemini-3-flash-preview`、広範な低リスク探索は `gemini-3.1-flash-lite-preview` |

## なぜ OmG か

| 生の単一セッション運用での問題 | OmG の対応 |
| --- | --- |
| 計画と実行でコンテキストが混線する | 役割ごとに責務を分離したエージェント構成 |
| 長時間タスクで進捗が見えにくい | 明示的なワークフローステージとコマンド駆動の状態確認 |
| 並列 lane や worktree がずれていく | `workspace` + `taskboard` で lane ownership、task ID、検証状態をコンパクトかつ明示的に保持 |
| permission denied が回復経路なしでループする | denied action を approval/fallback イベントとして明示化し、blocker を追跡 |
| 深いインタビュー進行が自動 nudge で中断される | deep-interview lock 中は learn-signal hook が nudge を抑止し、解除後のみ再開 |
| 定型作業で prompt engineering を繰り返す | slash command による運用制御 + retained deep-work skills (`$plan`, `$omg-plan`, `$execute`, `$research`) |
| 「決定したこと」と「実際に変わったこと」が乖離する | 同一オーケストレーションループ内に review/debug 役割を内包 |

## アーキテクチャ

```mermaid
flowchart TD
    U["User Task"] --> CLI["Gemini CLI Session"]
    CLI --> ORCH["OmG Extension Orchestration"]

    CORE["GEMINI.md -> context/omg-core.md"] --> ORCH
    CMDS["commands/omg/*.toml"] --> ORCH
    AGENTS["agents/*.md (role prompts)"] --> ORCH
    SKILLS["skills/*/SKILL.md (retained deep-work skills)"] --> ORCH

    ORCH --> I["/omg:intent"]
    I --> W["/omg:workspace (+ audit when needed)"]
    W --> A["/omg:team-assemble (optional approval gate)"]
    A --> P["team-plan -> team-prd -> taskboard sync"]
    P --> E["team-exec"]
    E --> V["team-verify"]
    V --> D{"Done criteria met?"}
    D -- "No" --> F["team-fix"]
    F --> E
    D -- "Yes" --> O["Validated output + next actions"]

    W -. lane map .-> WS[".omg/state/workspace.json"]
    P -. seed/sync .-> TB[".omg/state/taskboard.md"]
    E -. slice updates .-> TB
    V -. verifier evidence .-> TB
    ORCH -. status/checkpoint/hooks/notify .-> ST[".omg/state/{workflow.md,hooks.json,notify.json,...}"]
```

## チームワークフロー

```mermaid
sequenceDiagram
    participant User
    participant Director as omg-director
    participant Workspace as workspace/taskboard state
    participant Planner as omg-planner
    participant Architect as omg-architect
    participant Product as omg-product
    participant Executor as omg-executor
    participant Reviewer as omg-reviewer
    participant Verifier as omg-verifier
    participant Debugger as omg-debugger
    participant Editor as omg-editor

    User->>Director: Request team execution
    Director->>Workspace: Check lane health + task readiness
    Workspace-->>Director: workspace/taskboard summary
    Director->>User: Propose dynamic team + approval gate
    User->>Director: Approve roster
    Director->>Planner: Run team-plan
    Planner->>Architect: Validate technical direction (when needed)
    Architect-->>Planner: Design feedback and risk flags
    Planner-->>Director: Task graph + lane assumptions
    Director->>Product: Run team-prd
    Product-->>Director: Acceptance criteria + non-goals

    loop team-exec -> team-verify -> team-fix until done/blocker
        Director->>Executor: Assign smallest ready slice
        Executor->>Workspace: Update taskboard with execution notes
        Director->>Reviewer: Review implementation slice
        Reviewer->>Verifier: Run acceptance + anti-slop gate
        Verifier-->>Director: Pass/fail + verified task IDs
        alt Verification fails
            Director->>Debugger: Trigger root-cause analysis
            Debugger-->>Executor: Patch plan and fix targets
        end
    end

    Director->>Editor: Package validated output
    Editor-->>User: Final validated deliverable
```

## 動的チーム編成

固定のエンジニアリング roster では足りない場合に `team-assemble` を使います。

- 選定を以下に分割:
  - domain specialist (問題領域の専門性)
  - format specialist (レポート/出力品質)
- 広範な探索には並列探索 lane (`omg-researcher` xN) を起動。
- 意思決定は judgment lane (`omg-consultant` または `omg-architect`) に通す。
- reasoning effort は global profile + teammate override で lane ごとに割り当て。
- verify/fix ループを明示維持 (`omg-reviewer` -> `omg-verifier` -> `omg-debugger`)。
- 最終提出前に anti-slop チェックを実施。
- 自律実行開始前に明示 approval を必須化。

例:

```text
/omg:team-assemble "Compare 3 competitors and produce an exec report"
-> proposes: researcher x3 + consultant + editor + director
-> asks: Proceed with this team? (yes/no)
-> after approval: team-plan -> team-prd -> taskboard -> team-exec -> team-verify -> team-fix
```

有効化メモ:
- OmG では research-preview の個別設定は不要です。
- extension が読み込まれていれば `/omg:team-assemble` は即時利用できます。

## Workspace と Taskboard の制御

複数 root・複数 implementation lane・長い verify/fix ループをまたぐ作業では `workspace` と `taskboard` を使います。

- `/omg:workspace` は primary root と optional worktree/path lane を `.omg/state/workspace.json` で管理。
- `/omg:workspace audit` は並列実行/レビュー/自動化前に lane cleanliness、trust、handoff readiness を確認。
- `/omg:taskboard` は stable task ID、owner、依存関係、status (`todo`, `ready`, `in-progress`, `blocked`, `done`, `verified`)、lane health notes、evidence pointer を `.omg/state/taskboard.md` に保持。
- `team-plan` が task ID と lane 仮定を seed し、`team-exec` が lane/subagent context 付きで最小 ready slice を取り、`team-verify` が evidence + safe lane state の時だけ `verified` を付与。
- `checkpoint` と `status` は会話全体を再生せずにこれら state file を参照でき、cache 安定性向上と token 削減に寄与。
- `/omg:recall "<query>"` は state-first recall + bounded fallback search で、全 transcript を再読せず過去 rationale を復元。

例:

```text
/omg:workspace set .
/omg:workspace audit
/omg:workspace add ../feature-auth omg-executor
/omg:taskboard sync
/omg:taskboard next
/omg:recall "why was auth lane blocked" scope=state
```

## Workspace 衛生と Hook 対称性

長時間セッションで lane ownership、delegate 実行、hook continuation の挙動が不明瞭になり始めたときに使います。

- `/omg:workspace audit` は dirty な共有 worktree、untrusted review path、handoff-ready/handoff-blocked lane を可視化。
- `/omg:hooks` と `/omg:hooks-validate` は agent lifecycle 結果 (`completed`, `blocked`, `stopped`) をペアで扱い、blocked continuation を downstream 再開前に 1 回 safety lane へ戻す。
- `team-exec`, `team`, `team-verify`, `stop`, `cancel` は delegated lane/subagent context を compact かつ明示的に保持し、早期停止や blocker 発生時のみ詳細を展開。

## 通知ルーティング

長時間の OmG セッションで approval、verify 結果、blocker、idle drift を明示通知したい場合は `notify` を使います。

- サポート profile:
  - `quiet`: 緊急割り込みのみ (`approval-needed`, `verify-failed`, `blocker-raised`, `session-stop`)
  - `balanced`: quiet + checkpoint と team-approval 更新
  - `watchdog`: balanced + unattended loop 向け idle-watchdog アラート
- サポート channel:
  - `desktop` (host notification adapter)
  - `terminal-bell`
  - `file`
  - `webhook` (外部ブリッジ)
- 安全境界:
  - OmG は event routing・template・persisted policy を管理
  - 実配送は Gemini host hook、shell adapter、または project 専用 webhook bridge 側で実装が必要
  - delegated worker session は user が明示 opt-in しない限り外部 dispatch 無効

例:

```text
/omg:notify profile watchdog
-> enables: approval-needed, verify-failed, blocker-raised, checkpoint-saved, idle-watchdog, session-stop
-> suggests channels: terminal-bell + file by default
-> persists policy: .omg/state/notify.json
```

## 自動使用量モニタ (AfterAgent Hook)

OmG には、agent turn 完了ごとに compact な token 使用量行を出力する extension hook が同梱されています。

- Hook entrypoint: `hooks/hooks.json` (`AfterAgent` -> `omg-quota-watch-after-agent`)
- Script: `hooks/scripts/after-agent-usage.js`
- State artifact: `.omg/state/quota-watch.json` (turn counter、latest usage snapshot、last processed transcript fingerprint)
- Optional state root override: `OMG_STATE_ROOT=<dir>` (絶対パスまたは session `cwd` 相対)
- Optional quiet output: `OMG_HOOKS_QUIET=1`

自動表示内容:

- 直近 turn の token 合計 (input/output/cached/total)
- session 累積 token
- 直近 active model の累積 token

境界:

- この hook 単体では、アカウントの authoritative な残 quota を取得できません。
- 実際の残 quota/limit は `/stats model(~0.37.2) or /model(^0.38.0)` で確認してください。
- Gemini が同一 transcript snapshot を再試行した場合、hook は既出とみなして重複出力を抑止します。

例 (hook 出力のみ抑止し state snapshot は維持):

```bash
export OMG_HOOKS_QUIET=1
```

例 (監視 state を既定 `.omg/state` 以外へ保存):

```bash
export OMG_STATE_ROOT=.omg/state-local
```

この hook のみ無効化:

```json
{
  "hooksConfig": {
    "disabled": ["omg-quota-watch-after-agent"]
  }
}
```

## Learn-Signal 安全フィルタ (AfterAgent Hook)

OmG は、安全強化された learn-signal hook も同梱し、`/omg:learn` nudge が実行意図のあるセッションでのみ表示されるようにしています。

- Hook entrypoint: `hooks/hooks.json` (`AfterAgent` -> `omg-learn-signal-after-agent`)
- Script: `hooks/scripts/learn.js`
- State artifact: `.omg/state/learn-watch.json` (deduped event key、prompt-once session tracking、sanitized state)
- Deep-interview lock source (read-only): `.omg/state/deep-interview.json`
- Runtime control:
  - `OMG_STATE_ROOT=<dir>` で `learn-watch.json` の配置を変更
  - `OMG_HOOKS_QUIET=1` で state 更新を維持しつつ出力のみサイレント化

安全挙動:

- deep-interview lock が active の間、interview flow を守るため learn nudge を抑止
- 情報照会のみのセッションは emit 前にフィルタ
- 同一 transcript snapshot への繰り返し retry は重複排除
- legacy/malformed state は再利用前に sanitize して stale-state collision を低減

この hook のみ無効化:

```json
{
  "hooksConfig": {
    "disabled": ["omg-learn-signal-after-agent"]
  }
}
```

## Gemini CLI 互換性ノート (確認日: 2026-03-21)

- 推奨 stable runtime: Gemini CLI `v0.33.0+` (安定 hook lifecycle、subagent policy context、dirty-worktree handling のため)。
- Gemini CLI `v0.34.0-preview.0+` で利用可能な新しい UX 制御:
  - `/skill-name` による skill 直接呼び出し
  - `/footer` による footer カスタマイズ (`ui.footer.items`, `ui.footer.showLabels`, `ui.footer.hideCWD`, `ui.footer.hideSandboxStatus`, `ui.footer.hideModelInfo`)
- OmG の slash skill 呼び出し互換:
  - native `/plan` と衝突させず OmG planning skill を使うには `/omg-plan` (または `$omg-plan`) を使用。
- policy engine 移行:
  - wrapper script がまだ `--allowed-tools` を使っている場合は `--policy` profile へ移行 (`--allowed-tools` は Gemini CLI `v0.30.0` で非推奨)。
- native `/plan` と OmG planning command は共存可能:
  - native: `/plan`
  - OmG staged flow: `/omg:team-plan`, `/omg:team-prd`
- preview 専用機能 (例: extension manifest の plan-directory support、preview channel の experimental model steering docs) は OmG の必須要件ではなく、既定では意図的に無効。

## インターフェースマップ

### Commands

| コマンド | 目的 | 典型タイミング |
| --- | --- | --- |
| `/omg:status` | 進捗、リスク、次アクションを要約 | 作業セッションの開始/終了 |
| `/omg:doctor` | extension/team/workspace/hook readiness 診断と remediation plan を実行 | 長時間自律実行前、または設定異常時 |
| `/omg:hud` | HUD 表示 profile (`normal`, `compact`, `hidden`) の確認/切替 | 長時間セッション前、または端末密度変更時 |
| `/omg:hud-on` | HUD を full visual mode へ即時切替 | 詳細 status board に戻るとき |
| `/omg:hud-compact` | HUD を compact mode へ即時切替 | 密度の高い実装ループ中 |
| `/omg:hud-off` | HUD を hidden mode へ即時切替 (プレーン status section) | 視覚ブロックがノイズになるとき |
| `/omg:hooks` | hook pipeline profile と trigger policy を確認/切替 | 自律ループ前、または hook 挙動が drift したとき |
| `/omg:hooks-init` | hook config と plugin contract scaffolding を初期化 | プロジェクト kickoff、または初回 hook 導入時 |
| `/omg:hooks-validate` | hook 順序、lifecycle 対称性、安全性、予算制約を検証 | 高自律ワークフロー有効化前 |
| `/omg:hooks-test` | hook event sequence の dry-run と効率見積り | policy 変更後、またはループ停滞再発時 |
| `/omg:notify` | approval、blocker、verify 結果、checkpoint、idle watchdog の通知経路を設定 | 無人 `autopilot`/`loop` 実行前、または通知ノイズ調整時 |
| `/omg:intent` | タスク意図を分類し正しい stage/command へルーティング | 要求意図が曖昧な状態で planning/coding に入る前 |
| `/omg:rules` | タスク条件に応じた guardrail rule pack を有効化 | migration/security/performance 影響が大きい実装前 |
| `/omg:memory` | MEMORY index、topic file、path-aware rule pack を維持 | 長時間セッション中、または決定/ルールが drift したとき |
| `/omg:workspace` | primary root、worktree/path lane、collision boundary の確認/監査/設定 | 並列実装前、または multi-root 作業前 |
| `/omg:taskboard` | stable ID と verifier-backed completion state を持つコンパクト task ledger を維持 | planning 後から長期 exec/verify ループ全体 |
| `/omg:recall` | state-first 検索 + bounded history fallback で過去決定/証拠を復元 | transcript 全再生なしで根拠を素早く取り出したいとき |
| `/omg:reasoning` | global reasoning effort と teammate override (`low/medium/high/xhigh`) を設定 | 高コストな planning/review ループ前、または役割別深さ調整時 |
| `/omg:deep-init` | 長期セッション向けに deep project map と validation baseline を構築 | プロジェクト kickoff、または未知 codebase のオンボーディング時 |
| `/omg:team-assemble` | approval gate と lane 別 reasoning map を伴う動的チーム編成 | cross-domain / 非定型タスクで `/omg:team` の前 |
| `/omg:team` | stage pipeline 全体を実行 (`team-assemble? -> plan -> prd -> taskboard -> exec -> verify -> fix`) | 複雑な機能実装・リファクタ納品 |
| `/omg:team-plan` | 依存関係を考慮した実行計画を作成 | 実装前 |
| `/omg:team-prd` | 計測可能な受け入れ条件と制約を固定 | planning 後、coding 前 |
| `/omg:team-exec` | lane/subagent handoff を明示してスコープ済み slice を実装 | メイン実装ループ |
| `/omg:team-verify` | 受け入れ条件、回帰、anti-slop 品質ゲートを検証 | 各実装 slice の後 |
| `/omg:team-fix` | 検証済み failure のみを修正 | verify 失敗時 |
| `/omg:loop` | `exec -> verify -> fix` を done/blocker まで繰り返し強制 | 未解決 findings が残る中盤〜終盤 |
| `/omg:mode` | operating profile (`balanced/speed/deep/autopilot/ralph/ultrawork`) を確認/切替 | セッション開始時、または姿勢変更時 |
| `/omg:approval` | approval posture (`suggest/auto/full-auto`) を確認/切替 | 自律納品ループ前、または policy 変更時 |
| `/omg:autopilot` | checkpoint 付き反復自律サイクルを実行 | 複雑な自律納品 |
| `/omg:ralph` | 厳格な品質ゲート付きオーケストレーションを強制 | リリースクリティカルなタスク |
| `/omg:ultrawork` | 独立タスクのバッチ処理向け throughput mode | 大規模バックログ |
| `/omg:consensus` | 複数案から 1 つへ収束 | 意思決定負荷の高い局面 |
| `/omg:launch` | 長時間タスク向け persistent lifecycle state を初期化 | 長時間セッションの開始 |
| `/omg:checkpoint` | taskboard/workspace 参照付き compact checkpoint と再開ヒントを保存 | セッション中盤の handoff |
| `/omg:stop` | 自律モードを安全停止し進捗を保全 | 一時停止/割り込み |
| `/omg:cancel` | 安全停止 + 再開 handoff を返す harness-style cancel alias | 自律/チームフロー中断時 |
| `/omg:optimize` | 品質と token 効率のため prompt/context を改善 | ノイズが多い/高コストなセッション後 |
| `/omg:cache` | cache/context 挙動と compact-state anchoring を確認 | 長時間・高コンテキスト作業 |

### Skills

retained skills は、セッション開始時の discovery metadata 負荷を下げるため compact deep-work set に意図的に限定しています (互換 alias: `$omg-plan`)。

| Skill | 焦点 | 出力スタイル |
| --- | --- | --- |
| `$plan` | 目標をフェーズ計画へ変換 | マイルストーン、リスク、受け入れ条件 |
| `$omg-plan` | native `/plan` との衝突を避ける slash-friendly planning alias | `$plan` と同等の計画出力 |
| `$ralplan` | rollback point を持つ厳格な stage-gated planning | 品質優先の実行マップ |
| `$execute` | スコープ済み計画 slice を実装 | 変更要約 + 検証メモ |
| `$prd` | 要求を計測可能な受け入れ条件へ変換 | PRD 形式のスコープ契約 |
| `$research` | 選択肢とトレードオフを探索 | 意思決定指向の比較 |
| `$deep-dive` | planning 前に trace-to-interview discovery を実施 | clarity score、assumption ledger、launch brief |
| `$context-optimize` | コンテキスト構造を改善 | 圧縮と signal-to-noise 調整 |

### Sub-agents

| Agent | 主責務 | 推奨モデルプロファイル |
| --- | --- | --- |
| `omg-architect` | システム境界、インターフェース、長期保守性 | `gemini-3.1-pro-preview` |
| `omg-planner` | タスク分解と順序設計 | `gemini-3.1-pro-preview` |
| `omg-product` | スコープ固定、non-goal、計測可能受け入れ条件 | `gemini-3.1-pro-preview` |
| `omg-executor` | 高速実装サイクル | `gemini-3-flash-preview` |
| `omg-reviewer` | 正確性と回帰リスクの確認 | `gemini-3.1-pro-preview` |
| `omg-verifier` | 受け入れゲート証拠と release readiness 検証 | `gemini-3.1-pro-preview` |
| `omg-debugger` | 根本原因分析とパッチ戦略 | `gemini-3.1-pro-preview` |
| `omg-consensus` | オプション評価と意思決定収束 | `gemini-3.1-pro-preview` |
| `omg-researcher` | 外部選択肢の分析と統合 | `gemini-3.1-pro-preview` |
| `omg-director` | チーム内メッセージルーティング、衝突解消、ライフサイクル統括 | `gemini-3.1-pro-preview` |
| `omg-consultant` | 戦略分析基準と提案フレーミング | `gemini-3.1-pro-preview` |
| `omg-editor` | 最終成果物の構造、一貫性、対象読者適合 | `gemini-3-flash-preview` |
| `omg-quick` | 小規模な戦術修正 | `gemini-3.1-flash-lite-preview` |

## コンテキストレイヤーモデル

| レイヤー | ソース | 目的 |
| --- | --- | --- |
| 1 | System / runtime 制約 | プラットフォーム保証に沿った挙動を維持 |
| 2 | プロジェクト標準 | チーム規約とアーキテクチャ意図を維持 |
| 3 | 薄い `GEMINI.md`、`MEMORY.md`、共有コンテキスト | 毎ターン重い手順を抱えずに長時間メモリを安定化 |
| 4 | アクティブ task brief + workspace/taskboard state | 現在目標、active lane、受け入れ条件を可視化 |
| 5 | 最新実行トレース | 生ログ全再生なしで直近 iteration/review を加速 |

## プロジェクト構成

```text
oh-my-gemini-cli/
|- GEMINI.md
|- gemini-extension.json
|- agents/
|- commands/
|  `- omg/
|- skills/
|- context/
|- docs/
`- LICENSE
```

## トラブルシューティング

| 症状 | 想定原因 | 対応 |
| --- | --- | --- |
| install 時に `settings.filter is not a function` | Gemini CLI runtime が古い、または extension metadata cache が古い | Gemini CLI を更新し extension を再インストール |
| `/omg:*` が見つからない | 現在セッションで extension 未ロード | `gemini extensions list` 実行後、Gemini CLI セッションを再起動 |
| OmG planning skill を使いたいのに `/plan` で native plan が開く | built-in `/plan` と skill slash invocation の名前衝突 | OmG planning skill は `/omg-plan` (または `$omg-plan`) を使う、または staged planning に `/omg:team-plan` を使用 |
| Skill が発火しない | retained deep-work skills 以外は同梱されない、または extension metadata が stale | README の retained skill 一覧を再確認し extension/session を再ロード |
| team assembly が提案だけして実行しない | 要求内の approval token が不足 | 明示 approval (`yes`, `approve`, `go`, `run`) を返答 |
| 並列実行で同じファイルが衝突/再計画される | workspace lane が明示されていない | `/omg:workspace status` で確認、または `/omg:workspace` で lane/path ownership を設定 |
| dirty/untrusted lane で review/automation が走りそう | 共有 worktree の衛生状態が不明 | `/omg:workspace audit` 実行後、必要なら lane 分離してから verify/review 継続 |
| 長いループ後に done 状態が揺れる | compact な真実源がない、または verifier signoff 欠落 | `/omg:taskboard sync` 後に `/omg:team-verify` を再実行して残 ID を閉じる |
| 以前の判断理由を思い出せない | rationale が長い session history に埋もれた | まず `/omg:recall "<keyword>" scope=state`、必要時のみ `scope=recent` へ拡張 |
| continuation 後に hook が終端イベントを取り逃す/二重発火する | hook lifecycle 対称性が未定義 | `/omg:hooks-validate` 実行後、lifecycle policy を修正してから自律ループ再開 |
| 出力が冗長・汎用・反復的 | target artifact に対して reasoning/gate posture が弱い | `/omg:reasoning` を引き上げ (必要なら teammate override)、`/omg:team-verify` を再実行 |
| 既存 launch script が `--allowed-tools` を使う | 新しい Gemini CLI で非推奨 | `--policy` profile に置き換えて再実行 |
| 自律フローが確認しすぎる (または少なすぎる) | approval posture がタスクリスクと不一致 | `/omg:approval suggest|auto|full-auto` で再調整 |
| 長時間 run 前に setup 健全性が不明 | state/config drift が蓄積 | `/omg:doctor` (または `/omg:doctor team`) を実行して remediation を反映 |

## 移行ノート

| 旧フロー | extension-first フロー |
| --- | --- |
| グローバルパッケージ install + `omg setup` コピー工程 | `gemini extensions install ...` |
| 主に CLI script で runtime を接続 | extension manifest primitive で runtime を接続 |
| 手動 onboarding script | Gemini CLI の native extension loading |

extension の動作は Gemini CLI extension primitive による manifest 駆動です。

## 参考・インスピレーション

- [Gemini CLI](https://github.com/google-gemini/gemini-cli) - Google のオープンソース AI ターミナルエージェント
- [oh-my-codex](https://github.com/Yeachan-Heo/oh-my-codex) - Codex CLI harness
- [oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode) - Claude Code CLI harness
- [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode) - OpenCode agent harness
- [Claude Code Prompt Caching](https://news.hada.io/topic?id=26835) - コンテキストエンジニアリングの原則
- [everything-claude-code](https://github.com/affaan-m/everything-claude-code) - Claude Code CLI harness

## ドキュメント

- [インストールガイド](./guide/installation.md)
- [コンテキストエンジニアリングガイド](./guide/context-engineering.md)
- [エージェントチーム編成ガイド](./guide/agent-team-assembly.md)
- [メモリ管理ガイド](./guide/memory-management.md)
- [Hook エンジニアリングガイド](./guide/hook-engineering.md)
- [更新履歴](./history.md)

## Star History

[![Star History Chart](https://api.star-history.com/image?repos=Joonghyun-Lee-Frieren/oh-my-gemini-cli&type=date&legend=top-left)](https://www.star-history.com/?repos=Joonghyun-Lee-Frieren%2Foh-my-gemini-cli&type=date&legend=top-left)

## ライセンス

MIT
