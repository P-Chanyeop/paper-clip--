# Paperclip 업스트림 분석 (2026-10-16 기준)

> 분석 대상: `paperclipai/paperclip` @ `185483e09`
> 포크 위치: `P-Chanyeop/paper-clip--` / 브랜치 `claude/confident-dijkstra-lyuo32`
> upstream remote 등록 완료 → `git fetch upstream` 으로 상시 동기화 가능

## 1. 무엇인가

AI 에이전트 "팀"을 **회사처럼** 운영하는 오픈소스 컨트롤 플레인.
에이전트 런타임이 아니라 **그 위의 경영 레이어**다.

- 라이선스: MIT (Paperclip Labs, Inc.)
- 규모: 약 102k 스타, 5,302 커밋, 브랜치 1,198 / 태그 2,068 — **매우 빠르게 움직이는 프로젝트**
- 스택: Node.js(≥24.11) + React 19 + TypeScript + pnpm 모노레포 + Drizzle/PostgreSQL(임베디드 기본) + Vitest/Playwright

```
server/    52M   API·오케스트레이션·과금원장·거버넌스
ui/        34M   React 19 + Tailwind v4 + shadcn (1,208개 .tsx)
cli/      2.1M   npx paperclipai onboard
packages/  50M   db / shared / 어댑터 12종 / 플러그인 SDK / MCP 서버
docs/      11M   Mintlify 문서
```

## 2. 핵심 개념 (MVP 설계의 전제)

| 개념 | 의미 |
|---|---|
| **Company** | 멀티테넌트 단위. 한 배포에 여러 회사 격리 수용 |
| **Agent** | "직원". 모델·하네스를 각각 선택. 어댑터로 연결 |
| **Org Chart** | 사람 + 에이전트 혼합 조직도. 권한·위임·보고라인 |
| **Goal → Project → Task** | 목표 정렬. 에이전트가 작업의 상위 맥락을 받음 |
| **Heartbeat** | 에이전트를 깨우는 신호. 할당·후속메시지·스케줄 |
| **Budget** | 회사/에이전트/프로젝트 3단계 예산. 임계 알림 + 자동 정지 |
| **Governance** | 승인 게이트, 리뷰 단계, 감사 로그, 비밀정보 스코프 |
| **Skill** | 재사용 절차. Skill Studio에서 작성·평가·버전관리 |

지원 어댑터 (`packages/adapters/`): `claude-local`, `codex-local`, `cursor-local`,
`cursor-cloud`, `gemini-local`, `grok-local`, `hermes`, `hermes-gateway`,
`kimi-local`, `openclaw-gateway`, `opencode-local`, `pi-local`

## 3. 결정적 발견 — 우리가 비집고 들어갈 틈

### 3-1. 한국어화가 사실상 **0%** ⬅ 가장 큰 기회

```
ui/src/i18n/locales/  → 39개 언어 파일 존재 (ko.json 포함)
ko.json               → 185 bytes, 번역 키 5개
en.json               → 199 bytes, 번역 키 5개
useTranslation 실사용  → ui/src/App.tsx 단 1개 파일
전체 .tsx             → 1,208개
```

i18n **배선만 깔려 있고 내용물이 없다.** UI 문자열이 전부 컴포넌트에 하드코딩된
영문이다. 즉 한국 중소기업이 쓸 수 있는 상태가 아니다.
→ 국내 B2B 진입에서 이건 장벽이자 동시에 **방어 가능한 차별점**이다.

### 3-2. 고객 과금(결제) 레이어가 **없음**

```
있음: costs.ts, budgets.ts, billing-reconciliation.ts, anthropic-pricing.ts,
      provider-billing-import.ts, cost-events 원장, 인보이스 임포트
없음: Stripe / 토스페이먼츠 / 아임포트 / PortOne / Paddle — 의존성 0건
```

구현된 과금은 **"우리가 AI 공급자에게 내는 비용"의 원장**이다.
**"고객이 우리에게 내는 구독료"**는 전혀 없다.
→ SaaS로 재판매하려면 이 레이어는 우리가 만들어야 한다. (= 우리 IP)

### 3-3. 업스트림은 자체 Cloud로 수익화 예정

README에 `Paperclip Cloud 웨이팅리스트` 링크. ROADMAP의 `Cloud deployments`는
🟡(멀티테넌트 격리·회사 Import/Export 완료). 즉 **호스팅 단순 재판매로 글로벌에서
정면 경쟁하면 진다.** 로컬라이징·국내 규제·국내 연동·도메인 특화가 우리 자리다.

### 3-4. ROADMAP이 거의 다 ✅

플러그인, 스킬 스토어, 예산, 승인, 샌드박스, MCP 게이트웨이, 비밀관리,
멀티휴먼, 아티팩트, 딥플래닝 전부 완료. 남은 ⚪는 MAXIMIZER MODE, Work Queues,
Self-Organization, 자동 조직학습, 데스크톱 앱, 티켓시스템 온램프(Jira/Linear/Asana).
→ **코어 기능을 더 만들 필요가 없다.** 우리는 "적용"과 "현지화"에 집중하면 된다.

## 4. 커스터마이징 레버 (충돌 적은 순)

| 레버 | 방식 | upstream 머지 충돌 위험 |
|---|---|---|
| **플러그인** | `packages/plugins/sdk` — 독립 npm 패키지로 개발 | 거의 없음 ✅ |
| **어댑터** | `packages/adapters/` 신규 디렉터리 추가 | 거의 없음 ✅ |
| **스킬** | `skills/` 에 우리 업무 절차 추가 | 거의 없음 ✅ |
| **i18n 번역** | `ui/src/i18n/locales/ko.json` 채우기 | 낮음 ✅ |
| **i18n 배선** | 1,208개 .tsx의 문자열 외부화 | **높음** ⚠️ |
| **브랜딩** | `server/src/ui-branding.ts` (env 기반 화이트라벨 훅 존재) | 낮음 ✅ |
| **결제/구독** | 신규 모듈 + 신규 DB 테이블 | 낮음 ✅ |
| **코어 수정** | `server/src/services/*` 직접 수정 | **높음** ⚠️ |

> 설계 원칙: **코어를 고치지 말고 가장자리로 확장한다.**
> 우리 코드는 `mvp/`, `packages/plugins/`, `packages/adapters/`, `skills/` 에 둔다.
> 그래야 5,302 커밋짜리 업스트림을 계속 따라갈 수 있다.
