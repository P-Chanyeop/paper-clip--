# 조사 결과 — PR CI에 디자인 토큰 검사가 빠진 이유

- 작성: 리서처
- 조사일: 2026-10-16
- 조사 기준 커밋: `d450c4022`
- **코드/CI 파일 변경 없음.** 조사와 측정(읽기 전용)만 수행.

---

## 1. 결론 요약

**토큰 검사가 PR에서 빠진 것은 의도적 제거가 아니라, 처음부터 CI에 연결된 적이 없는 누락이다.**
"느려서 뺐다"는 가설은 측정으로 기각된다 (**전체 약 1.8초**).

그리고 조사 중 과제 설명의 전제 두 개를 정정해야 하는 사실, 그리고 **권고안의 형태를 바꾸는
결정적 사실 하나**를 발견했다 (→ §4, §5).

**권고: (a) 우리 포크에 추가. 단 `pr-trusted.yml`을 수정하는 방식이 아니라,
포크 전용 신규 워크플로 파일을 추가하는 방식으로.** 근거는 §6.

---

## 2. 질문 1 — 의도된 것인가?

### 검증된 사실

전체 git 이력에서 `.github/` 아래 `check:token-gates` 문자열을 건드린 커밋은 **단 1개**다.

```
git log -S "check:token-gates" -- .github/
→ f1a394bd3  feat(runner): add Grok Build through native ACP (#13882)   (1건)

git log -S "check-token-gates" -- .github/
→ (0건)
```

그 1건이 한 일은 토큰 정책과 **무관**하다. `docker-runner-check.yml`의
"Verify repository on hosted Linux" 스텝에, 저장소 전체 검사를 돌리는 7개 명령
루프의 한 항목으로 끼워 넣은 것이다 (`docker-runner-check.yml:181`):

```
'pnpm -r typecheck' 'pnpm test:run' 'pnpm check:token-gates'
'pnpm test:e2e:runner:typecheck' 'pnpm test:e2e:runner:unit' 'pnpm build' ...
```

즉 **`pr.yml`/`pr-trusted.yml`에 들어간 적이 없고, 따라서 빠진 적도 없다.**
"느려서"/"불안정해서" 제거했다는 기록은 존재하지 않는다. **단순 누락이다.**

### 왜 누락되었는지 — 정황 증거

게이트 스크립트를 만든 커밋은 `c07e650cd` (#9134, 2026-07-07, scotttong,
"feat(ui): single-source design tokens, visual regression suite, and theme retune").

이 커밋은 `.github/`를 **건드렸다.** 단 한 파일, `storybook-visual.yml`(신규 102줄)만.
커밋 메시지에 그 선택이 명시되어 있다:

> **Visual CI is opt-in while stabilizing:** add the `storybook-visual` label or
> dispatch the workflow manually…

그리고 같은 메시지의 후속 로드맵 항목:

> …consolidation; **ESLint ratchet.** Tracked in `doc/design/DECISION-SHEET.md`.

`DECISION-SHEET.md:101`에서도 동일하게 확인된다:

> Remaining roadmap: Run 3 …, issue→task rename run, Run 4 …, **ESLint ratchet.**

**해석 (이건 내 추론이다, 기록된 사실이 아니다):**
작성자는 CI 비용을 의식하고 있었고, **비싼** 시각 회귀 스위트는 의도적으로 opt-in으로
돌렸다. **값싼** 토큰 게이트는 CI가 아니라 "커밋 전 로컬 실행 규칙"으로 두고
`AGENTS.md`에 문서화했다 (`TOKEN-AUDIT.md:423`이 그 문서화 작업을 기록). 최종 강제
수단으로는 ESLint ratchet을 염두에 뒀다.

그런데 **ESLint ratchet은 만들어지지 않았다.**

```
git ls-files | grep eslint   → 0건 (저장소에 ESLint 설정 파일이 아예 없다)
git grep -n "lint" -- .github/   → 0건 (CI에 린트 단계가 아예 없다)
```

**정리: 문서로만 강제되는 임시 방편이었고, 후계자로 지목된 ESLint는 끝까지 구현되지
않았다. 그 사이 공백이 지금까지 남은 것이다.** 의도적 트레이드오프 결정의 흔적은 없다.

---

## 3. 질문 2 — 업스트림에서 이미 다루고 있는가?

업스트림은 **`paperclipai/paperclip`**이다 (`pr.yml:19`, `pr-trusted.yml:25`에서 확인).

| 검색 | 결과 |
|---|---|
| 코드: `"check:token-gates" repo:paperclipai/paperclip` | 33건. **`.github/` 하위는 `docker-runner-check.yml` 단 하나.** 나머지는 전부 문서·`package.json`·UI 소스 |
| PR 제목: `"token-gates" in:title` | 0건 |
| 이슈: 토큰 게이트 / CI 강제 관련 | 관련 건 없음 (무관한 "gate" 오탐 2건만) |

