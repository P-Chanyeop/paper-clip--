---
name: PR CI에 디자인 토큰 검사가 빠진 이유 조사
assignee: researcher
project: code-review-automation
---

## 배경 (검증된 사실)

- `AGENTS.md`와 `DESIGN.md`는 UI 변경 전에 `pnpm check:token-gates` 실행을 요구한다.
- 그런데 PR 정책 job(`.github/workflows/pr-trusted.yml`)은
  `check:node-version`과 `check:module-boundaries`만 돌린다.
- `check:token-gates`가 있는 유일한 워크플로(`docker-runner-check.yml`)는
  **수동 실행 전용**(`workflow_dispatch`)이다.

즉 토큰 규칙 위반이 **PR에서 자동으로 걸러지지 않는다.** 지금은 리뷰어가 눈으로 잡아야 한다.

## 조사할 것

1. **의도된 것인가?** `pr-trusted.yml`의 변경 이력(`git log`)에서 token-gates가
   빠진/빠져 있던 이유를 찾아라. 느려서, 불안정해서, 아니면 단순 누락인가.
2. **업스트림에서 이미 다루고 있는가?** 관련 이슈·PR 흔적.
3. **우리 포크에 추가하면 무엇이 깨지는가?** 실행 시간, 업스트림 머지 충돌 가능성.

## 하지 말 것

- **CI 파일을 고치지 마라.** 이건 업스트림 파일이고, 고칠지는 사람이 정한다.
- 확인하지 못한 것을 확인한 것처럼 쓰지 마라.

## 산출물

권고안 하나와 근거. 선택지는:
(a) 우리 포크 CI에 추가 (b) 업스트림에 제안 (c) 그대로 두고 리뷰어가 수동 확인
**미확인 범위를 명시할 것.**
