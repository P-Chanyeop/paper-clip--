---
name: 포크 규약 PR 리뷰
assignee: reviewer
project: code-review-automation
---

## 선행 조건

**"포크 추가분 규약 문서화" 작업이 PR을 연 뒤에 시작한다.**
(화면에서 이 작업의 Blocked by에 그 작업을 걸어둘 것)

## 할 일

엔지니어가 연 PR을 `kr-code-review` 스킬대로 리뷰한다.
이것이 **이 조직의 첫 실전 리뷰**다.

특히 볼 것:
- 규약이 **실제 디렉터리 내용과 맞는가.** 문서에 적힌 것과 파일이 다르면 🔴
- 업스트림 파일(`AGENTS.md` 등)을 **한 줄 넘게** 고쳤는가. 그렇다면 🟡 이상
  (업스트림 머지 충돌 위험)
- `companies/softcat/skills/kr-code-review/`와 `skills/kr-code-review/`가
  동일해야 한다는 규칙이 들어갔는가

## 리뷰 후 반드시 남길 것

작업 댓글로:
- 스킬 지시문 중 **모호했던 부분**
- 판단이 어려웠던 지적과 그 이유
- 체크리스트(`references/checklist.md`)에 **추가돼야 할 항목**

이 피드백이 스킬을 개선하는 유일한 입력이다.

## 하지 말 것

- 코드를 고치지 마라. 머지하지 마라. 승인(Approve)하지 마라.
