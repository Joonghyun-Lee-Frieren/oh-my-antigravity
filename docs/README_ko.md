# oh-my-antigravity (OmA)

[웹페이지](https://joonghyun-lee-frieren.github.io/oh-my-antigravity/) · [변경 이력](history.md) · [English](../README.md)

설계와 구현 턴을 분리하고, 읽기 전용 문서 에이전트와 실제 훅 제약으로 작업을 관리하는 **Antigravity CLI 플러그인**입니다.

## 설치

최신 Antigravity CLI와 Node.js 20 이상이 필요합니다.

```bash
agy plugin install https://github.com/Joonghyun-Lee-Frieren/oh-my-antigravity
agy plugin list
```

CLI 안에서 `/plugin list`, `/hooks`를 확인합니다.

```text
/oma-team-plan 변경할 내용과 검증 조건을 설계해 줘
```

문서 에이전트가 사양을 읽고 출처·제약·불확실성을 요약합니다. Scope Brief로 의도·결정권·문서 충돌을 정리하고 파일 범위와 검증 명령을 확정합니다. 독립 Design Check가 통과하면 **설계 턴을 종료합니다**. 다음 사용자 턴에 구현을 시작합니다.

```text
/oma-team-exec 확정한 계획을 구현해 줘
```

## v1.1.0 변경점

| 구성 | 동작 |
| --- | --- |
| Scope Brief | 목표·제약·비목표·결정권·출처 충돌을 기록하고 미해결 항목이 있으면 계획 확정 차단 |
| Design Check | 별도 읽기 전용 감사자가 정확한 계획 해시를 검토; 계획 변경 시 이전 결과 무효화 |
| Evidence Window | 긴 검증 로그를 최대 8192바이트씩 읽고 무결성과 다음 커서를 제공 |
| Session Trail | JSON·Markdown 체크포인트와 현재 소스 해시를 비교해 재개 시 변경 여부 확인 |
| 독립 리뷰 제출 | 리뷰어 자신의 대화에서 보낸 native 메시지만 수집; 부모의 PASS 제출·유도 메시지 차단 |
| 위험도별 한도 | routine/elevated/critical에 따라 섹션 120/90/60줄, 수정 배치 3/2/1개; 검사와 잠금은 유지 |
| 네이티브 플러그인 | plugin.json, 루트 hooks.json, rules/, YAML 스킬 |
| 최소 SKILL.md | 모든 진입점을 20줄 이내로 유지하고 자세한 절차는 references로 이동 |
| 문서 먼저 읽기 | oma-doc-reader는 읽기·검색 도구만 사용하고 600단어 이내 요약 전달 |
| 턴 분리 | 문서 인계와 설계가 끝나고 Stop이 실행되기 전에는 구현 차단 |
| PreToolUse | 범위 밖 수정, 상태·증거 조작, 셸 우회, 검증 무력화 패턴 차단 |
| 실제 검증 | 확정된 argv 명령의 종료 코드·로그·코드 해시를 컨트롤러가 기록 |
| Stop | 실패한 검증/섹션을 한 실행에 최대 3개씩 배정하고 반복 횟수 제한 |
| 통과한 코드 잠금 | 해당 파일의 검증과 모든 섹션 리뷰가 통과하면 해시 잠금 |
| 작은 리뷰 | 훅이 리뷰어에게 최대 120줄짜리 섹션 하나만 전달; 오래된 해시는 거부 |
| 정직한 실패 | 서비스·권한·증거가 없으면 blocked/unknown으로 보고; 가짜 성공 금지 |

서브에이전트 16개 모두 쓰기·셸·MCP·추가 위임 도구가 없습니다. 구현 에이전트도 패치 제안만 반환하고, 소유권을 가진 메인 대화가 실제 수정을 적용합니다. 네이티브 스킬 60개에는 기존 명령을 옮긴 `/oma-<이름>` 진입점 49개가 포함됩니다.

`/oma-brief`, `/oma-design-check`, `/oma-evidence`, `/oma-resume`가 새 진입점입니다. `/oma-checkpoint`는 실제 컨트롤러 체크포인트를 생성합니다. 민감한 경로는 선언한 위험도를 자동으로 높일 수 있으며, 어떤 프로필도 검증·독립 리뷰·잠금을 생략하지 않습니다.

[새 기능의 스키마와 예시](guide/session-continuity.md)를 참고하세요. 현재 CLI에서 자식 대화의 send_message 훅과 실제 발신자 ID를 지원해야 하며, 미지원 상태에서는 부모가 대신 PASS를 만들 수 없습니다. 기존 v1.0 확정 작업은 기존 경로로 마칠 수 있고 새 계획부터 새 제약을 사용합니다.

## 모델

2026-10-16 [공식 모델 안내](https://antigravity.google/docs/models)를 확인했습니다.

| 역할 | balanced | flash |
| --- | --- | --- |
| 설계·리뷰 | gemini-4-argon-high | gemini-3.8-flash-high |
| 구현 | gemini-3.8-flash-medium | gemini-3.8-flash-medium |
| 간단한 작업 | gemini-3.8-flash-low | gemini-3.8-flash-low |

`agy models`로 계정에서 사용 가능한 ID를 확인하고 `agy --model <id>` 또는 런타임 선택기로 설정합니다. 서브에이전트는 모델을 상속합니다. 프로필은 권장 배분이며 자동 모델 변경 기능이 아닙니다. Argon을 사용할 수 없으면 flash 프로필을 명시적으로 선택합니다. 예전 preview 모델은 기본 목록에서 제거했으며, 기업 계정의 기존 모델 제공 여부는 별개입니다.

## 운영과 업그레이드

`/oma-team-verify`로 검증·섹션 리뷰를 진행하고, `/oma-team-fix`는 Stop이 배정한 최대 3개 수정 단위만 처리합니다. `/oma-status`, `/oma-doctor`에서 상태·잠금·증거 누락을 확인합니다.

상태는 `.omg/state/guard.json`, 검증 로그는 `.omg/evidence/`, 에이전트 요청과 보조 메모는 `.omg/drafts/`에 둡니다. 상태·검증 증거는 컨트롤러만 수정합니다. 잠긴 코드 재수정, 확정 범위 변경, 차단된 작업 복구는 운영자가 증거를 보존한 뒤 명시적으로 처리해야 합니다.

Gemini CLI의 `/oma:team-exec` 대신 `/oma-team-exec`를 사용합니다. 예전 TOML 절차는 `protocols/oma/`에 보존하고 네이티브 스킬을 생성합니다. 중복 로딩을 막기 위해 런타임 `commands/` 폴더는 사용하지 않습니다. 수동 복사한 예전 훅을 제거해 주세요. BeforeModel 라우터와 AfterAgent 학습 알림은 제거했으며 학습은 `/oma-learn`으로 실행합니다.

이 제약은 도구·워크플로우 수준이며 OS 샌드박스는 아닙니다. 검증 스크립트는 신뢰하는 프로젝트 코드여야 합니다. 코드 의미상 가짜 응답은 관련 동작 검증과 리뷰가 함께 잡아야 합니다. 수정 단위 하나는 실패한 검증 또는 통과하지 못한 섹션이며 여러 진단을 포함할 수 있습니다.

[전체 프로토콜·JSON 예시·복구 안내](guide/guarded-workflow.md)를 참고하세요.

## 개발 검증

```bash
npm test
npm run test:skills
npm run test:generated
npm run test:version
agy plugin validate .
```

절차 변경 후 `npm run build:skills`로 진입점을 갱신합니다.

## Special thanks

**Special thanks to [@hyunuk.lim](https://www.threads.com/@hyunuk.lim) (threads).** 이분의 쓰레드와 포스팅 글이 이번 리팩토링에 큰 도움이 되었습니다. 작은 스킬, 도구의 물리적 제약, 정직한 실패, 제한된 수정 배치, 작은 섹션 단위 리뷰를 설계하는 데 큰 영감을 받았습니다.
