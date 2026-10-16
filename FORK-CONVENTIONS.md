# FORK-CONVENTIONS.md — 포크 추가분 규약

이 저장소는 업스트림 [`paperclipai/paperclip`](https://github.com/paperclipai/paperclip)의
포크다. 포크가 **추가한** 네 디렉터리는 업스트림 규약(`AGENTS.md`,
`CONTRIBUTING.md`, `DESIGN.md`, `rules/*.mdc`)에 등장하지 않는다. 그래서 이 영역의
PR을 판단할 기준이 없었다. 이 문서가 그 기준이다.

| 디렉터리 | 무엇인가 |
|---|---|
| [`companies/`](#1-companies--회사-패키지) | 이식 가능한 회사 패키지 — `company import`의 입력 |
| [`mvp/`](#2-mvp--포크-설계측정운영-문서) | 이 포크의 설계·측정·운영 문서 |
| [`skills/kr-*`](#3-skillskr---한국어-운영-스킬) | 한국어 운영 스킬 |
| [`scripts/kr/`](#4-scriptskr--한국어화-도구) | 한국어화 도구 |

---

## 0. 이 문서의 위치

1. **업스트림 규약이 기본값이다.** 이 문서는 추가분만 다루며 업스트림 규칙을
   덮어쓰지 않는다. 업스트림 규칙과 현재 상태가 어긋나는 지점은 §6에
   **열린 질문으로 남겼다** — 임의로 예외를 만들지 않았다.
2. **업스트림 파일은 최소로 건드린다.** 이 저장소는 업스트림을 주기적으로
   머지한다. `AGENTS.md` 같은 공유 파일을 고치면 머지마다 충돌한다.
   → 포크 규약 본문은 이 파일에 쓰고, 업스트림 파일에는 **한 줄 포인터까지만**
   둔다. 현재 포인터는 `AGENTS.md` §3 Repo Map의 한 줄뿐이다.
3. 네 디렉터리는 업스트림에 **존재하지 않으므로** 그 안의 변경은 머지 충돌을
   만들지 않는다. **포크 변경은 가능하면 이 네 곳에서 끝낸다.**

업스트림 리뷰 기준(검증 명령이 무엇을 증명하는지, 어떤 게이트가 CI에 없는지,
어느 파일이 핫스팟인지)은 `skills/kr-code-review/references/repo-facts.md`에 있다.
이 문서와 역할이 겹치지 않는다.

---

## 1. `companies/` — 회사 패키지

### 1-1. 들어가는 것

회사 하나가 디렉터리 하나다. 현재 `companies/softcat/` 하나뿐이다.

```
companies/<회사>/
  COMPANY.md                       필수 — 회사·목표·운영 원칙
  README.md                        사람이 읽는 패키지 설명 (손으로 쓴 문서 — 1-3 ⑥ 주의)
  LICENSE
  .paperclip.yaml                  schema: paperclip/v1 — 어댑터·루틴 등 런타임 설정
  agents/<slug>/AGENTS.md          에이전트 1명당 1개
  projects/<slug>/PROJECT.md       프로젝트
  projects/<slug>/tasks/<slug>/TASK.md
  tasks/<slug>/TASK.md             프로젝트에 속하지 않는 회사 레벨 작업
  skills/<slug>/SKILL.md           패키지에 담아 보내는 스킬 (+ references/)
```

`.paperclip.yaml`은 **기본 패키지 형식에 담을 수 없는 런타임 설정만** 담는다
(어댑터 종류, 필요한 환경변수 선언, 루틴 트리거). 그 외 정보는 마크다운에 쓴다.

### 1-2. 들어가면 안 되는 것

- **비밀정보 값.** `.paperclip.yaml`은 **요구만** 선언한다
  (`kind: secret`, `requirement: optional`). 토큰·키의 실제 값은 넣지 않는다.
- **생성된 zip.** 화면 import는 `.zip`만 받지만, zip은 필요할 때마다 다시 만든다
  (`companies/softcat/README.md`). 커밋하면 원본과 갈라지고, 낡은 zip을
  import하는 함정이 된다.
- **인스턴스 유래 식별자** — 회사·에이전트·작업 UUID, 내부 작업 id(`SOF-4` 등).
  → §2-2의 격리 규칙을 따른다.
- 실행 로그, 실행 산출물, 코드.

### 1-3. 바꿀 때 지킬 것

1. **에이전트의 `skills:` 항목은 패키지 안에 있어야 한다.** 없으면 import가
   경고를 낸다 — 에러는 아니다
   (`server/src/services/company-portability.ts:4925-4930`).
   - **예외:** `paperclip`은 앱이 기본 제공하므로 패키지에 담지 않는다.
     따라서 `paperclip`에 대한 이 경고는 **예상된 것**이고 고칠 필요가 없다.
   - **`kr-*` 스킬은 앱이 제공하지 않는다.** 반드시
     `companies/<회사>/skills/` 에 담아야 한다. 이것이 스킬 사본이
     두 벌 존재하는 이유다 → §3-3.
2. **`TASK.md` frontmatter의 `assignee`·`project`는 실제 slug여야 한다.**
   `assignee: engineer` → `agents/engineer/` 가 있어야 한다.
   `project: code-review-automation` → `projects/code-review-automation/` 가
   있어야 한다.
3. **`.paperclip.yaml`의 `agents:` 키는 `agents/` 하위 디렉터리와 1:1.**
   한쪽만 늘리면 어댑터 설정이 없는 에이전트 또는 존재하지 않는 에이전트의
   설정이 생긴다.
4. **`kind:`는 생략해도 된다. 넣는다면 종류와 일치해야 한다**
   (`agent` / `project` / `task`). 값이 틀리면 경고가 난다
   (`company-portability.ts:3283`, `:3425`, `:3492`). 현재 softcat 패키지는
   `kind:`를 쓰지 않는다 — 생략은 경고 대상이 아니다.
5. **작업·프로젝트·에이전트를 추가하면 `README.md`의 "들어있는 것"과
   "시작 작업"을 같은 PR에서 갱신한다.** 패키지 README는 생성물이 아니라
   손으로 쓴 문서라서 자동으로 따라오지 않는다. 현재 드리프트가 있다(§6-1).
6. ⚠️ **`scripts/generate-company-assets.ts`를 `companies/`에 돌리지 말 것.**
   이 스크립트는 각 패키지의 `README.md`를 **덮어쓰고**
   `images/org-chart.png`를 쓴다 (`:328-352`). softcat의 README는 손으로 쓴
   문서이므로 실행하면 내용이 사라진다. 이 스크립트는 외부 회사 패키지
   저장소를 인자로 받도록 만들어진 도구다.

### 1-4. 검증

```sh
# ① 구조 — 필수 파일이 있는가
git ls-files companies/softcat

# ② frontmatter 상호 참조 — assignee / project / skills slug를 ①의 목록과 대조
git grep -nE "^(assignee|project|skills):" -- companies/softcat

# ③ 실제 판정 — API 서버가 떠 있어야 한다 (/api/companies/import/preview 호출)
paperclipai company import ./companies/softcat --dry-run
```

**오프라인 검증기는 없다.** ①②는 사람이 대조하는 보조 수단이고, 패키지가
실제로 import 가능한지는 ③만이 증명한다. ③은 네트워크와 실행 중인 인스턴스를
요구하므로 CI에서 돌지 않는다 → 이 영역은 **리뷰어 몫**이다(§6-3).

---

## 2. `mvp/` — 포크 설계·측정·운영 문서

### 2-1. 들어가는 것

이 포크를 왜·어떻게 만들었는지 적은 문서. 현재 7개.

| 파일 | 역할 |
|---|---|
| `00-UPSTREAM-ANALYSIS.md` | 업스트림 분석 |
| `01-MVP-DESIGN.md` | MVP 설계서 |
| `02-I18N-MEASUREMENT.md` | 한국어화 작업량 실측 |
| `03-ORG-CHART.md` | 에이전트 조직도 설계 |
| `glossary-ko.md` | 한국어 용어집 — 번역 용어의 단일 출처 |
| `RUNNING.md` | 로컬 구동 가이드 |
| `OPS-HANDOFF.md` | 운영 인수인계 — 인스턴스 로컬 상태 격리 파일(§2-2) |

**파일명.** 순번이 있는 설계 문서는 `NN-SLUG.md`(대문자 kebab)를 쓴다.
순번 없는 상설 문서는 `SLUG.md`를 기본으로 한다. `glossary-ko.md`만 소문자
예외이고, 이미 여러 문서가 참조하므로 이름을 바꾸지 않는다.

### 2-2. 들어가면 안 되는 것

- **계획 문서.** `AGENTS.md` §5-5는 저장소 계획 문서를
  `doc/plans/YYYY-MM-DD-slug.md`에 두라고 요구한다. Paperclip 작업이 계획을
  요구하면 작업의 `plan` 문서를 쓴다. **`mvp/`는 설계·측정·운영 문서 전용이고
  계획 문서의 대체 위치가 아니다.**
- **업스트림 제품 문서.** `doc/`는 업스트림 소유다. 업스트림 동작을 설명하는
  문서는 `doc/`에 속한다(단 §0-2를 따른다). `mvp/`에는 이 포크 고유의 결정만 적는다.
- **리뷰 증거 스크린샷·화면 녹화.** `CONTRIBUTING.md`("Keep Screenshots Out of
  the Repo")가 금지한다. 다이어그램이 필요하면 기존 문서처럼 ASCII로 그린다.
- **원본 실행 로그와 대용량 산출물.** 측정 문서에는 방법·재현 명령·요약만 적는다.
- **비밀정보.**
- **인스턴스 로컬 상태 — 격리 규칙.** 내부 작업 id(`SOF-4` 등), 인스턴스
  UUID, `127.0.0.1`/tailnet 주소는 **`mvp/OPS-HANDOFF.md` 한 파일에만** 둔다.
  다른 문서·스킬·회사 패키지·스크립트에는 넣지 않는다.
  **커밋 메시지와 PR 제목·본문·코멘트에는 어디서든 금지**다(`CONTRIBUTING.md`).
  한 파일로 몰아두는 이유: 업스트림에 기여할 수 없는 내용을 한곳에 모아두면
  무엇을 지워야 하는지가 명확해진다.
  (`localhost:3100` 같은 **개발 지시용** 주소는 금지 대상이 아니다. 업스트림
  `AGENTS.md` §4도 그 주소를 쓴다. 금지 대상은 인스턴스 **상태**를 가리키는 참조다.)

### 2-3. 바꿀 때 지킬 것

1. **수치에는 기준 커밋과 측정 구간을 함께 적는다.** 기존 관행:
   `mvp/02-I18N-MEASUREMENT.md:3-5`,
   `skills/kr-code-review/references/repo-facts.md` 머리말.
   기준이 없는 수치는 재확인할 방법이 없으므로 리뷰에서 지적 대상이다.
2. **재현 명령을 적고, 적은 명령은 실제로 실행되는 명령이어야 한다.**
3. **존재하지 않는 도구를 현재형으로 쓰지 않는다.** 계획이면 "계획"이라고 적는다.
   현재 `mvp/glossary-ko.md:4`가 `scripts/kr/translate-locale.mjs`를 현재형으로
   서술하지만 그 파일은 없다(§6-2).
4. **`mvp/glossary-ko.md`는 번역 용어의 단일 출처다.** 새 용어는 다른 문서보다
   먼저 여기에 추가한다. 상태값 표는 `DESIGN.md` 원칙 5(상태 어휘는 전 화면
   동일)와 어긋나면 안 된다.
5. **`mvp/03-ORG-CHART.md`와 `companies/softcat/`이 어긋나면 안 된다.**
   둘 다 에이전트 4명·권한·루틴을 서술한다. 조직을 바꾸면 **같은 PR에서**
   양쪽을 바꾼다. 어긋나면 사람이 어느 쪽을 믿어야 할지 알 수 없다.

### 2-4. 검증

```sh
# ① 문서가 참조하는 scripts/kr 파일이 실제로 있는가 — 두 출력을 대조한다
git grep -ohE "scripts/kr/[a-z0-9-]+\.mjs" -- mvp skills/kr-code-review companies scripts/kr
git ls-files scripts/kr

# ② 인스턴스 로컬 참조 격리 — 출력이 없어야 한다 (격리 파일만 제외)
git grep -nE "\b[A-Z]{2,5}-[0-9]+\b" -- companies mvp skills/kr-code-review scripts/kr ":(exclude)mvp/OPS-HANDOFF.md"
```

②는 일치하는 줄이 없을 때 종료 코드 1을 돌려준다. **출력이 비어 있으면 통과다.**

---

## 3. `skills/kr-*` — 한국어 운영 스킬

### 3-1. 들어가는 것

루트 `skills/`는 **업스트림 디렉터리**다(`AGENTS.md` §3:
"Paperclip runtime/operational skills"). 포크 스킬은 업스트림 스킬과 이름이
부딪히지 않도록 **`kr-` 접두사**를 쓴다. 현재 `skills/kr-code-review/` 하나뿐이다.

```
skills/kr-<슬러그>/
  SKILL.md           YAML frontmatter(name, description) + 본문
  references/*.md    긴 참고 문서 (체크리스트, 저장소 사실 등)
```

`SKILL.md`의 `name`은 **디렉터리명과 같아야 한다.**

### 3-2. 들어가면 안 되는 것

- **업스트림 스킬 수정.** `skills/paperclip/`, `skills/slack/` 등은 업스트림
  소유다. 고치면 머지마다 충돌한다. 필요하면 `kr-*` 스킬을 새로 만든다.
- **앱 카탈로그 등록.** `packages/skills-catalog/`는 업스트림 소유다.
  포크 스킬을 그쪽에 넣지 않는다.
- 코드, 비밀정보, 인스턴스 로컬 참조(§2-2), 실행 로그.

### 3-3. 바꿀 때 지킬 것 — **사본 두 벌을 반드시 함께 고친다**

`skills/kr-code-review/` 와 `companies/softcat/skills/kr-code-review/` 는
**내용이 같아야 한다.** 현재(커밋 기준) 같다.

사본이 두 벌인 이유는 두 경로가 서로 다른 소비자를 갖기 때문이다.

| 경로 | 소비자 |
|---|---|
| `skills/kr-code-review/` | 저장소의 운영 스킬 위치(`AGENTS.md` §3). 릴리스된 `server` 패키지에 포함된다 (`server/package.json`의 `files: ["dist","ui-dist","skills"]`) |
| `companies/softcat/skills/kr-code-review/` | `company import`로 들어가는 패키지 사본. 앱이 제공하지 않는 스킬은 패키지에 담겨야 한다(§1-3 ①) |

→ **한쪽만 고치면 import된 회사의 스킬과 저장소의 스킬이 갈라진다.**
갈라진 뒤에는 리뷰어가 어느 쪽을 따랐는지 알 수 없다. **같은 PR에서 둘을
함께 고친다.**

사본을 하나로 합치는 일(심볼릭 링크, 생성 단계 등)은 이 문서 범위 밖이다(§6-4).

### 3-4. 검증

```sh
# 두 사본이 같은가 — 출력이 없고 종료 코드가 0이어야 통과
git diff --no-index --stat skills/kr-code-review companies/softcat/skills/kr-code-review
```

드리프트가 있으면 이 명령이 파일별 차이를 출력하고 종료 코드 1을 돌려준다.
**이 검사는 CI에 없다. 리뷰어가 직접 돌려야 한다.**

---

## 4. `scripts/kr/` — 한국어화 도구

### 4-1. 들어가는 것

한국어화 작업에 쓰는 Node 스크립트. 현재 `extract-strings.mjs` 하나뿐이다.
읽기 전용 측정 도구다.

```sh
pnpm install                                          # @babel/parser·traverse가 루트 devDependencies에 있다
node scripts/kr/extract-strings.mjs                   # 요약
node scripts/kr/extract-strings.mjs --json out.json   # 키 맵 출력
node scripts/kr/extract-strings.mjs --dir ui/src/pages
```

### 4-2. 들어가면 안 되는 것

- **루트 `package.json`에 포크 전용 `scripts` 항목을 추가하지 않는다.**
  업스트림 파일이고 머지 충돌 지점이다. `node scripts/kr/<파일>`로 직접 호출한다.
- **새 의존성을 추가하지 않는다.** `pnpm-lock.yaml` 수정은 `dependabot[bot]`
  또는 `chore/refresh-lockfile` 브랜치가 아니면 CI `policy` job에서 **거부된다**
  (`skills/kr-code-review/references/repo-facts.md` §2-3). 이미 루트에 선언된
  의존성만 쓴다.
- **저장소를 수정하는 동작을 기본값으로 두지 않는다.** 측정과 치환을 한 파일에
  섞지 않는다. 치환 도구는 별도 파일로 만들고, 쓰기 경로를 인자로 받는다.
  (`extract-strings.mjs`는 헤더에 "아무것도 수정하지 않는다"를 명시한다.)
- **출력 산출물을 커밋하지 않는다** (`out.json` 등).
- 비밀정보, 인스턴스 로컬 참조(§2-2).

### 4-3. 바꿀 때 지킬 것

1. **측정 도구의 한계를 헤더에 적는다.** `extract-strings.mjs`는 오탐
   가능성(전부 소문자인 진짜 UI 문구가 클래스명으로 걸러질 수 있음)을 헤더에
   적어 두었다. 수치를 쓰는 사람이 오차를 알아야 하므로 이 관행을 유지한다.
2. **문서가 참조하는 파일명과 실제 파일명을 일치시킨다**(§2-3 ③, §6-2).
3. **코드 주석:** `CONTRIBUTING.md`는 모든 PR에 대해
   "Do not submit a PR that includes code comments"를 요구한다. 현재
   `scripts/kr/extract-strings.mjs`는 주석을 포함한 채 머지돼 있다.
   **이 문서는 예외를 만들지 않는다** — 예외를 만들 권한은 사람에게 있다(§6-5).
   결정이 나기 전까지는 업스트림 규칙을 따른다: 신규·변경 코드에 주석을
   넣지 않는다. 기존 주석을 지우는 일은 이 규약의 요구사항이 아니다.

### 4-4. 검증

```sh
pnpm install
node scripts/kr/extract-strings.mjs --dir ui/src/pages
```

종료 코드 0과 요약 출력이 나와야 한다. `node_modules`가 없으면
`ERR_MODULE_NOT_FOUND`로 끝난다 — 스크립트의 결함이 아니라 설치 누락이다.

---

## 5. 검증 명령 요약

| 영역 | 명령 | 통과 조건 | CI에 있는가 |
|---|---|---|---|
| `companies/` 구조 | `git ls-files companies/softcat` | 사람이 대조 | ❌ |
| `companies/` import | `paperclipai company import ./companies/softcat --dry-run` | 에러 없음 (경고는 §1-3 ① 참고) | ❌ (서버 필요) |
| `mvp/` 참조 무결성 | `git grep -ohE "scripts/kr/[a-z0-9-]+\.mjs" -- mvp skills/kr-code-review companies scripts/kr` + `git ls-files scripts/kr` | 두 목록 일치 | ❌ |
| 인스턴스 참조 격리 | `git grep -nE "\b[A-Z]{2,5}-[0-9]+\b" -- companies mvp skills/kr-code-review scripts/kr ":(exclude)mvp/OPS-HANDOFF.md"` | 출력 없음 | ❌ |
| 스킬 사본 동기화 | `git diff --no-index --stat skills/kr-code-review companies/softcat/skills/kr-code-review` | 출력 없음, 종료 0 | ❌ |
| `scripts/kr/` 동작 | `node scripts/kr/extract-strings.mjs --dir ui/src/pages` | 종료 0 | ❌ |

**여섯 개 전부 CI에 없다.** 이 영역의 PR은 기계가 아무것도 검사하지 않는다.
리뷰어가 직접 돌려야 하고, 돌리지 않았으면 돌리지 않았다고 적어야 한다.

문서만 바꾸는 PR에는 `pnpm -r typecheck`·`pnpm test`를 요구하지 않는다.
`AGENTS.md` §7이 "가장 좁은 검증을 먼저" 하라고 요구한다. 단, 제목 prefix가
`docs:`인데 소스 파일을 바꾸면 commitperclip의 `check-pr-test-coverage.mjs`가
불일치로 실패시킨다 — 문서와 코드를 같은 PR에 섞지 않는다.

---

## 6. 열린 질문 — 이 문서가 결정하지 않은 것

**이 절을 빼고 이 문서를 인용하지 말 것.** 아래는 전부 사람의 결정이 필요하다.

1. **`companies/softcat/README.md` 드리프트.** README는 "시작 작업 2개"와
   `tasks/{repo-orientation,first-pr-review}`를 적고 있지만, 실제 작업
   디렉터리는 7개다(`786ad3c0f`에서 5개 추가). §1-3 ⑤의 규약은 세웠으나
   **기존 드리프트는 고치지 않았다** — 이 PR의 범위가 아니다. 별도 작업이 필요하다.
2. **존재하지 않는 스크립트 참조 2건.** `mvp/glossary-ko.md:4` →
   `scripts/kr/translate-locale.mjs`, `scripts/kr/extract-strings.mjs` 헤더 →
   `codemod-i18n.mjs`. 둘 다 파일이 없다. `mvp/01-MVP-DESIGN.md:93-102`는
   이 둘을 **계획**으로 적고 있어 문제가 없지만, 위 두 곳은 현재형으로
   서술한다. 문구를 고칠지 스크립트를 만들지는 결정되지 않았다.
3. **자동 검증기가 없다.** §5의 여섯 검사는 모두 손으로 돌린다.
   `scripts/kr/`에 검사 스크립트를 두면 자동화할 수 있으나, 그러면 이 PR이
   문서에서 코드로 넘어가고 테스트 요구가 붙는다(§5 마지막 문단).
   자동화는 별도 작업으로 다룬다.
4. **스킬 사본 두 벌을 유지할 것인가.** §3-3은 "둘을 함께 고친다"로 현재
   구조를 그대로 받아들였다. 한 벌로 줄이는 방법(생성 단계 등)은 검토하지 않았다.
5. **`scripts/kr/`에 코드 주석 예외를 줄 것인가.** §4-3 ③. 업스트림은 모든
   PR에 주석 금지를 요구하는데 기존 파일은 주석을 담고 있다. 이 문서는
   예외를 만들지 않았다.
6. **`companies/`·`mvp/`가 Docker 빌드 컨텍스트에 들어간다.** `.dockerignore`에
   두 디렉터리가 없다. 문서 전용 디렉터리가 이미지 컨텍스트에 포함될 필요는
   없어 보이지만, `.dockerignore`는 업스트림 파일이고 `docker_context_integrity`
   CI job의 검사 대상이다. 영향을 측정하지 않았으므로 건드리지 않았다.
7. **루트 `skills/kr-code-review/`가 런타임에서 실제로 선택되는지 확인하지 않았다.**
   §3-3의 표는 각 경로의 **용도**를 근거(파일·코드 라인)와 함께 적은 것이고,
   런타임 스킬 해석 순서를 실행으로 확인한 결과가 아니다.

---

## 참고 출처

- `AGENTS.md` §3(Repo Map), §5-4·§5-5, §7(검증)
- `CONTRIBUTING.md` — PR 요건, 내부 참조 금지, 주석 금지, 스크린샷 금지
- `DESIGN.md` 원칙 5(상태 어휘), 원칙 7(한 개념에 한 단어)
- `skills/kr-code-review/references/repo-facts.md` — CI 게이트 범위, `policy` job
- `server/src/services/company-portability.ts` — import 검증 경고
- `scripts/generate-company-assets.ts` — README·조직도 생성(덮어쓰기)
- `server/package.json` — `files` 필드
- `companies/softcat/README.md` — zip import 절차
