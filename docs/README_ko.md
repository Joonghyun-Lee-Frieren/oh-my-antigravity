# oh-my-antigravity (OmA)

[![Version](https://img.shields.io/badge/version-1.1.0-0d8a83)](history.md)
[![Checks](https://img.shields.io/github/actions/workflow/status/Joonghyun-Lee-Frieren/oh-my-antigravity/version-check.yml?branch=main&label=checks)](https://github.com/Joonghyun-Lee-Frieren/oh-my-antigravity/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](../LICENSE)

[Website](https://joonghyun-lee-frieren.github.io/oh-my-antigravity/) · [History](history.md) · [English](../README.md) · [한국어](README_ko.md) · [日本語](README_ja.md) · [Français](README_fr.md) · [中文](README_zh.md) · [Español](README_es.md)

설계 턴 분리, 읽기 전용 문서 에이전트, 편집 게이트, 실제 검증 증거, 작은 단위의 리뷰를 제공하는
엔지니어링 작업용 네이티브 **Antigravity CLI 플러그인**입니다.

<p align="center"><img src="../resources/image/oma_logo_02.png" alt="OmA" width="360"></p>

## 설치

최신 Antigravity CLI와 Node.js 20 이상이 필요합니다.

```bash
agy plugin install https://github.com/Joonghyun-Lee-Frieren/oh-my-antigravity
agy plugin list
```

CLI에서 `/plugin list`와 `/hooks`를 확인한 뒤 다음과 같이 시작합니다.

```text
/oma-team-plan 변경 사항과 인수 기준을 설명하세요
```

문서 리더가 간결한 요약을 반환합니다. Scope Brief를 작성하고 파일 범위와 검증 항목을 확정한 뒤,
독립적인 Design Check를 요청합니다. 통과하면 **설계 턴을 종료**합니다. 다음 턴에서 실행합니다.

```text
/oma-team-exec 확정된 계획을 구현하세요
```

`/oma-team-verify`로 남은 섹션 리뷰를 수집합니다. 검증이나 리뷰가 실패하면 Stop 훅이 수정 배치를
예약합니다. 서비스, 권한, 증거가 부족하면 `blocked`나 `unknown`으로 끝날 수 있습니다.
성공이라는 답변을 강요하지 않습니다.

정확한 컨트롤러 명령, JSON 예제, 복구 방법, 제약의 한계는
[보호 워크플로 가이드](guide/guarded-workflow.md)를 참고하세요.

## v1.1.0의 새로운 기능

| 기능 | 동작 |
| --- | --- |
| **Scope Brief** | 목표, 제약, 비목표, 의사결정 담당자, 자료 간 충돌을 기록합니다. 미해결 항목이 있으면 계획을 확정할 수 없습니다 |
| **Design Check** | 읽기 전용 감사자가 설계 턴 종료 전에 정확한 계획을 검토합니다. 계획이 바뀌면 이전 리뷰는 무효가 됩니다 |
| **Evidence Window** | 범위가 제한된 UTF-8 바이트 커서로 무결성이 검증된 로그 일부를 읽습니다. 전체 출력은 디스크에 남습니다 |
| **Session Trail** | 변경 불가능한 JSON/Markdown 체크포인트가 현재 의도와 다음 행동을 보존합니다. 재개 시 자료와 계획의 변경을 감지합니다 |
| **네이티브 리뷰 영수증** | 리뷰어가 다른 대화에서 직접 결과를 제출합니다. 부모 대화는 PASS를 작성하거나 리뷰를 유도할 수 없습니다 |
| **Care 프로필** | routine/elevated/critical 범위에 각각 120/90/60줄 섹션과 3/2/1개 단위의 배치를 적용하며 모든 검증과 잠금을 유지합니다 |

민감한 경로는 주의 수준을 높일 수만 있습니다. 간결한 상태·컨텍스트 묶음은 전체 로그와 영수증 티켓을
일상적인 모델 컨텍스트에서 제외합니다. 검증은 계속 실행되며 증거가 부족하면 unknown으로 남습니다.
[스키마와 예제](guide/session-continuity.md)를 참고하세요.

## 모델

추천 설정은 [config/models.json](../config/models.json)에 있으며, 2026-10-16에
[공식 모델 제공 현황](https://antigravity.google/docs/models)을 기준으로 확인했습니다.

| 역할 | Balanced 프로필 | Flash 프로필 |
| --- | --- | --- |
| 설계·계획 | `gemini-4-argon-high` | `gemini-3.8-flash-high` |
| 구현 | `gemini-3.8-flash-medium` | `gemini-3.8-flash-medium` |
| 빠른 작업 | `gemini-3.8-flash-low` | `gemini-3.8-flash-low` |
| 리뷰·검증 | `gemini-4-argon-high` | `gemini-3.8-flash-high` |

`agy models`로 계정에서 사용할 수 있는 모델을 확인하고 `agy --model <id>` 또는 런타임 선택기로
선택하세요. 서브에이전트는 `model: inherit`를 사용합니다. `/oma-model`이 프로필을 설명합니다.
`auto`는 현재 선택한 런타임 모델을 유지하며, `custom`은 네 역할을 모두 지정해야 합니다.
프로필은 추천 설정이며 모델을 자동으로 전환하지 않습니다. 네이티브 훅 계약에는 모델 재정의 출력이
없습니다. Argon을 사용할 수 없다면 Flash 프로필을 명시적으로 선택하세요.
이전 기업용 모델이 계속 제공될 수 있지만 배포 기본값에는 포함하지 않습니다.

## 워크플로와 역할

플러그인은 `/oma-<name>` 명령 진입점 49개를 포함한 짧은 스킬 60개와 기능이 제한된 에이전트 16개를
제공합니다. 현재 작업에 필요한 절차만 사용하세요.

| 명령 | 목적 |
| --- | --- |
| `/oma-team-plan`, `/oma-team-prd` | 문서 인계, 범위, 인수 기준, 설계 |
| `/oma-brief` | 목표, 제약, 의사결정 책임, 자료 간 충돌 |
| `/oma-design-check` | 확정된 정확한 계획에 대한 독립 검토 |
| `/oma-evidence` | 범위가 제한되고 무결성이 검증된 검증기 로그 조회 |
| `/oma-checkpoint`, `/oma-resume` | 변경 불가능한 인계 기록과 읽기 전용 연속성 점검 |
| `/oma-team-exec` | 다음 사용자 턴에서 확정된 범위 구현 |
| `/oma-team-verify` | 실제 검증과 섹션 하나씩의 리뷰 인계 |
| `/oma-team-fix` | Stop이 선택한 최대 3개 수정 단위 배치 |
| `/oma-goal`, `/oma-ultragoal` | 동일한 턴·증거 게이트를 적용하는 작업 완료 추적 |
| `/oma-status`, `/oma-doctor` | 단계, 소유권, 증거 부족, 잠금, 차단 요인 |
| `/oma-model` | 현재 모델 추천과 런타임 선택 |
| `/oma-hooks`, `/oma-hooks-validate` | 네이티브 훅 점검과 안전 진단 |
| `/oma-stop`, `/oma-cancel` | 증거와 잠금을 보존하며 중단 |

`oma-doc-reader`는 명세를 읽습니다. `oma-planner`와 `oma-architect`는 설계를 돕습니다.
`oma-executor`는 패치를 제안하며 소유권이 있는 메인 대화만 적용합니다.
`oma-design-auditor`는 확정된 계획을 검토합니다. `oma-reviewer`는 범위가 제한된 섹션 하나를,
`oma-verifier`는 인수 증거를 검토합니다. 배포된 모든 워커에서 쓰기, 셸, MCP, 위임 도구를 제외합니다.

워크플로의 기준 상태는 `.omg/state/guard.json`이며 실행 로그는 `.omg/evidence/`에 저장됩니다.
에이전트는 요청과 보조 메모에 `.omg/drafts/`를 사용합니다. 컨트롤러만 보호 상태, 증거,
체크포인트를 소유합니다. 훅은 실제 발신자 신원을 사용해 독립 리뷰어의 메시지를 수집합니다.
워크플로마다 작업 공간 하나와 작성자 하나만 허용합니다. 격리된 워크트리에는 별도 워크플로를 사용하세요.

## v1.0 또는 Gemini CLI에서 업그레이드

`agy plugin install`로 네이티브 플러그인을 다시 설치하세요. 새 계획에는 정리된 Scope Brief와
네이티브 Design Check가 필요합니다. 독립 역할에는 실제 자식 대화 ID를 담는 네이티브
send_message 훅이 필요합니다. 런타임이 지원하지 않으면 unknown으로 남습니다.
기존 v1.0의 확정된 상태는 레거시 영수증 경로로 완료할 수 있지만 새 계획은 항상 네이티브 경로를
사용합니다. Session Trail은 이전 소유권, 승인, 잠금을 복원하지 않고 현재 상태를 점검합니다.

네이티브 명령은 `/oma:team-exec` 대신 `/oma-team-exec`를 사용합니다.
기존 TOML 프로토콜 소스는 `protocols/oma/`에 있으며 네이티브 스킬 래퍼를 생성합니다.
중복 등록을 피하기 위해 런타임의 레거시 `commands/` 검색 디렉터리 밖에 둡니다.

`gemini-extension.json`은 마이그레이션 표식으로 남습니다. 수동으로 복사한 이전 훅은 제거하세요.
Gemini `BeforeModel` 라우터, 라우터 추적 플래그, `AfterAgent` 학습 알림은 제거되었습니다.
`/oma-learn`을 명시적으로 사용하고 CLI에서 모델을 선택하세요.

통과한 파일은 이후 워크플로에서도 잠금 상태를 유지합니다. 잠금 해제, 확정 범위 변경,
차단되었거나 다른 주체가 소유한 상태의 복구에는 보호 에이전트 밖에서 운영자가 명시적으로 조작해야 합니다.
복구할 때 이전 증거를 보존하세요.

하네스는 에이전트 도구를 제한하며 OS 샌드박스는 아닙니다. 검증기는 신뢰하는 프로젝트 코드입니다.
의미상의 조작은 여전히 동작 검증과 리뷰어가 찾아야 합니다. 수정 단위 하나는 실패한 검증기 하나 또는
통과하지 못한 섹션 하나이며 여러 진단을 포함할 수 있습니다.
[전체 계약](guide/guarded-workflow.md)을 참고하세요.

## 개발

```bash
npm test
npm run test:skills
npm run test:generated
npm run test:version
agy plugin validate .
```

`protocols/oma/`에서 명령 절차를 편집한 다음 `npm run build:skills`를 실행하세요.
핵심 스킬 절차는 각 진입점 옆의 `references/`에 있습니다.
테스트는 턴 경계, 셸·경로 우회, 소유권, 실패하거나 누락된 검증, 리뷰 범위, 오래된 증거, 잠금,
수정 한도, 취소, 재시도 한도를 다룹니다. v1.1은 자료 간 충돌, 설계 영수증 무효화, 행위자 사칭,
재전송, 주의 수준 상향, UTF-8 로그 페이징, 체크포인트 손상, 재개 시 자료 변경도 다룹니다.

## 특별히 감사드립니다

**[@hyunuk.lim](https://www.threads.com/@hyunuk.lim) (threads) 님께 특별히 감사드립니다.**
그의 스레드와 포스팅은 작은 스킬, 물리적인 도구 제약, 정직한 실패, 제한된 수정,
집중된 리뷰를 중심으로 이번 리팩토링의 방향을 잡는 데 큰 도움이 되었습니다.

이 프로젝트는 모델 자체만큼 모델을 둘러싼 엔지니어링 하네스도 중요하다는 신정규 님의 관점에서도
발전했습니다.

[MIT License](../LICENSE) · [Sponsor](https://github.com/sponsors/Joonghyun-Lee-Frieren)
