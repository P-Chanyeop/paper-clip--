# 로컬 구동 가이드

> 이 문서는 추정이 아니라 **실제로 구동에 성공한 절차**다.
> 리눅스 컨테이너에서 5번 막혔고, 각 지점을 아래에 기록했다.
> 검증 결과: `http://localhost:3100` → HTTP 200, Paperclip UI 정상 서빙.

## 요구사항

| 항목 | 버전 | 비고 |
|---|---|---|
| Node.js | **≥ 24.11** | `engines` 강제. Node 22에서는 실행 안 됨 |
| pnpm | **≥ 9.15** | |
| **Rust toolchain** | cargo/rustc | ⚠️ README에 없다. 아래 2번 참고 |
| 실행 사용자 | **비root** | ⚠️ 아래 1번 참고 |

## 막히는 지점 5가지 (순서대로 전부 밟았다)

### 1. root로 실행하면 임베디드 PostgreSQL이 죽는다

```
Error: Failed to initialize embedded PostgreSQL cluster in
~/.paperclip/instances/default/db on port 54329:
Postgres init script exited with code 1
```

PostgreSQL의 `initdb`는 **root 실행을 거부한다.** PostgreSQL 자체의 보안 제약이라
Paperclip이 우회할 수 없다. 도커/CI에서 가장 흔히 밟는 지점이다.

→ **일반 사용자로 실행할 것.** 실패한 클러스터 디렉터리는 지우고 재시작한다:
```bash
rm -rf ~/.paperclip/instances/default/db
```

### 2. Rust 툴체인이 필요하다 (README에 없음)

```
sh: 1: cargo: not found
[paperclip] paperclip runner native binary build failed
```

`packages/paperclip-runner` 가 네이티브 러너 바이너리를 **빌드 시점에** 컴파일한다.
Node만으로는 `pnpm dev`가 되지 않는다.

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal
```

첫 빌드는 수 분 걸리고 `runner/target` 이 **약 375MB**를 쓴다. 디스크를 확보해 둘 것.

### 3. 프록시 환경에서 cargo가 crates.io에 못 붙는다

```
error: failed to get `aes-gcm` as a dependency ...
[77] Problem with the SSL CA cert (path? access rights?)
```

사내 프록시/MITM 인증서를 쓰는 환경이면 cargo에 CA를 따로 알려줘야 한다.
Node의 `NODE_EXTRA_CA_CERTS` 는 cargo에 적용되지 않는다.

```bash
export CARGO_HTTP_CAINFO=/path/to/ca-bundle.crt
export SSL_CERT_FILE=/path/to/ca-bundle.crt
```

> 인증서 파일이 **실행 사용자에게 읽기 권한이 있어야 한다.** root 전용 경로
> (`/root/...`)에 두고 비root로 실행하면 권한 오류로 같은 증상이 난다.

### 4. rustup 홈이 쓰기 가능해야 한다

`rust-toolchain.toml` 이 지정한 버전을 rustup이 **자동 설치**한다.
`RUSTUP_HOME` 이 읽기 전용이면 여기서 깨진다. 실행 사용자 소유로 둘 것.

### 5. pnpm 스토어 위치가 사용자마다 다르다

```
ERR_PNPM_UNEXPECTED_STORE  Unexpected store location
```

A 사용자로 `pnpm install` 하고 B 사용자로 실행하면 난다.
**설치와 실행을 같은 사용자로** 하거나 `--store-dir` 로 명시한다.

## 실행

```bash
pnpm install
pnpm dev          # watch 모드
pnpm dev:once     # 1회 실행
```

UI + API → **http://localhost:3100** , 임베디드 DB 자동 생성
(데이터 위치: `$HOME/.paperclip/instances/default/`)

## 운영 배포 시

임베디드 PostgreSQL은 **로컬 개발 전용**이다. 운영에서는 외부 PostgreSQL을 쓴다.
`Dockerfile` / `docker/` 참고.

## 검증 명령

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm build-storybook   # 한국어화 작업 시 시각 회귀 확인용 (필수)
```

## 업스트림 동기화 (주 1회)

```bash
git fetch upstream
git merge upstream/master
pnpm install && pnpm typecheck && pnpm test
```

밀리지 말 것. 업스트림은 하루 수십 커밋 속도로 움직인다.
한 달 밀리면 머지 비용이 주 단위로 커진다.
