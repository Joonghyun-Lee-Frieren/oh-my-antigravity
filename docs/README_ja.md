# oh-my-antigravity (OmA)

[![Version](https://img.shields.io/badge/version-1.1.0-0d8a83)](history.md)
[![Checks](https://img.shields.io/github/actions/workflow/status/Joonghyun-Lee-Frieren/oh-my-antigravity/version-check.yml?branch=main&label=checks)](https://github.com/Joonghyun-Lee-Frieren/oh-my-antigravity/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](../LICENSE)

[Website](https://joonghyun-lee-frieren.github.io/oh-my-antigravity/) · [History](history.md) · [English](../README.md) · [한국어](README_ko.md) · [日本語](README_ja.md) · [Français](README_fr.md) · [中文](README_zh.md) · [Español](README_es.md)

設計ターンの分離、読み取り専用の文書エージェント、編集ゲート、実際の検証証拠、
小さな単位のレビューを備えた、エンジニアリング作業向けのネイティブ **Antigravity CLI プラグイン**です。

<p align="center"><img src="../resources/image/oma_logo_02.png" alt="OmA" width="360"></p>

## インストール

最新の Antigravity CLI と Node.js 20 以上が必要です。

```bash
agy plugin install https://github.com/Joonghyun-Lee-Frieren/oh-my-antigravity
agy plugin list
```

CLI 内で `/plugin list` と `/hooks` を確認し、次のコマンドで開始します。

```text
/oma-team-plan 変更内容と受け入れ基準を説明してください
```

文書リーダーが簡潔な要約を返します。Scope Brief を記録し、ファイルの範囲と検証項目を確定して、
独立した Design Check を依頼します。合格したら、**設計ターンを終了**してください。次のターンで実行します。

```text
/oma-team-exec 確定した計画を実装してください
```

`/oma-team-verify` で残りのセクションレビューを収集します。検証やレビューが失敗すると、Stop フックが
修正バッチを割り当てます。サービス、権限、証拠が不足している場合は、`blocked` または `unknown` で
終了できます。成功という回答を必須にはしません。

コントローラーの正確なコマンド、JSON の例、復旧方法、強制できる範囲については、
[保護付きワークフローガイド](guide/guarded-workflow.md)を参照してください。

## v1.1.0 の新機能

| 機能 | 動作 |
| --- | --- |
| **Scope Brief** | 目的、制約、対象外の事項、意思決定の担当者、資料間の矛盾を記録します。未解決の項目があると計画を確定できません |
| **Design Check** | 読み取り専用の監査役が、設計ターンの終了前に計画そのものを検証します。計画を変更すると以前のレビューは無効になります |
| **Evidence Window** | 範囲を制限した UTF-8 バイトカーソルで、整合性を検証したログの抜粋を読み取ります。完全な出力はディスクに残ります |
| **Session Trail** | 変更不能な JSON/Markdown チェックポイントに現在の意図と次の操作を保存します。再開時に資料や計画の変更を検出します |
| **ネイティブレビュー受領記録** | レビュアーが別の会話から自分の結果を提出します。親の会話は PASS を作成したり、レビューを誘導したりできません |
| **Care プロファイル** | routine/elevated/critical の範囲にそれぞれ 120/90/60 行のセクションと 3/2/1 単位のバッチを適用し、すべての検証とロックを維持します |

機密性の高いパスは注意レベルを引き上げる方向にしか作用しません。簡潔な状態・コンテキストパックにより、
通常のモデルコンテキストには完全なログや受領チケットを含めません。検証は引き続き実行され、証拠が
不足すれば unknown のままです。[スキーマと例](guide/session-continuity.md)を参照してください。

## モデル

推奨設定は [config/models.json](../config/models.json) にあり、2026-10-16 に
[公式のモデル提供状況](https://antigravity.google/docs/models)と照合しました。

| 役割 | Balanced プロファイル | Flash プロファイル |
| --- | --- | --- |
| 設計・計画 | `gemini-4-argon-high` | `gemini-3.8-flash-high` |
| 実装 | `gemini-3.8-flash-medium` | `gemini-3.8-flash-medium` |
| 短時間の作業 | `gemini-3.8-flash-low` | `gemini-3.8-flash-low` |
| レビュー・検証 | `gemini-4-argon-high` | `gemini-3.8-flash-high` |

`agy models` で自分のアカウントで利用できるモデルを確認し、`agy --model <id>` またはランタイムの
選択機能で選んでください。サブエージェントは `model: inherit` を使用します。`/oma-model` が
プロファイルを説明します。`auto` は選択中のランタイムモデルを維持し、`custom` は 4 つの役割すべての
指定を必要とします。プロファイルは推奨設定であり、モデルを自動で切り替えません。ネイティブフックの
契約にはモデルを上書きする出力がありません。Argon を利用できない場合は、Flash プロファイルを
明示的に選んでください。従来の企業向けモデルが引き続き利用できる場合もありますが、配布時の既定値には含めません。

## ワークフローと役割

このプラグインは、49 個の `/oma-<name>` コマンドエントリーポイントを含む 60 個の短いスキルと、
機能を制限した 16 個のエージェントを提供します。現在の作業に関係する手順だけを使ってください。

| コマンド | 目的 |
| --- | --- |
| `/oma-team-plan`, `/oma-team-prd` | 文書の引き継ぎ、範囲、受け入れ基準、設計 |
| `/oma-brief` | 目的、制約、意思決定の責任、資料間の矛盾 |
| `/oma-design-check` | 確定した計画そのものの独立した検証 |
| `/oma-evidence` | 範囲を制限し、整合性を検証したバリデーターログの表示 |
| `/oma-checkpoint`, `/oma-resume` | 変更不能な引き継ぎ記録と読み取り専用の継続性確認 |
| `/oma-team-exec` | 次のユーザーターンで確定した範囲を実装 |
| `/oma-team-verify` | 実際の検証と、1 セクションずつのレビュー引き継ぎ |
| `/oma-team-fix` | Stop が選択した最大 3 修正単位のバッチ |
| `/oma-goal`, `/oma-ultragoal` | 同じターン・証拠ゲートを適用した完了追跡 |
| `/oma-status`, `/oma-doctor` | フェーズ、所有権、証拠の不足、ロック、阻害要因 |
| `/oma-model` | 現在のモデル推奨とランタイムでの選択 |
| `/oma-hooks`, `/oma-hooks-validate` | ネイティブフックの確認と安全性診断 |
| `/oma-stop`, `/oma-cancel` | 証拠とロックを保持して停止 |

`oma-doc-reader` は仕様を読みます。`oma-planner` と `oma-architect` は設計を支援します。
`oma-executor` はパッチを提案し、所有権を持つメインの会話だけが適用します。
`oma-design-auditor` は確定した計画を確認します。`oma-reviewer` は範囲を制限した 1 セクションを、
`oma-verifier` は受け入れ基準の証拠を確認します。配布するすべてのワーカーから、書き込み、シェル、
MCP、委任のツールを除外しています。

ワークフローの正本となる状態は `.omg/state/guard.json`、実行ログは `.omg/evidence/` にあります。
エージェントは依頼や補足メモに `.omg/drafts/` を使います。保護状態、証拠、チェックポイントを所有するのは
コントローラーだけです。フックは実際の送信者 ID を使って独立レビュアーのメッセージを取得します。
ワークフローごとに 1 つのワークスペースと 1 人の書き込み担当だけを許可します。分離したワークツリーには
別々のワークフローを使ってください。

## v1.0 または Gemini CLI からのアップグレード

`agy plugin install` でネイティブプラグインを再インストールしてください。新しい計画には、解決済みの
Scope Brief とネイティブの Design Check が必要です。独立した役割には、実際の子会話 ID を含む
ネイティブ send_message フックが必要です。ランタイムが対応していなければ unknown のままになります。
既存の v1.0 の確定済み状態は従来の受領記録経路で完了できますが、新しい計画は常にネイティブ経路を
使います。Session Trail は以前の所有権、承認、ロックを復元せず、現在の状態を確認します。

ネイティブコマンドでは `/oma:team-exec` に代わり `/oma-team-exec` を使います。従来の TOML
プロトコルソースは `protocols/oma/` にあり、ネイティブスキルのラッパーを生成します。重複登録を避けるため、
ランタイムの従来の `commands/` 検索ディレクトリの外に配置しています。

`gemini-extension.json` は移行用の目印として残ります。手動でコピーした古いフックは削除してください。
Gemini の `BeforeModel` ルーター、ルーター追跡フラグ、`AfterAgent` の学習リマインダーは削除しました。
`/oma-learn` を明示的に使い、CLI でモデルを選んでください。

合格したファイルは、その後のワークフローでもロックされたままです。ロック解除、確定した範囲の変更、
ブロックされた状態や別の所有者の状態の復旧には、保護対象のエージェントの外で運用者が明示的に操作する
必要があります。復旧時には以前の証拠を保持してください。

ハーネスはエージェントのツールを制限するもので、OS のサンドボックスではありません。バリデーターは信頼する
プロジェクトコードです。意味上の捏造は、引き続き動作検証とレビュアーが検出する必要があります。
修正単位は、失敗したバリデーター 1 つ、または不合格のセクション 1 つで、複数の診断を含む場合があります。
[契約の全文](guide/guarded-workflow.md)を参照してください。

## 開発

```bash
npm test
npm run test:skills
npm run test:generated
npm run test:version
agy plugin validate .
```

`protocols/oma/` のコマンド手順を編集し、`npm run build:skills` を実行してください。
主要なスキルの手順は、各エントリーポイントの隣にある `references/` にあります。
テストは、ターン境界、シェル・パスによる迂回、所有権、失敗または欠落した検証、レビュー範囲、古い証拠、
ロック、修正上限、キャンセル、再試行上限を対象にしています。v1.1 では、資料間の矛盾、設計受領記録の
無効化、実行者のなりすまし、リプレイ、注意レベルの引き上げ、UTF-8 ログのページング、チェックポイントの
破損、再開時の資料変更も対象としています。

## 謝辞

**[@hyunuk.lim](https://www.threads.com/@hyunuk.lim) (threads) 氏に特別な感謝を捧げます。**
彼のスレッドや投稿は、小さなスキル、物理的なツール制約、正直な失敗、範囲を限定した修正、
焦点を絞ったレビューという、今回のリファクタリングの方向性を形作るうえで大きな助けになりました。

このプロジェクトは、モデル自体と同様に、それを取り巻くエンジニアリングハーネスも重要だという
Jeongkyu Shin 氏の指摘からも発展しました。

[MIT License](../LICENSE) · [Sponsor](https://github.com/sponsors/Joonghyun-Lee-Frieren)
