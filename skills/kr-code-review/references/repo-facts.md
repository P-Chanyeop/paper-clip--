# 저장소 파악 보고서 — 리뷰 기준

리뷰어가 PR을 볼 때 참조하는 **저장소 사실 문서**다.
`checklist.md`는 "무엇이 깨지는가"를 다루고, 이 문서는 "이 저장소에서 무엇이
이미 기계로 걸러지고, 무엇이 리뷰어 몫인가"를 다룬다.

조사 기준: `f2ffcf3a0` (2026-10-16), 브랜치 `claude/confident-dijkstra-lyuo32`.
측정 구간: 2026-07-16 ~ 2026-10-16.

---

## 1. 권고 — 리뷰 순서

기계가 못 잡는 것부터 본다. 순서를 바꾸지 말 것.

1. **경로별 규칙 확인** (§3) — 변경된 파일에 걸리는 `rules/*.mdc`를 먼저 읽는다.
   규칙을 모르고 하는 지적은 대체로 틀린다.
2. **기계가 안 보는 항목** (§4) — 코드 주석, 디자인 토큰, 내부 티켓 참조,
   Telemetry 경로. 전부 CI에 게이트가 없다.
3. **핫스팟 여부** (§6) — 변경 파일이 핫스팟이면 회귀 테스트 유무를 따진다.
4. **CI 범위 확인** (§2) — full CI가 **건너뛰어졌는지** 본다. 초록불이
   "테스트했다"를 뜻하지 않는 경우가 있다.
5. 기계가 이미 잡는 것(§2 표의 자동 항목)은 **지적하지 않는다.** 노이즈다.

---

## 2. 검증 명령 — 무엇이 무엇을 증명하는가

### 2-1. 로컬에서 쓰는 명령 (`package.json` 루트)

| 명령 | 실제 실행 내용 | 증명 범위 |
|---|---|---|
| `pnpm test` | `test:run` → `node scripts/run-vitest-stable.mjs` | **Vitest만.** 브라우저 스위트는 포함 안 됨 |
| `pnpm -r typecheck` | 전 패키지 `tsc` | 타입만. 런타임 동작 아님 |
| `pnpm build` | `preflight:workspace-links` → `pnpm -r build` | 빌드 가능성 |
| `pnpm db:generate` | `packages/db` 컴파일 후 Drizzle 생성 + 스냅샷 프루닝 | 마이그레이션 생성 |
| `pnpm check:token-gates` | `check-token-gates.mjs` + 팔레트/캐릭터 동기화 체크 | 디자인 토큰 위반 |
| `pnpm check:module-boundaries` | `server/src/modules` 레이어 + DB 패키지 import 경계 | 모듈 경계 |
| `pnpm test:e2e` / `pnpm test:release-smoke` | Playwright | **옵트인.** 기본 실행 안 됨 |

AGENTS.md §7은 PR 핸드오프 전 `pnpm -r typecheck && pnpm test:run && pnpm build`
세 개를 요구한다. 평소 작업에는 "가장 좁은 검증을 먼저" 하라고 명시돼 있으므로,
작은 PR에 전체 타입체크를 요구하는 지적은 규약과 어긋난다.

### 2-2. 린트는 없다

**이 저장소에는 저장소 전역 린터가 없다.**
- 루트에 `lint` 스크립트가 없다.
- `git ls-files`에 ESLint 설정 파일이 **하나도 없다.**
- `lint` 스크립트는 `packages/adapters/hermes/package.json`에만 있고
  (`eslint src/`), 설정 파일이 추적되지 않는다.

→ **포매팅·네이밍·import 순서를 린터가 잡아주지 않는다.** 그렇다고 리뷰에서
스타일 취향을 지적하라는 뜻은 아니다. 스타일 지적은 여전히 ⚪ nit이고 상한 3개다.

### 2-3. PR에서 항상 돌는 CI (`policy` job, `.github/workflows/pr-trusted.yml`)

검증 단계는 **15개**다. 실행 순서대로(`pr-trusted.yml:86-137`, 직접 확인).
절반이 검사 스크립트 **자기 테스트**임에 유의 — 검사기가 깨지면 여기서 걸린다.

