# 로컬 구동 가이드

## 요구사항

- Node.js **≥ 24.11** (`engines` 강제. Node 22에서는 실행되지 않음)
- pnpm **≥ 9.15**
- **비root 사용자** ⚠️ — 임베디드 PostgreSQL의 `initdb`는 root로 실행을 거부한다.
  root로 `pnpm dev` 하면 다음 오류가 난다:
  ```
  Failed to initialize embedded PostgreSQL cluster ...
  Postgres init script exited with code 1
  ```
  컨테이너·CI에서 흔히 밟는 지점이다. 일반 사용자로 실행할 것.

## 실행

```bash
pnpm install
pnpm dev          # watch 모드
pnpm dev:once     # 1회 실행
```

UI + API → http://localhost:3100 , 임베디드 DB 자동 생성
(데이터 위치: `$HOME/.paperclip/instances/default/`)

## 운영 배포 시

임베디드 PostgreSQL 대신 외부 PostgreSQL을 쓴다. 임베디드는 로컬 개발용이다.

## 검증 명령

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm build-storybook   # i18n 작업 시 시각 회귀 확인용 (필수)
```

## 업스트림 동기화 (주 1회)

```bash
git fetch upstream
git merge upstream/master
pnpm install && pnpm typecheck && pnpm test
```

밀리지 말 것. 업스트림은 하루 수십 커밋 속도로 움직인다.