**→ 업스트림 master도 정확히 같은 공백을 갖고 있다.** 업스트림이 이미 해결했거나
진행 중이라는 흔적은 찾지 못했다.

> ⚠️ **이 항목은 조사가 불완전하다.** PR 본문 전수 검색 시도 1건이 MCP의
> prompt-injection 가드에 의해 차단되었다 (`prompt_injection_blocked` /
> `secret_exfiltration`). 따라서 "업스트림에서 논의된 적 없다"고 단정할 수 없다.
> 제목 검색과 코드 검색에서 안 나왔다는 것까지만 확인된 사실이다. (→ §7, §8)

---

## 4. 과제 설명의 전제 정정 2건

조사 결과 과제 설명의 사실관계 두 곳을 정정해야 한다. **다만 두 정정 모두 과제의
최종 결론("PR에서 자동으로 걸러지지 않는다")은 바꾸지 않는다 — 오히려 강화한다.**

### 정정 1 — policy job이 검사 2개만 돌리는 것은 아니다

`check:node-version`과 `check:module-boundaries`는 **`pnpm check:*` 형태로 호출되는
것이 둘뿐**이라는 뜻이다. policy job은 실제로 `node scripts/...` 직접 호출로 약 13개
검사를 더 돌린다 (`pr-trusted.yml:86`–`137`):

`check-pr-migration-order` · `check-docker-deps-stage` · `check-no-git-push` ·
`release-package-map check` · `check-release-package-bootstrap` · 그리고
`.test.mjs` 스위트 여러 개.

**이 정정은 권고안에 유리하다.** "값싼 node 검사 하나를 policy job에 넣는다"는 것은
예외적 요청이 아니라 **그 job이 정확히 그 용도로 존재한다는 증거**다.

### 정정 2 — `docker-runner-check.yml`은 수동 실행 전용이 아니다. 그런데 우리 포크에서는 아예 못 돈다

이 워크플로에는 `pull_request:` 트리거도 있다 (`docker-runner-check.yml:26`–`34`,
`Dockerfile`/`runner/**`/`protocol/**` 등 경로 필터).

하지만 토큰 게이트가 들어있는 스텝은 그 경로로 실행되지 않는다:

- 스텝 조건이 `if: inputs.verify_source` (`:174`) — `inputs`는 `workflow_dispatch`에만
  존재하므로 PR 실행 시 빈 값 → **PR에서는 절대 안 돈다.**
- 해당 job은 `needs: authorize_manual`이고, 그 job은 다음을 **단정(assert)**한다
  (`:120`–`126`):
  ```
  test "$REPOSITORY" = paperclipai/paperclip
  test "$REPOSITORY_ID" = 1170821064
  ```
  (+ 액터 ID 허용목록)

**→ 우리 포크에서는 수동으로 돌려도 이 단정에서 실패한다. 즉 우리 포크의 토큰 게이트
CI 커버리지는 "수동 전용"이 아니라 사실상 0이다.** 과제 설명의 결론은 맞고,
실제 상황은 설명보다 조금 더 나쁘다.

---

## 5. 질문 3 — 우리 포크에 추가하면 무엇이 깨지는가?

### 5-1. 실행 시간 — 쟁점이 아니다 (측정값)

`check-token-gates.mjs`는 외부 의존성이 없다 (`node:fs`, `node:path`, `node:url`만
import — `scripts/check-token-gates.mjs:73`–`75`). 그래서 `node_modules` 없이
직접 측정했다:

| 명령 | 실측 | 종료 코드 |
|---|---|---|
| `node scripts/check-token-gates.mjs` | **1.46s** | 0 |
| `node scripts/sync-agent-palette-tokens.mjs --check` | **0.14s** | 0 |
| `node scripts/sync-cliplab-character.mjs --check` | **0.17s** | 0 |
| **합계 (= `pnpm check:token-gates`의 3개 구성 요소)** | **약 1.8초** | 0 |

비교: policy job의 `timeout-minutes: 10`. 추가 비용은 무시할 수준이다.
**"느려서 빠졌다"는 가설은 기각.**

(측정 조건의 한계는 §8에 명시.)

### 5-2. 업스트림 머지 충돌 — 여기가 진짜 쟁점이다

**결정적 사실: 우리 포크의 `pr-trusted.yml`은 우리 포크에서 실행되지 않는다.**

`.github/workflows/pr.yml:19`:

```yaml
uses: paperclipai/paperclip/.github/workflows/pr-trusted.yml@master
```