```
node .github/scripts/check-pr-migration-order.mjs      # L86
node ./scripts/check-docker-deps-stage.mjs             # L92
pnpm check:node-version                                # L95
node ./scripts/check-no-git-push.mjs                   # L98
node --test ./scripts/check-no-git-push.test.mjs       # L101
pnpm check:module-boundaries                           # L104
node --test ./scripts/check-module-boundaries.test.mjs # L107
node --test '.github/scripts/tests/*.test.mjs'         # L110
node --test .../run-vitest-stable-shard.test.mjs       # L113
node --test .../e2e-shard.test.mjs                     # L116
node --test .../release-verify-workflow.test.mjs       # L119 (+2개 더)
node --test .../build-standalone-concurrency.test.mjs  # L122
node ./scripts/release-package-map.mjs check           # L125
node ./scripts/check-release-package-bootstrap.mjs     # L128
pnpm install --resolution-only --ignore-scripts --no-frozen-lockfile  # L136
```

(`node --test`는 실제로는 `$CI_NODE_TEST`로, 체크아웃에
`scripts/ci-profile/node-test.mjs`가 있으면 그쪽을 쓴다 — `pr-trusted.yml:48-55`.)

위 명령 목록 외에 `policy`에는 `pnpm-lock.yaml` **하드 차단** 단계가 하나 더 있다
("Block manual lockfile edits", `pr-trusted.yml:57-68`). 이 단계는 브랜치가
`chore/refresh-lockfile`이거나 작성자가 `dependabot[bot]`일 때 **건너뛴다** —
예외는 둘 중 **하나만** 만족하면 된다(OR). 기여자가 락파일을 커밋해 왔으면
CI가 잡는다.

⚠️ §2-4의 `check-pr-lockfile.mjs`는 **주체도 결합도 다르다**
(`github-actions[bot]` **AND** `chore/refresh-lockfile`,
`check-pr-lockfile.mjs:13-14`). 두 검사를 한 문장으로 섞어 인용하지 말 것.

### 2-4. commitperclip 봇 (`.github/workflows/commitperclip-review.yml`)

`node .github/scripts/run-quality-gates.mjs`가 아래를 검사하고 PR에 코멘트를 남긴다.

⚠️ **이 job은 CI를 실패시킨다.** 게이트 실행 단계 자체는
`continue-on-error: true`지만(`commitperclip-review.yml:49`), 바로 다음 단계가
`steps.quality.outcome == 'failure'`일 때 `exit 1`로 job을 떨어뜨린다
(`commitperclip-review.yml:57-63`). 즉 "코멘트만 달리고 끝난다"로 읽으면 안 된다.
`dependabot[bot]`이 올린 PR에서만 두 단계가 모두 건너뛰어진다.

| 스크립트 | 검사 내용 |
|---|---|
| `check-pr-template.mjs` | PR 템플릿 전 섹션 작성 |
| `check-pr-linked-issue.mjs` | 이슈 링크 또는 in-PR 이슈 서술 |
| `check-pr-dedup-search.mjs` | 중복 PR 검색 체크박스 |
| `check-pr-test-coverage.mjs` | 테스트 파일 포함 여부 (아래 참고) |
| `check-pr-lockfile.mjs` | 락파일 수동 편집 (조건: `github-actions[bot]` **AND** `chore/refresh-lockfile`. §2-3의 하드 차단과 조건이 다름) |
| `check-pr-dependencies.mjs` | 의존성 변경 |
| `check-pr-release-bootstrap.mjs` | 릴리스 패키지 부트스트랩 |
| `check-pr-coauthors.mjs` | 공동 저자 |

`check-pr-test-coverage.mjs`의 실제 규칙 (리뷰에서 자주 쓰임):
- 제목 prefix가 `docs|chore|build|ci|style|refactor|revert` 면 **테스트 요구를 건너뛴다.**
- 제목이 `docs:`/`chore:`/`build:`/`ci:` 인데 소스 파일을 바꾸면 **불일치로 실패**하고
  `fix:`/`feat:`/`refactor:`로 제목을 바꾸라고 요구한다.

→ **제목 prefix가 게이트를 결정한다.** `chore:`로 제목을 달고 로직을 바꾼 PR은
테스트 요구를 우회한 것이다. 이건 리뷰에서 짚어야 한다.

### 2-5. full CI (조건부)

`gate` job이 `ci-routing.yml`을 통해 `full_ci`를 결정한다.
`pr-trusted.yml`의 job은 12개다 (직접 확인):

