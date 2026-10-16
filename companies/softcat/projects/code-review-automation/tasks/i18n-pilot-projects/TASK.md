---
name: 한국어화 파일럿 — 프로젝트 목록 화면
assignee: engineer
project: code-review-automation
---

## 선행 조건

**"한국어 전환 경로 추가" 작업이 끝난 뒤에 시작한다.** 그 전에는 번역해도 확인할 방법이 없다.

## 목적

번역 자체가 목적이 아니다. **한국어화 파이프라인 전체를 작은 화면 하나로 끝까지
통과시켜 보고, 화면 하나에 드는 시간과 비용을 재는 것**이다.
이 숫자가 Tier 1(661키, 22파일)의 일정과 예산을 정한다.

## 대상

`ui/src/pages/Projects.tsx` — 번역 대상 **8키** (추출기 실측):

```
Select an organization to view projects.
Sort
Sort:
Add Project
No projects yet.
My Projects
Other Projects
Private project
```

`.production.tsx` 쌍 파일은 없다 (확인함).

## 할 일

1. 위 8개를 `t("키")` 로 치환한다. i18n 진입점은 `@/i18n` 의 `useTranslation`.
2. `ui/src/i18n/locales/en.json` 에 원문, `ko.json` 에 번역을 넣는다.
3. 번역은 `mvp/glossary-ko.md` 용어집을 따른다. (Project = 프로젝트)
4. `Sort:` 와 `Sort` 처럼 **같은 단어의 변형**이 있다. 한 키로 합치지 말고 각각 둔다.

## 검증

```
pnpm --filter @paperclipai/ui typecheck
pnpm test:run ui/src/i18n ui/src/pages/Projects
pnpm check:token-gates
```
그리고 `?lng=ko` 로 프로젝트 목록을 열어 **레이아웃이 깨지지 않는지** 눈으로 확인한다.
버튼·정렬 라벨처럼 짧은 문구에서 깨지기 쉽다 (전체 번역 대상의 61%가 20자 이하).

## 반드시 보고할 것

작업 댓글에:
- 걸린 시간
- 이 작업의 비용
- 막혔던 지점

**이 세 숫자가 이 작업의 진짜 산출물이다.**

## 산출물

새 브랜치 → PR. 머지하지 않는다.
