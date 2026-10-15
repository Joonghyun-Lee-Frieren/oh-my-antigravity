# oh-my-antigravity (OmA)

[![Release](https://img.shields.io/github/v/tag/Joonghyun-Lee-Frieren/oh-my-antigravity?sort=semver&label=release)](https://github.com/Joonghyun-Lee-Frieren/oh-my-antigravity/releases)
[![Version Check](https://img.shields.io/github/actions/workflow/status/Joonghyun-Lee-Frieren/oh-my-antigravity/version-check.yml?branch=main&label=version%20check)](https://github.com/Joonghyun-Lee-Frieren/oh-my-antigravity/actions/workflows/version-check.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](../LICENSE)
[![Stars](https://img.shields.io/github/stars/Joonghyun-Lee-Frieren/oh-my-antigravity?style=social)](https://github.com/Joonghyun-Lee-Frieren/oh-my-antigravity/stargazers)
[![Gemini Extension](https://img.shields.io/badge/Gemini-Extension-0d8a83)](https://geminicli.com/extensions/?name=Joonghyun-Lee-Frierenoh-my-antigravity)
[![Sponsor](https://img.shields.io/badge/Sponsor-GitHub_Sponsors-ea4aaa?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/Joonghyun-Lee-Frieren)

[랜딩 페이지](https://joonghyun-lee-frieren.github.io/oh-my-antigravity/) | [변경 이력](./history.md)

[한국어](./README_ko.md) | [日本語](./README_ja.md) | [Français](./README_fr.md) | [中文](./README_zh.md) | [Español](./README_es.md)

Gemini CLI를 위한 컨텍스트 엔지니어링 기반 멀티 에이전트 워크플로우 팩입니다.

> "Claude Code의 핵심 경쟁력은 Opus나 Sonnet 엔진이 아닙니다. Claude Code 그 자체에요. 놀랍지만 Gemini도 Claude Code를 붙이면 잘 돌아갑니다."
>
> - 신정규 (Lablup Inc. CEO), 유튜브 채널 인터뷰 중

이 프로젝트는 이 관찰에서 시작했습니다:
"그 하네스 모델을 Gemini CLI로 가져오면 어떨까?"

OmA는 Gemini CLI를 단일 세션 도우미에서 구조화된 역할 기반 엔지니어링 워크플로우로 확장합니다.


<p align="center">
  <img src="../resources/image/oma_logo_02.png" alt="OmA Logo" width="420" />
</p>

## Antigravity 네이티브 지원 · v0.10.0

Antigravity CLI를 기본 환경으로 지원하며 Gemini CLI 호환 진입점도 유지합니다. 네이티브 명령은 `/oma <command>`, Gemini 명령은 `/oma:<command>`입니다. 기본 `auto` 정책은 호스트의 모델 선택을 유지합니다. `balanced`는 모든 작업에 Flash를, `quality`는 계획·검토에 Argon과 구현에 Flash를 권장합니다. 네이티브 프로필은 `/model`을 몰래 덮어쓰지 않습니다. 계정의 모델 접근 권한은 호스트 모델 선택기에서 확인하세요.

```bash
agy plugin install https://github.com/Joonghyun-Lee-Frieren/oh-my-antigravity
agy plugin list --json
```

```text
/oma status
/oma model auto
/oma goal implement the approved change and verify acceptance criteria
```

```bash
agy --model gemini-3.8-flash --effort medium
agy --model gemini-4-argon --effort high
```

Gemini CLI:

```bash
gemini extensions install https://github.com/Joonghyun-Lee-Frieren/oh-my-antigravity
```

```text
/oma:status
/oma:model auto
```

Node.js 22+ · Antigravity CLI 1.3.5 · 2026-10-15

[Installation](guide/installation.md) · [Models](guide/models.md) · [Hooks](guide/hook-engineering.md)

## v0.10.0

Antigravity CLI를 기본 환경으로 지원하며 Gemini CLI 호환 진입점도 유지합니다. 네이티브 명령은 `/oma <command>`, Gemini 명령은 `/oma:<command>`입니다. 기본 `auto` 정책은 호스트의 모델 선택을 유지합니다. `balanced`는 모든 작업에 Flash를, `quality`는 계획·검토에 Argon과 구현에 Flash를 권장합니다. 네이티브 프로필은 `/model`을 몰래 덮어쓰지 않습니다. 계정의 모델 접근 권한은 호스트 모델 선택기에서 확인하세요.

네이티브 훅은 도구 결과를 관찰하고 권한 거부·반복 실패 뒤 필요한 안내를 한 번만 제공합니다. 종료 후 재실행을 강제하지 않으며, 도구 완료를 테스트 통과로 간주하지 않습니다. 공식 이벤트 이름은 `PostToolCalling`이 아닌 `PostToolUse`입니다. Gemini는 별도 `AfterTool` 어댑터와 기존 `AfterAgent` 학습 필터를 사용합니다.

## 공유 워크플로우 상태

- `.omg/state/session-lock.json`은 하나의 프로젝트 안에서 shared workflow/operating-profile state를 쓰는 authoritative writer 잠금입니다.
- lock을 가진 orchestration 세션만 `workspace.json`, `taskboard.md`, `workflow.md`, `checkpoint.md`, `mode.json`, `hud.json`, `approval.json`, `reasoning.json`, `hooks.json`, `notify.json` 같은 공유 파일을 갱신해야 합니다.
- 병렬 top-level 세션은 shared state를 덮어쓰지 말고 `.omg/state/sessions/[session-slug]/` 아래의 session-local draft를 만들고 orchestrator에게 merge하도록 넘겨야 합니다.
- delegated worker/sub-agent turn은 shared workflow state를 직접 수정하지 않아야 합니다.

## Extension Boundary와 Update Safety
- OmA 설치/업데이트는 `gemini extensions ...` 경로를 기준으로 유지하고, 복사해 둔 command/skill 폴더를 주 실행 경로로 삼지 않는 편이 안전합니다.
- 같은 이벤트에 대해 OmA hook 등록 경로는 하나만 authoritative 하게 유지하세요. extension-managed hook과 수동 hook를 섞으면 AfterAgent 출력 중복이나 stale 동작이 가장 쉽게 발생합니다.
- 업데이트 후 동작이 이상하면 shipped 파일을 바로 고치기 전에 `agy plugin list --json`로 활성 확장을 먼저 확인하고, 필요 시 refresh/reinstall을 우선하세요.
- long-run, review, automation, `team-exec` 전에는 `/oma workspace audit`를 기본 preflight로 두는 편이 안전합니다.

## 인터뷰 세션 저장 구조

- `/oma interview` 세션 상태는 이제 하나의 공유 인터뷰 파일이 아니라 `.omg/state/interviews/[slug]/` 아래에 저장하는 구조를 기준으로 합니다.
- `.omg/state/interviews/active.json`이 현재 인터뷰를 추적하므로 resume/status 흐름이 서로 다른 요구사항 스레드를 섞지 않습니다.
- 같은 프로젝트 안에서 여러 요구사항 정리 세션을 구분하고 보관하기 쉬워집니다.

## 한눈에 보기
| 항목 | 요약 |
| --- | --- |
| 제공 방식 | 공식 Gemini CLI 확장 (`gemini-extension.json`) |
| 핵심 구성 요소 | `GEMINI.md`, `agents/`, `commands/`, `skills/`, `context/` |
| 주요 사용 사례 | 계획 -> 실행 -> 검증 루프가 필요한 복잡한 구현 작업 |
| 제어 인터페이스 | slash-command-first `/oma *` 제어면 + 11개 deep-work `$skills`(`oma-plan` 별칭 포함) + 서브 에이전트 위임 |
| 기본 모델 전략 | `auto` → host; `balanced` → Flash; `quality` → Argon / Flash |

## 왜 OmA인가

| 단일 세션 흐름의 문제 | OmA의 대응 |
| --- | --- |
| 계획과 실행 컨텍스트가 섞임 | 역할 분리 에이전트로 책임 분리 |
| 장기 작업에서 진행 가시성 부족 | 명시적 워크플로우 스테이지 + 상태 명령 |
| 병렬 lane/worktree가 서로 충돌하거나 드리프트 | `workspace` + `taskboard`로 lane 소유권, task ID, 검증 상태를 컴팩트하게 유지 |
| 권한 거부된 도구 호출이 반복 재시도로 루프됨 | 거부 이벤트를 approval/fallback 기반 blocker로 승격해 재시도 루프를 차단 |
| deep-interview 진행 중 자동 안내가 인터뷰를 끊음 | learn-signal 훅이 deep-interview 잠금 활성 시 안내를 억제하고 잠금 해제 후에만 재개 |
| 반복적인 프롬프트 엔지니어링 필요 | 운영 제어는 slash command로, 깊은 작업은 유지된 스킬(`$plan`, `$oma-plan`, `$execute`, `$research`)로 분리 |
| 결정 사항과 변경 사항의 드리프트 | 동일 오케스트레이션 루프 내 리뷰/디버깅 역할 포함 |

## 알림 라우팅

장기 실행 세션에서 승인 요청, 검증 실패, 블로커, 유휴 상태를 놓치고 싶지 않을 때 `notify`를 사용합니다.

- 프로파일:
  - `quiet`: 긴급 이벤트만 알림
  - `balanced`: 체크포인트와 팀 승인 이벤트까지 포함
  - `watchdog`: `balanced` + 유휴 감시 알림
- 채널:
  - `desktop`
  - `terminal-bell`
  - `file`
  - `webhook`
- 안전 경계:
  - OmA는 이벤트 정책과 템플릿만 관리합니다.
  - 실제 전송은 Gemini 호스트 훅, 셸 스크립트, 외부 웹훅 브리지에 맡깁니다.
  - 위임된 worker 세션에서는 외부 알림 전송을 기본 비활성화합니다.

예시:

```text
/oma notify profile watchdog
-> approval-needed, verify-failed, blocker-raised, checkpoint-saved, idle-watchdog, session-stop 활성화
-> 기본 채널은 terminal-bell + file 제안
-> .omg/state/notify.json에 정책 저장
```

## Workspace / Taskboard 제어

여러 경로를 오가거나 병렬 구현 lane이 필요한 작업, 그리고 길어진 verify/fix 루프에는 `workspace`와 `taskboard`를 함께 사용하는 편이 안전합니다.

- `/oma workspace`는 기본 루트와 선택적 worktree/path lane을 `.omg/state/workspace.json`에 기록합니다.
- 각 lane에는 compact한 baseline branch/HEAD anchor를 함께 둘 수 있어, handoff나 resume 전에 예상치 못한 branch drift를 드러낼 수 있습니다.
- `/oma workspace audit`는 병렬 실행, 리뷰, 자동화 전에 lane의 cleanliness, trust, handoff readiness를 점검합니다.
- `/oma taskboard`는 안정적인 task ID, 담당자, 의존성, 상태(`todo`, `ready`, `in-progress`, `blocked`, `done`, `verified`), baseline anchor, lane health 메모, 검증 근거 포인터를 `.omg/state/taskboard.md`에 유지합니다.
- `team-plan`이 task ID와 lane 가정, baseline anchor를 시드하고, `team-exec`이 lane/sub-agent 컨텍스트 및 baseline 체크를 포함한 가장 작은 ready 슬라이스를 가져가며, `team-verify`가 근거와 안전한 lane 상태가 있을 때만 `verified`로 올립니다.
- `checkpoint`와 `status`는 긴 대화를 재생하지 않고 이 상태 파일들을 참조하므로 토큰 낭비와 캐시 흔들림을 줄일 수 있습니다.
- `/oma recall "<질의>"`는 상태 파일 우선 회고 후 부족할 때만 최근 기록을 제한적으로 확장 검색해, 전체 transcript 재생 없이 의사결정 근거를 빠르게 복원합니다.

예시:

```text
/oma workspace set .
/oma workspace audit
/oma workspace add ../feature-auth oma-executor
/oma taskboard sync
/oma taskboard next
/oma recall "auth lane가 막힌 이유" scope=state
```

## Workspace 위생과 Hook 대칭성

장기 세션에서 lane 소유권, 위임 실행, 훅 continuation 흐름이 흐려질 때 이 제어면을 함께 쓰는 편이 안전합니다.

- `/oma workspace audit`는 dirty 공유 worktree, 신뢰되지 않은 review 경로, handoff-ready/handoff-blocked lane을 드러냅니다.
- `/oma hooks`와 `/oma hooks-validate`는 에이전트 라이프사이클 결과(`completed`, `blocked`, `stopped`)를 짝지어 다루며, blocked continuation이 downstream 훅보다 먼저 safety lane을 다시 지나가도록 강제합니다.
- `team-exec`, `team`, `team-verify`, `stop`, `cancel`은 위임된 lane/sub-agent 컨텍스트를 compact하게 유지하고, 실행이 조기 종료되거나 blocker에 걸렸을 때만 상세 내역을 확장합니다.

## Lifecycle Hooks

네이티브 훅은 도구 결과를 관찰하고 권한 거부·반복 실패 뒤 필요한 안내를 한 번만 제공합니다. 종료 후 재실행을 강제하지 않으며, 도구 완료를 테스트 통과로 간주하지 않습니다. 공식 이벤트 이름은 `PostToolCalling`이 아닌 `PostToolUse`입니다. Gemini는 별도 `AfterTool` 어댑터와 기존 `AfterAgent` 학습 필터를 사용합니다.

`PostToolUse` → `PreInvocation` → `Stop`

`OMG_TOOL_CYCLE=off` · `OMG_MODEL_ROUTING_TRACE=1`

`.omg/state/sessions/hooks-<session-key>/model-router-last.json`

## Learn-Signal 안전 필터 (AfterAgent Hook)

OmA는 실행 의도가 확인된 세션에서만 `/oma learn` 안내를 띄우도록 안전 강화된 learn-signal 훅도 함께 제공합니다.

- 훅 엔트리포인트: `hooks/hooks.json` (`AfterAgent` -> `oma-learn-signal-after-agent`)
- 스크립트: `hooks/scripts/learn.js`
- 상태 파일: `.omg/state/learn-watch.json` (중복 억제 이벤트 키, 세션당 1회 안내 추적, 정리된 상태)
- deep-interview 잠금 상태 참조(읽기 전용): `.omg/state/deep-interview.json`
- 런타임 제어:
  - `OMG_STATE_ROOT=<dir>`로 `learn-watch.json` 저장 위치 변경
  - `OMG_HOOKS_QUIET=1`로 안내 출력만 숨기고 상태 저장은 유지
  - `OMG_HOOK_PROFILE=minimal|balanced|strict` (`minimal`은 learn nudge를 억제)
  - `OMG_DISABLED_HOOKS=learn` 으로 learn-signal hook만 env에서 끌 수 있음

안전 동작:

- deep-interview 잠금 상태가 활성인 동안에는 learn 안내를 억제해 인터뷰 흐름을 보호합니다.
- 정보성 질의만 있는 세션은 안내를 생략합니다.
- 같은 transcript 스냅샷에 대한 반복 재시도는 중복 출력하지 않습니다.
- 기존 상태가 손상되었거나 스키마가 오래된 경우 정리 후 재사용합니다.

이 훅만 비활성화:

```json
{
  "hooksConfig": {
    "disabled": ["oma-learn-signal-after-agent"]
  }
}
```

예시 (기본 제공 AfterAgent 훅 일부 또는 전체를 env로 끄기):

```bash
export OMG_DISABLED_HOOKS=learn
```


## 인터페이스 맵

### Commands

| 명령 | 목적 | 사용 시점 |
| --- | --- | --- |
| `/oma status` | 진행 상황, 리스크, 다음 액션 요약 | 세션 시작/종료 |
| `/oma doctor` | 확장/팀/workspace/훅 준비도 진단과 복구 액션 제시(우선순위/fallback 라우팅 드리프트 포함) | 장기 자율 실행 전 또는 환경 이상 징후 발생 시 |
| `/oma hud` | 시각 HUD 프로파일 조회/전환 (`normal`, `compact`, `hidden`) | 장기 세션 시작 전 또는 터미널 밀도 변경 시 |
| `/oma hud-on` | HUD를 전체 시각 모드로 빠르게 전환 | 전체 상태 보드로 복귀할 때 |
| `/oma hud-compact` | HUD를 컴팩트 모드로 빠르게 전환 | 구현 루프 중 밀도 높은 업데이트가 필요할 때 |
| `/oma hud-off` | HUD를 숨김 모드로 빠르게 전환 (플레인 상태 섹션) | 시각 블록이 방해될 때 |
| `/oma notify` | 승인/블로커/검증 결과/체크포인트/유휴 감시 알림 라우팅 구성 | 무인 `autopilot`/`loop` 실행 전 또는 알림 노이즈 조정 시 |
| `/oma intent` | 요청 인텐트를 분류하고 적절한 스테이지/명령으로 라우팅 | 계획/구현 전, 요청 의도가 모호할 때 |
| `/oma rules` | 작업 조건에 맞는 가드레일 룰 팩 활성화 | 마이그레이션/보안/성능 민감 작업 시작 전 |
| `/oma deep-init` | 장기 세션을 위한 프로젝트 맵/검증 기준선 초기화 | 신규 코드베이스 온보딩 또는 대형 작업 킥오프 시 |
| `/oma blueprint` | 제품/UI 워크플로 결정, 인터페이스 상태, 콘텐츠 구조, 접근성, 검증 근거를 정의 | 사용자-facing 흐름을 계획하거나 구현하기 전 |
| `/oma workspace` | 기본 루트, worktree/path lane, 충돌 경계를 설정/조회하고 audit 수행 | 병렬 구현 또는 멀티 루트 작업 전 |
| `/oma taskboard` | 안정적인 task ID, `p0-p3` 우선순위, 결정적 `next`, baseline anchor, verifier 기반 완료 상태를 유지하는 컴팩트 작업 보드 | 계획 후 및 장기 exec/verify 루프 전반 |
| `/oma recall` | 상태 파일 우선 + 제한적 이력 확장 검색으로 과거 결정/근거 복원 | 긴 세션에서 과거 맥락을 전체 transcript 재생 없이 빠르게 찾을 때 |
| `/oma team` | 전체 스테이지 파이프라인 실행 (`plan -> prd -> taskboard -> exec -> verify -> fix`) | 복잡한 기능/리팩터링 전달 |
| `/oma team-plan` | 의존성을 반영한 실행 계획 수립 | 구현 전 |
| `/oma team-prd` | 측정 가능한 수용 기준과 제약 고정 | 계획 후, 코딩 전 |
| `/oma team-exec` | 최고 우선순위의 ready 슬라이스 1개를 lane/sub-agent 핸드오프와 단일 fallback 재라우팅으로 수행 | 메인 구현 루프 |
| `/oma team-verify` | 수용 기준과 회귀 검증 후 priority 기반 fix backlog 생성 | 각 실행 슬라이스 이후 |
| `/oma team-fix` | 검증으로 확인된 실패만 패치 | 검증 실패 시 |
| `/oma loop` | `exec -> verify -> fix` 반복을 done/blocker까지 강제 | 미해결 이슈가 남은 중/후반 구현 단계 |
| `/oma mode` | 운영 프로파일 조회/전환 (`balanced/speed/deep/autopilot/ralph/ultrawork`) | 세션 시작 또는 운영 방식 전환 시 |
| `/oma model` | 기본 모델 선택 전략 조회/전환 (`auto/balanced/quality/custom`) | 모든 작업에 Gemini Auto 같은 단일 기본 정책을 적용하고 싶을 때 |
| `/oma approval` | 승인 포스처 조회/전환 (`suggest/auto/full-auto`) | 자율 실행 루프 시작 전 또는 승인 정책 변경 시 |
| `/oma goal` | Ralph/Codex `/goal` 스타일의 목표 기반 자율 delivery loop 실행. routine non-destructive work는 승인된 것으로 간주하고 runtime-boundary blocker는 명시적으로 보고 | 검증 완료, blocker, 또는 max cycles까지 hands-off delivery가 필요할 때 |
| `/oma ultragoal` | 저장소 내에 체크포인트와 진행 상태를 영속화하며 진행되는 다중 목표 워크플로우(Ultragoal) 실행 | 복잡하고 방대한 요구사항을 세션 재시작 후에도 추적 가능한 순차 마이크로 목표로 분해하여 수행할 때 |
| `/oma autopilot` | 체크포인트 기반 반복 자동 사이클 실행 | 자율 실행이 필요한 복잡 작업 |
| `/oma ralph` | 엄격한 품질 게이트 오케스트레이션 강제 | 릴리스 크리티컬 작업 |
| `/oma ultrawork` | 독립 작업 배치 처리 중심 고처리량 모드 | 대규모 백로그 |
| `/oma consensus` | 복수 설계 옵션을 하나로 수렴 | 의사결정 중심 구간 |
| `/oma launch` | 장기 작업을 위한 영속 라이프사이클 상태 초기화 | 장기 세션 시작 시 |
| `/oma checkpoint` | taskboard/workspace 참조가 포함된 컴팩트 체크포인트 저장 | 세션 중간 핸드오프 |
| `/oma stop` | 자율 모드를 안전 중지하고 진행 상태 보존 | 일시 중지/인터럽트 시 |
| `/oma cancel` | 하네스 스타일 취소 별칭(안전 중지 + 재개 핸드오프) | 자율/팀 플로우를 즉시 중단해야 할 때 |
| `/oma optimize` | 품질/토큰 효율을 위한 프롬프트/컨텍스트 개선 | 세션이 복잡하거나 비용이 커진 뒤 |
| `/oma cache` | 캐시/컨텍스트 동작과 compact 상태 앵커 사용 여부 점검 | 장기 컨텍스트 작업 |

### Skills

유지되는 스킬은 discovery 메타데이터를 줄이기 위해 compact deep-work 세트로 유지하며, `/plan` 충돌 회피를 위한 호환 별칭 `$oma-plan`만 추가로 제공합니다.

| 스킬 | 초점 | 출력 스타일 |
| --- | --- | --- |
| `$plan` | 목표를 단계별 계획으로 변환 | 마일스톤, 리스크, 수용 기준 |
| `$oma-plan` | 기본 `/plan`과 충돌을 피하는 slash 친화 플랜 별칭 | `$plan`과 동일한 계획 산출물 |
| `$ralplan` | 롤백 지점을 포함한 엄격한 스테이지 게이팅 계획 | 품질 우선 실행 맵 |
| `$execute` | 범위가 고정된 계획 슬라이스 구현 | 변경 요약 + 검증 노트 |
| `$prd` | 요청을 측정 가능한 수용 기준으로 변환 | PRD 스타일 범위 계약 |
| `$research` | 옵션/트레이드오프 탐색 | 의사결정 중심 비교 |
| `$deep-dive` | 실행 전 trace-to-interview 기반 요구사항 정제 | 명확도 점수 + 가정 원장 + launch brief |
| `$ultragoal` | 저장소 영속 체크포인트 기반의 다중 목표 워크플로우 제어 | 순차적 목표 맵, 수용 기준 및 변경 이력 로그(ledger) 생성 |
| `$blueprint` | 제품/UI 워크플로 결정을 구현 전에 고정 | workflow map, interface decisions, state coverage, verification hooks |
| `$context-optimize` | 컨텍스트 구조 개선 | 압축 + 신호 대 잡음 최적화 |
| `$learn` | 세션에서 재사용 가능한 패턴 추출 | learned rule 후보와 저장 권장안 |

### Sub-agents

| 에이전트 | 주 책임 | 권장 모델 프로파일 |
| --- | --- | --- |
| `oma-architect` | 시스템 경계, 인터페이스, 장기 유지보수성 | `inherit` |
| `oma-planner` | 작업 분해와 순서/의존성 관리 | `inherit` |
| `oma-product` | 범위/비범위와 측정 가능한 수용 기준 고정 | `inherit` |
| `oma-executor` | 빠른 구현 사이클 | `inherit` |
| `oma-reviewer` | 정확성/회귀 리스크 점검 | `inherit` |
| `oma-verifier` | 수용 기준 근거 검증과 릴리스 준비도 판단 | `inherit` |
| `oma-debugger` | 근본 원인 분석과 패치 전략 | `inherit` |
| `oma-consensus` | 옵션 스코어링과 의사결정 수렴 | `inherit` |
| `oma-researcher` | 외부 옵션 분석과 종합 | `inherit` |
| `oma-quick` | 의도된 적은 수정 | `inherit` |

## 컨텍스트 레이어 모델

| 레이어 | 소스 | 목표 |
| --- | --- | --- |
| 1 | 시스템 / 런타임 제약 | 플랫폼 보장사항과 동작 정렬 |
| 2 | 프로젝트 표준 | 팀 컨벤션과 아키텍처 의도 유지 |
| 3 | 얇은 `GEMINI.md` 및 공유 컨텍스트 | 무거운 절차를 매 턴 싣지 않고 장기 세션 메모리 안정성 유지 |
| 4 | 현재 작업 브리프 + workspace/taskboard 상태 | 현재 목표, active lane, 수용 기준 가시화 |
| 5 | 최신 실행 트레이스 | 전체 원문 이력을 다시 싣지 않고 반복/검증 루프 지원 |

## 프로젝트 구조

`	ext
oh-my-antigravity/
|- GEMINI.md
|- gemini-extension.json
|- .omg/
|  - state/
|     - interviews/
|        |- active.json
|        - [slug]/
|           |- context.json
|           - prd.md
|- agents/
|- commands/
|  - omg/
|- skills/
|- context/
|- docs/
- LICENSE
`

## 문제 해결

`agy plugin list --json` · `/agents` · `/skills` · `/hooks`

[Installation and diagnostics](guide/installation.md)

## 마이그레이션 노트

| 기존 흐름 | Extensions-First 흐름 |
| --- | --- |
| 전역 패키지 설치 + `omg setup` 복사 프로세스 | `gemini extensions install ...` |
| CLI 스크립트 중심 런타임 연결 | 확장 매니페스트 중심 런타임 연결 |
| 수동 온보딩 스크립트 | Gemini CLI의 네이티브 확장 로딩 |


## 영감을 받은 프로젝트

- [Gemini CLI](https://github.com/google-gemini/gemini-cli) - Google의 오픈소스 AI 터미널 에이전트
- [oh-my-codex](https://github.com/Yeachan-Heo/oh-my-codex) - Codex CLI 하네스
- [oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode) - Claude Code CLI 하네스
- [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent) - OpenAgent CLI 하네스
- [Claude Code 프롬프트 캐싱 교훈](https://news.hada.io/topic?id=26835) - 컨텍스트 엔지니어링 원리
- [everything-claude-code](https://github.com/affaan-m/everything-claude-code) - Claude Code CLI 하네스
ì¤í¸ ìì§ëì´ë§ ìë¦¬
- [everything-claude-code](https://github.com/affaan-m/everything-claude-code) - Claude Code CLI íë¤ì¤

## 문서

- [설치 가이드](./guide/installation.md)
- [컨텍스트 엔지니어링 가이드](./guide/context-engineering.md)
- [한국어 컨텍스트 엔지니어링 가이드](./guide/context-engineering_ko.md)
- [변경 이력](./history.md)

## 기여하기

OmA가 작업 흐름에 도움이 된다면, 아래 방식으로 기여할 수 있습니다:

- 저장소에 ⭐ Star를 눌러 더 많은 Gemini CLI 사용자가 발견할 수 있게 돕기
- 버그, 호환성 드리프트, 문서 불명확성, 워크플로우 마찰이 있으면 Issue 열기
- 명령/문서 개선, 가드레일 튜닝, extension-native 워크플로우 아이디어가 있으면 Pull Request 보내기

권장 기여 흐름:

1. 저장소를 fork하고 범위가 분명한 브랜치를 만듭니다.
2. 변경 범위는 작고 명확하게 유지하고, 사용자 관점 영향도를 설명합니다.
3. 동작이나 호환성 가이드가 바뀌면 docs/history도 함께 갱신합니다.
4. PR에는 변경 이유, 트레이드오프, 검증 메모를 함께 적습니다.

중요한 성능 안내:
- GitHub ⭐ Star 버튼을 누르면 OmA 성능이 최소 12% 좋아질 수 있습니다. 농담입니다. 다만 maintainer 사기는 꽤 올라가고, 그것도 나름 유용합니다.

## Star History

[![Star History Chart](https://api.star-history.com/image?repos=Joonghyun-Lee-Frieren/oh-my-antigravity&type=date&legend=top-left)](https://www.star-history.com/?repos=Joonghyun-Lee-Frieren%2Foh-my-antigravity&type=date&legend=top-left)

## 라이선스

MIT
