# 한국어화 작업량 실측

> 측정 도구: `scripts/kr/extract-strings.mjs` (Babel AST 기반, 읽기 전용)
> 측정일: 2026-10-16 / 업스트림 `185483e09`
> 재현: `node scripts/kr/extract-strings.mjs --dir ui/src --json out.json`

추정이 아니라 **실측**이다. 설계서의 "20개 화면" 범위가 현실적인지 검증했다.

## 1. 전체 규모

| 항목 | 수치 |
|---|---|
| 스캔한 `.tsx` (테스트/스토리 제외) | **770** |
| 번역 대상 문자열 출현 | **34,532** |
| 고유 키 (중복 병합 후) | **20,181** |
| 영향받는 파일 | **698** |

→ **UI 전체 한국어화 = 20,181개 키.** 이건 MVP가 아니다. 범위를 잘라야 한다.

### 분포 특성 (범위 축소 근거)

| 특성 | 수치 | 의미 |
|---|---|---|
| 2회 이상 재사용되는 키 | 7,136 (35.4%) | 공용 컴포넌트부터 치면 레버리지가 크다 |
| 20자 이하 짧은 문구 | 8,463 (41.9%) | 버튼·라벨·배지 → **한국어 길이 증가로 레이아웃 깨짐 위험 구간** |

## 2. 문자열이 가장 많은 파일 (상위 10)

```
747  ui/src/pages/Secrets.tsx
687  ui/src/pages/PipelineSettings.tsx
670  ui/src/pages/CompanySkills.tsx
669  ui/src/pages/AgentDetail.tsx
659  ui/src/pages/CompanySkills.production.tsx
582  ui/src/pages/AgentDetail.production.tsx
559  ui/src/pages/DesignGuide.tsx
548  ui/src/pages/Pipelines.tsx
423  ui/src/pages/apps/chat/ChatEndpointSetup.tsx
385  ui/src/pages/TeamCatalog.tsx
```

> `*.production.tsx` 와 동명 파일이 쌍으로 존재한다 (`AgentDetail.tsx` /
> `AgentDetail.production.tsx`). codemod는 **두 쌍을 모두** 처리해야 한다.
> 한쪽만 치환하면 프로덕션 빌드에서 영어가 남는다.

## 3. Tier 1 — MVP 실제 범위 ✅

운영자가 매일 보는 화면 + 공용 UI 프리미티브(`ui/src/components/ui/`)로 한정.

| 항목 | 수치 |
|---|---|
| **고유 키** | **1,554** |
| **영향 파일** | **41** |
| 전체 대비 | **7.7%** |

**포함 화면**
대시보드 · 수신함(Inbox) · 작업상세(IssueDetail) · 에이전트목록 · 에이전트상세 ·
조직도 · 목표 · 프로젝트 · 비용 · 승인목록 · 승인상세 · 활동로그 · 회사 ·
산출물 · 검색 · 설정 + 공용 프리미티브

→ **1,554키는 1주일에 끝낼 수 있는 분량이다.** MVP 범위로 타당하다.

## 4. Tier 2 / Tier 3 (MVP 밖)

| Tier | 범위 | 키 수(추정) | 시점 |
|---|---|---|---|
| Tier 2 | 스킬스튜디오 · 파이프라인 · 연결된앱 · 비밀관리 · 온보딩 | ~6,000 | Phase 2 (유료 고객 생기면) |
| Tier 3 | 나머지 전부 (관리자·디버그·UX랩 화면 포함) | ~12,600 | 하지 않을 수도 있다 |

Tier 3의 상당수는 `DesignGuide.tsx`, UX Lab 등 **개발자 전용 화면**이다.
고객에게 안 보인다. 번역할 이유가 없다.

## 5. 리스크 — 측정에서 드러난 것

1. **짧은 문구 41.9%** → 한국어가 길어져 버튼·테이블 헤더가 깨진다.
   → Storybook 시각 스냅샷 비교가 유일한 방어선. codemod 전 baseline 필수.
2. **`.production.tsx` 쌍** → 치환 누락 시 프로덕션에만 영어 잔존. 가장 잡기 어려운 버그.
3. **재사용 키 35.4%** → 같은 원문을 문맥에 따라 다르게 번역해야 하는 경우가 생긴다.
   용어집(`mvp/glossary-ko.md`)으로 1차 방어하고, 충돌 시 키를 분리한다.
4. **업스트림 속도** → 주당 수십~수백 커밋. 번역 중에도 새 영문 문자열이 유입된다.
   → CI에 "미번역 키 검출" 게이트를 걸어 회귀를 막는다.
