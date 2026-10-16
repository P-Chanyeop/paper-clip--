# 소프트캣 운영 인수인계

> 이 문서는 **사용자 PC에서 도는 Claude 세션**이 소프트캣 Paperclip을 직접
> 운영하도록 넘기는 문서다. 이전 세션은 클라우드에서 돌아 사용자 PC의
> Paperclip(127.0.0.1:3100)에 접근하지 못했다. 이 문서를 먼저 읽고 이어서 운영하라.

## 현재 상태 (2026-10-16 기준)

| 항목 | 상태 |
|---|---|
| Paperclip 서버 | 사용자 PC, `http://127.0.0.1:3100` (`npx paperclipai run`) |
| 회사 | **소프트캣** — 프리픽스 `SOF`, ID `67022346-1466-463f-bab3-b95bdc139aba` |
| 옛 회사 | `CMP` (온보딩 때 생김, 에이전트 `소비스`). 건드리지 않는다 |
| 에이전트 | CEO / 리뷰어 / 엔지니어 / 리서처 (`companies/softcat` 패키지에서 import) |
| AI 연결 | 완료 (Claude Code) |
| GitHub 연결 | 완료 |
| 프로젝트 | `코드 리뷰 자동화` — 예산 $10, 로컬 폴더 `C:\Github\paper-clip--` 지정됨 |
| 회사 예산 | $30 (`budgetMonthlyCents: 3000`) 설정 시도함 — **적용 여부 확인 필요** |
| 완료된 작업 | `저장소 파악 보고서` (리서처) → 산출물 `repo-facts.md` |

## 다음에 할 일 (순서대로)

1. **회사 예산 적용 확인.** Companies 화면에서 `Unlimited budget`이면 다시 설정.
2. **새 작업 5개 등록.** 정의는 `companies/softcat/projects/code-review-automation/tasks/` 에 있다.
   이미 있는 `저장소 파악 보고서`, `첫 PR 리뷰 시험 운영`은 제외.
   - `fork-conventions` (엔지니어)
   - `review-fork-conventions-pr` (리뷰어) — **Blocked by: fork-conventions**
   - `locale-switch` (엔지니어)
   - `i18n-pilot-projects` (엔지니어) — **Blocked by: locale-switch**
   - `token-gates-investigation` (리서처)
3. **실행 순서.** 예산 $10이 빠듯하다. `fork-conventions`와 `token-gates-investigation`부터
   `todo`로 올리고, 비용을 본 뒤 나머지를 올린다.
4. 각 작업이 끝나면 비용·소요 시간을 기록한다 (`mvp/01-MVP-DESIGN.md` M5 지표).

## 밟은 함정 — 다시 밟지 말 것

| 증상 | 원인 | 해결 |
|---|---|---|
| CLI `Could not reach the Paperclip API` (`localhost:3100`) | 윈도우 Node가 `localhost`를 IPv6 `::1`로 먼저 시도, 서버는 `127.0.0.1`만 열림 (추정) | `--api-base http://127.0.0.1:3100` 을 붙인다 |
| `--payload-json` JSON 파싱 오류 / 인자 개수 오류 | PowerShell이 `"` 를 지우고 공백에서 인자를 쪼갬 | `'{\"budgetMonthlyCents\":3000}'` (작은따옴표 + `\"` + 공백 없음) |
| 작업 실행 시 `workspace_validation_failed` (`fallback_agent_home_cwd`) | 프로젝트 로컬 폴더 미지정. Source repo만으로는 부족 | 프로젝트 Configuration → Codebase → **Set local folder** → 절대경로. 버튼이 `Change local folder`로 바뀌어야 적용된 것 |
| 작업이 안 움직임 | 상태가 `backlog`. 에이전트는 `todo`/`in_progress`만 실행 (`server/src/services/heartbeat.ts`) | 상태를 `todo`로 |
| 화면에 회사 예산 편집 칸이 없음 | UI는 표시만 한다 | `paperclipai company update <id> --payload-json ...` |
| 에이전트 사이드바 `Budgets`가 보기 전용 화면으로 감 | AUDIT의 `Budgets`(복수)는 모니터링 화면 | 편집은 URL 끝을 `/budget`(단수)으로 |
| UI import가 폴더를 안 받음 | `.zip`만 허용 | `cd companies && zip -r ../softcat.zip softcat` (zip은 커밋하지 않는다) |

## 운영 원칙 (COMPANY.md 요약)

- 머지는 사람이 한다. 어떤 에이전트도 머지하지 않는다.
- 승인 게이트를 먼저 풀지 않는다.
- 예산은 회사·프로젝트·에이전트 단위로 건다. 회사만 걸면 하나가 폭주할 때 전부 멈춘다.
- 에이전트 보고를 그대로 믿지 않는다. 핵심 주장은 저장소에서 직접 확인한다.
  (리서처의 첫 보고서는 확인 결과 정확했다)