| job | `full_ci` 조건 | 실행 내용 |
|---|---|---|
| `gate` | 항상 | `full_ci`·러너·CI 프로파일 결정 |
| `policy` | 항상 | §2-3 |
| `typecheck_release_registry` | true일 때만 | `pnpm run typecheck:build-gaps` + `pnpm run test:release-registry` |
| `general_tests` | true일 때만 | `pnpm test:run:general` — **19 레인** (server 12 + chat 3 + workspaces-a 2 + workspaces-b 1 + workspaces-c 1) |
| `verify_paperclip_runner` | true일 때만 | `check:static`, `check:runner`(Rust), vitest ×2 — 4 레인 |
| `build` | true일 때만 | `pnpm build` |
| `docker_context_integrity` | true일 때만 | docker 컨텍스트 검사 |
| `verify_serialized_server` | true일 때만 | `pnpm test:run:serialized` — 9 샤드 |
| `canary_dry_run` | true일 때만 | `./scripts/release.sh canary --skip-verify --dry-run` |
| `e2e_shards` | true일 때만 | `pnpm run test:e2e` — 8 샤드 (`scripts/e2e-shard.mjs`로 분할) |
| `verify` | 항상 (`if: always()`) | 집계 |
| `e2e` | — | e2e 집계 |

**`verify` job의 실제 판정 로직** (L587-626, 직접 확인). 주석에
"Preserve the legacy required-check name"이라고 적혀 있다 — 즉 이 이름이
브랜치 보호에 등록된 체크일 가능성이 높다:

- `policy`는 **항상** success여야 한다.
- `full_ci == true` → `typecheck_release_registry`, `general_tests`,
  `verify_paperclip_runner`, `build`, `docker_context_integrity`가 전부 success.
- `full_ci == false` → 위 다섯 개가 전부 **`skipped`여야 통과한다.**

→ **`verify`가 초록인데 full CI가 false였다면, 그 초록은 "아무것도 돌지 않았음"을
증명한 것이다.** 테스트 통과가 아니다.

`verify_serialized_server`와 `canary_dry_run`은 **`verify`의 `needs`에 없다.**
이 두 job의 실패가 `verify`를 떨어뜨리지 않는다. 각각이 개별 필수 체크로
등록돼 있지 않으면 빨간불로 머지될 수 있다 — 등록 여부는 확인하지 못했다(§7-1).

**full CI가 건너뛰어지는 경우** — 리뷰어가 반드시 확인할 것:
- `releases/v*.md` / `releases/beta/v*.md` 만 바뀐 PR
- 스택 PR의 중간 PR (가장 아래 미머지 PR이 아닌 경우)
- 작성자/발신자가 허용 목록에 없는 경우

→ 이 경우 **초록불은 "테스트 통과"가 아니라 "테스트 안 함"이다.**

### 2-6. PR CI에 **없는** 게이트 — 전부 리뷰어 몫

| 게이트 | 상태 | 영향 |
|---|---|---|
| `pnpm check:token-gates` | `.github/` 어디에도 없음. `docker-runner-check.yml`에만 등장 | **`DESIGN.md` 원칙 2(토큰 전용)가 PR에서 강제되지 않는다** |
| `pnpm check:tokens` (`check-forbidden-tokens.mjs`) | 워크플로에서 발견 안 됨 | 금지 토큰 미검사 |
| ESLint | 설정 파일 자체가 없음 | 린트 미검사 |
| Storybook 시각 스냅샷 | `storybook-visual` **라벨**이 붙은 PR만 | 시각 회귀 미검사 |
| Greptile 5/5 | 사람이 확인 | `CONTRIBUTING.md` 머지 조건 |
| 필수 체크(required status checks) 설정 | 저장소 파일에 없음 → **확인 불가** (§7) | 어떤 job이 실제 머지를 막는지 미확정 |

---

## 3. 경로별 규칙 — 변경 파일로 찾아 읽는다

`AGENTS.md` §2는 **파일을 고치거나 리뷰하기 전에** 해당 `rules/*.mdc`를 읽으라고
요구한다. 각 규칙에는 자체 "Review criteria" 절이 있다.

