# 한국어화 작업량 실측

> 측정 도구: `scripts/kr/extract-strings.mjs` (Babel AST 기반, 읽기 전용)
> 측정일: 2026-10-16 / 업스트림 `185483e09`
> 재현: `node scripts/kr/extract-strings.mjs --dir ui/src --json out.json`

> ⚠️ **정정 (2026-10-16)** — 첫 측정은 Tailwind 클래스명을 번역 대상으로 잘못 셌다.
> `className={cn("flex items-start gap-3")}` 같은 문자열이 공백을 포함한다는 이유로
> 사용자 문구로 집계됐다. 추출기에 스타일 맥락(className·cn/clsx/cva 인자) 제외와
> 클래스명 휴리스틱을 넣고 다시 쟀다. **이전 수치(20,181키 / Tier1 1,554키)는 폐기한다.**
> 오탐 비율은 약 44%였다.

## 1. 전체 규모

| 항목 | 수치 |
|---|---|
| 스캔한 `.tsx` (테스트/스토리 제외) | **770** |
| 번역 대상 문자열 출현 | **15,801** |
| 고유 키 (중복 병합 후) | **11,301** |
| 영향받는 파일 | **606** |

→ UI 전체 한국어화 = 11,301키. 여전히 MVP 범위가 아니다. 범위를 잘라야 한다.

### 분포 특성

| 특성 | 수치 | 의미 |
|---|---|---|
| 2회 이상 재사용되는 키 | 2,811 (24.9%) | 공용 컴포넌트부터 치면 레버리지가 있다 |
| **20자 이하 짧은 문구** | **6,898 (61.0%)** | 버튼·라벨·배지 → **한국어 길이 증가로 레이아웃이 깨지는 구간** |

> 클래스명 오탐을 걷어내자 짧은 문구 비중이 41.9% → **61.0%로 올라갔다.**
> 실제 UI 문구는 대부분 짧다는 뜻이고, 레이아웃 회귀 위험은 처음 추정보다 크다.

## 2. 문자열이 가장 많은 파일 (상위 10)

```
518  ui/src/pages/DesignGuide.tsx          ← 개발자 전용. 번역 안 함
360  ui/src/pages/Secrets.tsx
313  ui/src/pages/apps/chat/ChatEndpointSetup.tsx
304  ui/src/pages/CompanySkills.tsx
299  ui/src/pages/CompanySkills.production.tsx
293  ui/src/pages/PipelineSettings.tsx
268  ui/src/features/connections/ConnectionSetupFlow.tsx
249  ui/src/pages/AgentDetail.tsx
215  ui/src/pages/Pipelines.tsx
214  ui/src/components/AgentConfigForm.tsx
```

> `*.production.tsx` 와 동명 파일이 쌍으로 존재한다 (`CompanySkills.tsx` /
> `CompanySkills.production.tsx`). codemod는 **두 쌍을 모두** 처리해야 한다.
> 한쪽만 치환하면 프로덕션 빌드에서 영어가 남는다.

## 3. Tier 1 — MVP 실제 범위 ✅

운영자가 매일 보는 화면 + 공용 UI 프리미티브(`ui/src/components/ui/`)로 한정.

| 항목 | 수치 |
|---|---|
| **고유 키** | **661** |
| **영향 파일** | **22** |
| 전체 대비 | **5.8%** |

**포함 화면**
대시보드 · 수신함(Inbox) · 작업상세(IssueDetail) · 에이전트목록 · 에이전트상세 ·
조직도 · 목표 · 프로젝트 · 비용 · 승인목록 · 승인상세 · 활동로그 · 회사 ·
산출물 · 검색 · 설정 + 공용 프리미티브

→ **661키. 처음 추정의 절반 이하다.**

### 파일럿 후보 (가장 작은 실제 화면)

| 파일 | 키 | 문구 |
|---|---|---|
| `Goals.tsx` | 4 | Select an organization to view goals. / No goals yet. / Add Goal / New Goal |
| `Approvals.tsx` | 4 | Select an organization first. / Pending / No pending approvals. / No approvals yet. |
| **`Projects.tsx`** | **8** | Sort / Sort: / Add Project / No projects yet. / My Projects / Other Projects / Private project … |

`Projects.tsx`를 파일럿으로 권한다. 문구 종류(정렬 라벨·빈 상태·버튼·구분 헤더)가
다양해서 파이프라인 전 단계를 한 번에 검증할 수 있다.

## 4. Tier 2 / Tier 3 (MVP 밖)

Tier 1을 뺀 나머지는 **약 10,640키**다. 둘의 경계는 아직 재측정하지 않았다.

| Tier | 범위 | 시점 |
|---|---|---|
| Tier 2 | 스킬스튜디오 · 파이프라인 · 연결된앱 · 비밀관리 · 온보딩 | Phase 2 (유료 고객 생기면) |
| Tier 3 | 나머지 (관리자·디버그·UX랩 화면 포함) | 하지 않을 수도 있다 |

최다 파일인 `DesignGuide.tsx`(518키)는 **개발자 전용 화면**이다. 번역할 이유가 없다.

## 5. 리스크 — 측정에서 드러난 것

1. **짧은 문구 61.0%** → 한국어가 길어져 버튼·테이블 헤더가 깨진다.
   → Storybook 시각 스냅샷 비교가 유일한 방어선. codemod 전 baseline 필수.
2. **`.production.tsx` 쌍** → 치환 누락 시 프로덕션에만 영어 잔존. 가장 잡기 어려운 버그.
3. **재사용 키 24.9%** → 같은 원문을 문맥에 따라 다르게 번역해야 하는 경우가 생긴다.
   용어집(`mvp/glossary-ko.md`)으로 1차 방어하고, 충돌 시 키를 분리한다.
4. **업스트림 속도** → 번역 중에도 새 영문 문자열이 유입된다.
   → CI에 "미번역 키 검출" 게이트를 걸어 회귀를 막는다.
5. **추출기 자체의 한계** → 전부 소문자인 진짜 UI 문구("no results")는
   클래스명 휴리스틱에 걸려 누락될 수 있다. 수치는 하한에 가깝다.