GitHub은 `uses: owner/repo/...@ref`를 **호출자가 어느 포크에 있든 상관없이 그
owner/repo/ref로 해석**한다. 따라서:

- 우리 PR에서 실제로 도는 CI 정의는 **업스트림 master의 `pr-trusted.yml`**이다.
- 우리 저장소에 있는 `.github/workflows/pr-trusted.yml` 사본은 **우리 포크 입장에서
  사실상 사문(dead code)이다. 그 파일을 고쳐도 우리 PR에서 바뀌는 것은 없다.**
- `gate` job이 호출하는 `ci-routing.yml@master`도 동일 구조다 (`pr-trusted.yml:25`).

**그래서 과제가 제시한 선택지 (a)를 문자 그대로("우리 포크 CI에 추가") 구현하려면
두 가지 길이 있고, 둘의 비용 차이가 매우 크다.**

| 방식 | 업스트림 충돌 | 평가 |
|---|---|---|
| **(a-1)** `pr.yml`을 우리 ref로 재지정 + `pr-trusted.yml` 수정 | **매우 높음.** `pr-trusted.yml`은 변경이 극심한 파일 (`git log`에 최소 40개 커밋; 대부분 `perf(ci)`/`ci:` 성능 튜닝). CI 정의 전체를 포크하는 셈 | **비추천.** 추가로 `pr.yml:17`–`18` 주석이 "AWS runner group permits `pr-trusted.yml@refs/heads/master`"라고 명시 → 재지정 시 예약 러너 용량을 잃을 수 있다 (미검증, §8) |
| **(a-2)** 토큰 게이트만 돌리는 **포크 전용 신규 워크플로 파일 추가** | **없음.** 업스트림에 존재하지 않는 새 파일이므로 머지 충돌 표면이 0 | **추천.** 과제의 "CI 파일을 고치지 마라" 제약과도 정확히 일치한다 |

---

## 6. 권고안

### ✅ (a) — 단, **(a-2) 포크 전용 신규 워크플로 파일** 형태로.

업스트림 파일(`pr.yml`, `pr-trusted.yml`, `docker-runner-check.yml`)은 **한 줄도
건드리지 않고**, `ui/**` 경로 필터를 걸어 `pnpm check:token-gates`만 돌리는
새 워크플로 파일 하나를 추가한다.

### 근거

1. **비용이 사실상 0이다.** 1.8초. 반대 논거로 쓸 수 있는 수치가 없다 (§5-1).
2. **충돌 표면이 0이다.** 업스트림에 없는 파일이므로 머지 충돌이 구조적으로 발생하지
   않는다. `pr-trusted.yml` 수정안(a-1)이 지는 40+ 커밋짜리 충돌 리스크를 전부 회피한다 (§5-2).
3. **지금은 문서가 요구하는 것이 강제되지 않는 상태다.** `AGENTS.md`와 `DESIGN.md`가
   실행을 **요구**하는데 어떤 자동 검사도 그것을 확인하지 않는다. 문서화된 요구사항이
   강제되지 않는 상태는 "규칙 없음"보다 나쁘다 — 지켜진다고 착각하게 만든다.
4. **이건 리뷰어가 눈으로 잡을 수 있는 종류의 규칙이 아니다.** 게이트는 468개 파일,
   31개 허용목록 항목, 71개 허용된 예외를 다룬다 (`TOKEN-AUDIT.md:416`). 규칙 자체가
   사람 기억에 담을 수 없을 만큼 세밀하다 (예: `blur-[2px]`는 위반, `backdrop-blur-[2px]`는
   별도 처리, `hsl(var(--primary)/0.16)`은 통과하지만 `rgba(0,0,0,0.5)`는 위반).
   → **선택지 (c)를 기각하는 핵심 근거.**
5. **원래 의도된 강제 수단이 영구 미구현 상태다.** ESLint ratchet은 2026-07부터
   로드맵에 있었고 설정 파일조차 없다 (§2). 그것이 올 때까지 기다리는 것은 무기한 대기다.

### 선택지 (b)는 기각이 아니라 **후속**

업스트림도 같은 공백을 갖고 있고 (§3), 변경 비용은 `pr-trusted.yml`의 policy job에
2초짜리 스텝 한 줄이다. 제안할 가치는 충분하다. 다만:

- **(b)는 (a-2)를 막지 않아야 한다.** 업스트림 머지 시점은 우리가 통제할 수 없다.
- (b)를 제안한다면 §4 정정 1이 좋은 논거가 된다 — policy job은 이미 그런 값싼
  node 검사 13개를 돌리고 있으므로, 새 패턴을 요구하는 제안이 아니다.
- **(b) 실행은 사람 승인 사항이다.** 업스트림 저장소에 PR/이슈를 올리는 것은
  외부에 보이는 행위이므로 내가 임의로 하지 않았고, 하지 않을 것이다.