| 변경 경로 | 읽을 규칙 | 리뷰에서 걸러야 할 것 |
|---|---|---|
| (전역) | `pull-request-review.mdc` | PR 설명 누락, 검증 실패 은폐, 1000줄 교차 |
| (전역) | `product-harness-responsibility.mdc` | 오케스트레이션 공백을 사용자 체크리스트로 떠넘김, 결정에 쓰이지 않는 내부 식별자 노출, 일어나지 않은 진행 암시 |
| `server/src/services/heartbeat.ts`<br>`server/src/services/heartbeat/**`<br>`server/src/services/heartbeat-*.ts`<br>`server/src/__tests__/heartbeat-*.test.ts` | `heartbeat-execution-boundaries.mdc` | 코디네이터 재성장, 정책의 소유자 중복, 실행 권한 약화, 복구 가능 작업 유실, 완료와 자원 정리 혼동. 모듈 책임 표가 규칙 안에 있다 |
| `server/src/services/chat-channels.ts`<br>`server/src/services/chat-channels/**` | `chat-channel-platform-boundaries.mdc` | 공유 워크플로에 플랫폼 구현 유입, 플랫폼 간 직접 의존, 공유 계약에 raw payload/SDK 타입 노출 |
| `packages/db/src/schema/**`<br>`packages/db/src/migrations/**`<br>`packages/db/package.json`<br>`packages/db/drizzle.config.ts` | `database-migration-snapshots.mdc` | **스냅샷 6개 이상**, 최신 5개에 들어야 할 스냅샷 삭제, 프루닝된 스냅샷 복원, 프루닝 과정에서 SQL/journal 제거. **추가분만 보지 말고 결과 트리를 볼 것** |
| `server/src/**`<br>`packages/adapter-utils/src/**`<br>`packages/adapters/*/src/**`<br>`packages/paperclip-runner/src/**`<br>`packages/paperclip-runner/runner/**` | `runtime-dependency-boundaries.mdc` | 시작/요청/루프 경로에 의존성 호출 추가 시 비용 근거 부재, 목(mock)이 타이밍·취소·경합을 지워버린 테스트 |

프런트엔드 변경은 `DESIGN.md`가 기준이다. 원칙 1(컴포넌트 중복 금지),
2(토큰 전용), 5(상태 토큰 체계), 7(용어 — 정식 용어는 *task*)이 리뷰 대상이다.
단, **원칙 7의 issue→task 개명은 명시적으로 현재 범위 밖**이므로 기존 "issue"
표기를 지적하지 말 것.

---

## 4. 기계가 안 보는 하드 규칙 — 리뷰어가 반드시 본다

출처를 함께 적었다. 지적할 때 출처를 인용한다.

1. **코드 주석 금지.** `CONTRIBUTING.md`:
   "Do not submit a PR that includes code comments."
   → 추가된 주석은 지적 대상이다. 기계 검사 없음.
2. **1000줄 교차.** `CONTRIBUTING.md` + `pull-request-review.mdc`:
   파일이 1,000줄 **미만에서 초과로 넘어가는 경우만** 구체적 사유를 요구한다.
   이미 1,000줄을 넘은 파일에 대한 무관한 정리는 요구하지 않는다.
3. **스크린샷을 요구하지 말 것.** `pull-request-review.mdc`:
   이 저장소 규칙이 "시각 변경에 스크린샷을 요구하라"는 상위 조직 지침을
   **덮어쓴다.** 시각 상태는 컴포넌트 테스트, PR 본문의 상태 열거,
   기존 디자인 토큰 사용으로 검증한다.
4. **검증 실패 보존.** `pull-request-review.mdc` →
   `.agents/skills/verify-paperclip/SKILL.md#preserve-failures-through-acceptance`:
   재시도가 통과했다고 앞선 실패를 지우면 안 된다. 원인 불명이면 불명이라고
   적어야 하고, 통과한 재시도만으로 인프라 장애를 추론할 수 없다.
   → **"재시도하니 통과했습니다"로 끝난 Verification은 불완전하다.**
5. **내부 티켓 참조 금지.** `CONTRIBUTING.md`:
   `PAPA-123` 류 `{PREFIX}-{NUMBER}`, `/PAP/issues/...`, `agent://...`,
   localhost·사설IP·tailnet URL이 제목/본문/커밋/코멘트에 있으면 안 된다.
   → 소프트캣 `SOF-2` 같은 내부 ID도 여기에 해당한다.
6. **브랜치명.** 내부 티켓 id나 인스턴스 유래 슬러그가 들어가면 안 된다.
   kebab-case로 변경 내용을 설명해야 한다.
