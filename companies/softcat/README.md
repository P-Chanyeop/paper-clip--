# 소프트캣 (softcat)

사내 개발 업무를 자동화하는 AI 에이전트 회사 패키지.
코드 리뷰·이슈 분류·주간 보고를 **한국어로** 처리한다.

이 패키지를 import하면 에이전트 4명·스킬·프로젝트·시작 작업이 **한 번에** 생성된다.
화면에서 수십 번 클릭할 일을 파일 하나로 대체한다.

## 불러오기

```sh
paperclipai company import --from ./companies/softcat
```

정확한 사용법은 `paperclipai company import <경로또는URL>` 이다.
`--from` 플래그가 아니라 **위치 인자**다. `--dry-run` 으로 먼저 미리보기를 볼 것.

### 화면에서 올리기 (zip 필요)

`<호스트>/<회사프리픽스>/company/import` 는 **`.zip`만 받는다.** 폴더는 안 된다.
zip은 최상위 폴더 안에 `COMPANY.md`가 있어야 한다:

```sh
cd companies && zip -r ../softcat.zip softcat
```

생성된 zip은 커밋하지 않는다. 원본과 중복되고, 패키지가 바뀌면 낡은 zip을
import하게 되는 함정이 된다. 필요할 때마다 위 명령으로 다시 만든다.

> ⚠️ import 직후 **예산부터 거세요.** 기본값은 무제한입니다.
> 회사 한도만 걸면 에이전트 하나가 폭주할 때 전사가 멈춥니다.
> 에이전트별 한도까지 걸어 폭발 반경을 가두세요.

## 조직도

| 에이전트 | 직책 | 보고 대상 | 스킬 | 권한 |
|---|---|---|---|---|
| **CEO** | 대표 | — | `paperclip` | 배정 ⭕ / 구현 ❌ / 머지 ❌ |
| **리뷰어** | 코드 리뷰어 | CEO | `kr-code-review`, `paperclip` | 코멘트 ⭕ / 코드수정 ❌ / 머지 ❌ |
| **엔지니어** | 소프트웨어 엔지니어 | CEO | `paperclip` | PR생성 ⭕ / 머지 ❌ |
| **리서처** | 기술 리서처 | CEO | `paperclip` | 문서 ⭕ / 코드작성 ❌ |

**네 에이전트 모두 머지 권한이 없다. 머지는 사람이 한다.**

## 업무 흐름

```
사람 → 목표 제시
  └→ CEO → 작업 분해·배정
       ├→ 엔지니어 → 구현 → PR
       │    └→ 리뷰어 → 한국어 리뷰 → 사람이 머지 판단
       └→ 리서처 → 조사 → 문서 → CEO 취합
```

## 왜 구현과 리뷰를 나눴는가

같은 에이전트가 코드를 짜고 스스로 리뷰하면 **자기 코드를 통과시킨다.**
엔지니어와 리뷰어를 분리한 것은 조직 설계가 아니라 **신뢰성 장치**다.

## 들어있는 것

```
COMPANY.md                              회사·목표·운영 원칙
agents/{ceo,reviewer,engineer,researcher}/AGENTS.md
skills/kr-code-review/                  한국어 PR 리뷰 스킬 + 체크리스트
projects/code-review-automation/        첫 프로젝트
  └ tasks/{repo-orientation,first-pr-review}/
tasks/weekly-report/                    주간 보고 (매주 금 17:00 KST)
.paperclip.yaml                         Claude Code 런타임 설정
```

## 시작 작업 2개

import 직후 바로 돌려볼 수 있다:

1. **저장소 파악 보고서** (리서처) — 리뷰어가 쓸 기준 문서를 만든다
2. **첫 PR 리뷰 시험 운영** (리뷰어) — 스킬이 실제로 동작하는지 확인한다

> 2번의 진짜 목적은 리뷰를 다는 게 아니라 **스킬의 결함을 찾는 것**이다.
> 작업 지시문에 피드백을 남기도록 명시해 두었다.

## 성공 판정

4주 운영 후 아래를 말할 수 있어야 한다. 말할 수 없으면 실패다.

- 리뷰어의 **지적 유효율** (목표 ≥ 50%)
- 에이전트 1명당 **월 원가**
- 사람이 **절감한 공수** (시간)

리뷰가 몇 개 달렸는지는 지표가 아니다.

## 참고

- [Agent Companies 규격](https://agentcompanies.io/specification)
- [Paperclip](https://github.com/paperclipai/paperclip)