### 선택지 (c) 기각

근거 3·4번. 1.8초 결정론적 검사로 잡을 수 있는 것을, 사람 기억에 담기 불가능한
규칙 집합에 대해 리뷰어 육안에 맡길 이유가 없다.

---

## 7. ⚠️ 보안 참고 — 조사 중 차단된 도구 호출

업스트림 PR 검색 1건이 MCP 서버 측 가드에 의해 차단되었다:

```
tool: search-pull-requests
query: repo:paperclipai/paperclip token-gates
error: "Tool result contained prompt-injection instructions and was blocked"
       reasonCode: prompt_injection_blocked
       findings: ["secret_exfiltration"]
```

즉 `paperclipai/paperclip`의 PR 본문 중 어딘가에 **비밀정보 반출 패턴으로 분류된
내용**이 있어서 결과 전체가 차단되었다. 나는 그 내용을 보지 못했다.

- 이 때문에 §3의 업스트림 PR 전수 조사가 불완전하다.
- 동시에 **그 자체로 사람이 한 번 확인할 가치가 있는 신호**다. 오탐일 수 있으나
  (업스트림 PR 본문에 CI 로그·토큰 유사 문자열이 붙은 경우 등), 확인 없이 오탐으로
  단정할 근거는 내게 없다. CEO 판단에 맡긴다.

---

## 8. 미확인 범위 (명시)

확인하지 못한 것을 확인한 것처럼 쓰지 않기 위해, 아래는 **검증되지 않았다.**

### 권고안 실행 전에 반드시 먼저 확인해야 하는 것

1. **우리 포크의 PR CI가 현재 정상 동작하는지 자체를 확인하지 않았다.**
   `pr.yml`은 업스트림의 reusable workflow와 AWS 러너 그룹에 의존한다. 포크 호출자가
   그 러너 그룹에 접근 가능한지 모른다. **실제 Actions 실행 기록을 한 건도 보지 않았다.**
   → 우리 PR CI가 이미 실패/스킵 중이라면 권고안의 전제가 달라진다. **1순위 확인 사항.**
2. **신규 워크플로가 쓸 러너를 확보할 수 있는지 미확인.** 포크에 hosted runner
   사용 권한/분(minutes)이 있는지 확인하지 않았다.
3. **업스트림 master에서 게이트가 현재 통과하는지 미확인.** 우리 HEAD(`d450c4022`)에서는
   exit 0으로 통과한다(실측). 업스트림 master가 현재 위반 상태라면, 게이트를 켜는 순간
   PR이 즉시 빨간불이 된다. 켜기 전 1회 확인 필요.

### 측정값의 한계

4. **`pnpm`을 경유해 측정하지 않았다.** `node_modules`가 없어 3개 스크립트를 `node`로
   직접 실행했다. 실제 `pnpm check:token-gates`에는 pnpm 자체 기동 오버헤드가 더해진다.
5. **측정 환경이 CI와 다르다.** Windows 11 / node v26.8.1에서 측정. CI는 Linux /
   node 24다. **"약 1.8초"는 자릿수(order of magnitude)로만 신뢰할 값이고, CI 정확값이 아니다.**
   (단, 결론을 뒤집을 만한 차이는 아니라고 본다.)

### 이력 조사의 한계

6. **업스트림 PR 본문 전수 검색 불가** (§7). 제목 검색·코드 검색 음성까지만 사실.
7. **`git log --follow -- .github/workflows/pr-trusted.yml`이 exit 255로 종료했다.**
   40개 커밋을 출력한 뒤 에러가 났고, 전체 이력을 끝까지 페이징하지 않았다.
   → **"최소 40개 커밋"은 하한값이며 총계가 아니다.**
8. **AWS 러너 그룹 제약(§5-2)은 저장소 주석(`pr.yml:17`–`18`)을 인용한 것이다.**
   GitHub 설정 화면을 직접 확인한 것이 아니다.
9. `check:tokens`(`check-forbidden-tokens.mjs`)도 `.github/` 어디에도 없음을 확인했으나,
   이번 과제 범위가 아니라 더 파지 않았다. **별건으로 남아 있는 공백이다.**

---

## 9. 다음 행동

- **이 문서는 결정 요청이다. 구현은 하지 않았다** (리서처 범위 — 코드/CI 미변경).
- CEO가 (a-2)를 승인하면 엔지니어에게 넘긴다. 넘길 때 §8의 1·2·3번을
  **구현 전 선행 확인 항목**으로 함께 전달해야 한다.
- (b) 업스트림 제안은 별도 승인 사항 (§6).
- §7의 보안 신호는 CEO 확인 필요.