7. **스크린샷을 저장소에 커밋하지 말 것.** `docs/pr-screenshots/` 아래 커밋 금지.
   단, `doc/` 가이드에 포함된 제품 문서용 이미지는 허용.
   ⚠️ 현재 저장소에 `docs/pr-screenshots/` 아래 디렉터리가 **11개 이미 커밋돼
   있다** (`pap-2837`, `pap-2944`, `pap-2945`, `pr-4616`, `pr-5291`, `pr-5356`,
   `pr-5428`, `pr-6384`, `pr-15695`, `pr-15731`, `pr-15773` — 기준 `f2ffcf3a0`,
   `git ls-files docs/pr-screenshots`). 규약과 현재 상태가 어긋나 있으니
   신규 추가만 지적한다.
8. **세 가지 데이터 경로를 구분.** `AGENTS.md` §5 규칙 7 — 경로로 판단하고
   단어로 판단하지 말 것:
   - **Telemetry** (`packages/shared/src/telemetry/**`) → **엄격 리뷰.**
     생성 계약 먼저 갱신, 같은 PR에서 `telemetry/README.md` 갱신, 프라이버시 리뷰 요청.
     기본값이 opt-out이고 Paperclip 엔드포인트로 즉시 전송된다.
   - **Observability** (`server/src/instrumentation.ts`,
     `packages/adapter-utils/src/duplex-observability.ts`,
     `server/src/services/duplex-observability-recorder.ts`,
     `acpx-engine/startup-timing.ts`, `doc/observability.md`
     — 목록은 `AGENTS.md:129-134`) → **가벼운 리뷰.**
     span 속성 allowlist 안에 머물면 프라이버시 리뷰 불필요.
   - **run log** (`packages/db/src/schema/heartbeat_run_events.ts`,
     `appendRunEvent`, `doc/run-log-events.md`) → **추가 리뷰 불필요.**
     단, run-log 이벤트 추가·변경 시 `doc/run-log-events.md`를 같은 PR에서 갱신.
   - `server/src/services/recovery-observability.ts`처럼 이름만 겹치는 파일은
     이 규칙 대상이 아니다.
9. **회사 스코프.** `AGENTS.md` §5 규칙 1 — 모든 도메인 엔티티는 회사 단위로
   스코프되고 라우트/서비스에서 경계를 강제해야 한다.
   명시적 예외: 공지 해제(announcement dismissals)는 인스턴스 전역 사용자 설정이고,
   공지 발행 ID 레지스트리는 인스턴스 레벨 메타데이터다.
10. **계약 동기화.** `AGENTS.md` §5 규칙 2 — 스키마/API를 바꿨으면
    `packages/db` → `packages/shared` → `server` → `ui` 네 층을 전부 갱신해야 한다.
    → **한 층만 바뀐 PR은 계약 불일치 의심.**
11. **새 엔드포인트 요건.** `AGENTS.md` §8 — 회사 접근 검사, 액터 권한(board vs agent),
    변경 작업의 activity log 기록, 일관된 HTTP 에러(`400/401/403/404/409/422/500`).
12. **PR 본문 문체.** ASD-STE100(Simplified Technical English) —
    짧은 문장, 한 문장 한 지시, 능동태 (`CONTRIBUTING.md:173`,
    `.github/PULL_REQUEST_TEMPLATE.md:1`). **Thinking Path 5~8단계**의 출처는
    `CONTRIBUTING.md`가 아니라 `.github/PULL_REQUEST_TEMPLATE.md:9`다
    (`CONTRIBUTING.md:175-197`은 단계 수 없이 예시만 준다).
13. **기능 PR.** `ROADMAP.md` 확인 + Discord `#dev` 사전 논의가 요구된다.
    조율되지 않은 코어 기능 PR은 품질과 무관하게 닫힐 수 있다.

---

## 5. 데이터베이스 변경 리뷰 절차

`AGENTS.md` §6 + `database-migration-snapshots.mdc`.

1. `packages/db/src/schema/*.ts` 수정
2. 신규 테이블이 `packages/db/src/schema/index.ts`에서 export 되는가
3. `pnpm db:generate`로 생성 (드리즐 설정은 `dist/schema/*.js`를 읽으므로
   손으로 만든 마이그레이션은 재현되지 않는다)
4. 스냅샷은 최신 5개만 남는다. 삭제분을 같은 PR에 포함해야 하고,
   diff를 줄이려고 복원하면 안 된다
5. 리베이스·체리픽·머지 후에 스냅샷 개수를 **다시** 확인 (머지 전에 맞았던 브랜치가
   머지 후에 초과할 수 있다)
6. `pnpm --filter @paperclipai/db check:migrations`는 SQL 번호와 journal만 검증한다.
   **스냅샷 보존 개수는 검증하지 않으므로 리뷰어가 눈으로 센다**
7. CI의 `check-pr-migration-order.mjs`가 번호 순서를 잡는다

---

## 6. 자주 깨지는 지점 — 실측

커밋 제목이 `fix`/`revert`/`hotfix`로 시작하는 커밋이 건드린 파일을 집계했다.
구간: 2026-07-16 ~ 2026-10-16. 전체 2,187 커밋 중 940건(43%)이 수정 커밋.

### 파일 (수정 커밋 접촉 횟수 / 현재 줄 수)

| 횟수 | 파일 | 줄 |
|---:|---|---:|
| 141 | `server/src/services/heartbeat.ts` | 3,956 |
| 68 | `server/src/services/native-runtime/native-session-executor.ts` | 13,407 |
| 60 | `server/src/routes/issues.ts` | 18,821 |
| 55 | `.../native-session-executor.test.ts` | — |
| 48 | `server/src/__tests__/heartbeat-process-recovery.test.ts` | — |
| 47 | `ui/src/pages/IssueDetail.tsx` | 8,402 |
| 44 | `server/src/services/issues.ts` | 13,121 |
| 42 | `server/src/services/recovery/service.ts` | 6,078 |
| 38 | `ui/src/components/TaskChatThread.tsx` | 3,206 |
| 37 | `packages/paperclip-runner/src/live/runnerd-codex-transport.ts` | 7,310 |
| 36 | `server/src/routes/agents.ts` | — |
| 34 | `packages/adapter-utils/src/acpx-engine/execute.ts` | 5,496 |
| 31 | `packages/shared/src/index.ts` | — |
| 28 | `packages/adapter-utils/src/execution-target.ts` | — |

(문서 파일 `doc/DEVELOPING.md` 77회, `doc/execution-semantics.md` 74회,
`doc/SPEC-implementation.md` 60회, `doc/observability.md` 35회,
`doc/run-log-events.md` 31회도 상위에 있다. 코드 변경과 **같은 PR에서** 문서를
갱신하는 관행이 정착돼 있다는 뜻이므로, 이 파일들을 건드리는 변경에
문서 갱신이 없으면 그 자체가 신호다.)

### 디렉터리

| 횟수 | 경로 |
|---:|---|
| 1,660 | `server/src/services` |
| 996 | `server/src/__tests__` |
| 911 | `ui/src/components` |
| 633 | `packages/paperclip-runner/src` |
| 394 | `packages/adapter-utils/src` |
| 328 | `ui/src/pages` |
| 307 | `packages/shared/src` |
| 241 | `ui/src/lib` |
| 195 | `packages/paperclip-runner/runner` |
| 192 | `server/src/routes` |
| 161 | `packages/db/src` |

### 리뷰에 쓰는 방법

- 상위 핫스팟은 **이미 3,000~18,800줄**이다. 1000줄 교차 규칙은 발동하지 않는다.
  대신 `heartbeat-execution-boundaries.mdc`의 응집도 기준과
  "코디네이터를 다시 키우지 말 것" 항목을 적용한다.
- **heartbeat / native-runtime / recovery 세 축이 반복 수정의 중심이다.**
  세 축은 서로 라이프사이클을 공유한다(실행 권한, 소유권, 완료, 복구).
  이 영역 변경에는 취소·경합·부분 실패·재시작 케이스의 **관찰 가능한 동작**
  테스트를 요구한다. 헬퍼 호출 여부만 단정하는 테스트는 불충분하다
  (해당 규칙의 "Verification and review" 절).
- 수정 커밋이 소스와 테스트를 **쌍으로** 건드린 흔적이 뚜렷하다
  (`native-session-executor.ts` 68 / `.test.ts` 55,
  `TaskChatThread.tsx` 38 / `.test.tsx` 37, `execute.ts` 34 / `.test.ts` 32).
  → 이 파일들의 소스를 고치면서 테스트를 안 건드린 PR은 근거를 물어야 한다.
- `packages/shared/src/index.ts`가 31회 → 계약 동기화 규칙(§4-10)의
  실제 고장 지점이다. shared만 바뀌었거나 shared만 안 바뀌었으면 의심한다.

---

## 7. 확인하지 못한 범위

**이 절을 빼고 이 문서를 인용하지 말 것.**

1. **머지를 실제로 막는 체크가 무엇인지 확인하지 못했다.** GitHub 브랜치 보호의
   required status checks 설정은 저장소 파일에 없다. §2의 "항상/조건부" 구분은
   워크플로 트리거 기준이고, 그중 어느 job이 필수인지는 미확인.
2. **`pr-trusted.yml`(79KB) 전문을 읽지 않았다 — 일부만 직접 확인했다.**
   - 직접 확인함: job 12개 이름과 `needs`/`if` 조건, `verify` 판정 로직(L587-626),
     `general_tests` 19 레인 매트릭스(L347-443), `e2e_shards` 8샤드(L1444-),
     `verify_serialized_server` 9샤드.
   - 추가로 직접 확인함(2026-10-16 재대조): §2-3 `policy` job의 15개 검증 단계와
     실행 순서(L86-137), 락파일 하드 차단 단계(L57-68), §2-4 commitperclip이
     `exit 1`로 job을 떨어뜨리는 경로(`commitperclip-review.yml:49,57-63`).
   - 하위 조사 에이전트 보고를 옮긴 부분: `ci-routing.yml`의 `full_ci` 결정 조건.
     **미확인이다.**
   - `check:token-gates`/ESLint 부재는 `.github/` 및 `git ls-files` 직접 확인.
3. **`.greptile/` 설정 내용을 확인하지 않았다.** Greptile 5/5가 구체적으로 무엇을
   요구하는지는 이 문서 범위 밖이다.
4. **수정 커밋 분류는 커밋 제목 prefix에만 의존한다.** squash merge 제목을
   신뢰한 결과이므로, prefix 없이 머지된 수정이나 `feat:`로 들어온 수정은
   누락됐다. 43%는 하한이다.
5. **`doc/UNTRUSTED-PR-REVIEW.md`를 읽지 않았다.** 외부 기여자 PR 리뷰에
   별도 절차가 있을 수 있다. 외부 PR을 리뷰하기 전에 확인할 것.
6. **중첩 `AGENTS.md`를 전수 확인하지 않았다.**
   `packages/adapter-utils/src/acpx-engine/AGENTS.md`,
   `packages/paperclip-runner/src/drivers/codex/AGENTS.md` 두 개는 존재를
   확인했지만 내용을 읽지 않았다. 해당 경로 변경 시 반드시 읽을 것.
7. **어떤 명령도 실제로 실행해보지 않았다.** 명령 목록은 `package.json`과
   워크플로 파일을 읽은 결과다. 실행 결과·소요 시간·현재 통과 여부는 미확인.
8. **이 포크의 소프트캣 추가분**(`companies/`, `mvp/`, `skills/kr-*`)에는
   업스트림 규약이 적용되지 않는다. 이 영역의 리뷰 기준은 아직 정해지지 않았다.
9. `maps/`(feature-map, agent-access-map, storybook-map) 계약과
   `node scripts/check-maps.mjs`는 존재만 확인했고 리뷰 기준으로 정리하지 않았다.
   `AGENTS.md` §7에 따르면 맵 수정 시 실행이 요구된다.

---

## 참고 출처

- `AGENTS.md` — §5 핵심 규칙, §6 DB 절차, §7 검증, §8 API, §10 PR, §11 완료 정의
- `CONTRIBUTING.md` — PR 요건, 내부 참조 금지, 브랜치명, 주석 금지, Greptile
- `DESIGN.md` — 토큰 레이어, 8개 원칙, 범위 밖 항목
- `rules/*.mdc` — 6개 규칙, 각각 Review criteria 절 보유
- `.github/PULL_REQUEST_TEMPLATE.md` — 필수 섹션, 체크리스트 14항목
- `.github/workflows/pr.yml`, `pr-trusted.yml`, `ci-routing.yml`,
  `commitperclip-review.yml`, `storybook-visual.yml`
- `.github/scripts/*.mjs` — commitperclip 품질 게이트 8종
- `.agents/skills/verify-paperclip/SKILL.md` — 검증 실패 보존
- `package.json` — 스크립트 전체
