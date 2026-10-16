#!/usr/bin/env node
/**
 * 한국어화 1단계 — 번역 대상 문자열 추출기 (읽기 전용)
 *
 * TypeScript AST로 ui/ 의 사용자 노출 문자열을 찾는다. 정규식이 아니라 AST인
 * 이유: JSX 텍스트와 문자열 리터럴을, import 경로·className·테스트 셀렉터 같은
 * 기계 문자열과 구분해야 하기 때문이다. 정규식은 이 구분을 못 한다.
 *
 * 이 스크립트는 아무것도 수정하지 않는다. 치환은 codemod-i18n.mjs 가 한다.
 *
 *   node scripts/kr/extract-strings.mjs                 # 요약
 *   node scripts/kr/extract-strings.mjs --json out.json # 키 맵 출력
 *   node scripts/kr/extract-strings.mjs --dir ui/src/pages
 */
import { parse } from "@babel/parser";
import traverseNs from "@babel/traverse";
const traverse = traverseNs.default ?? traverseNs;
import { readFileSync, writeFileSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";

const ROOT = process.cwd();
const args = process.argv.slice(2);
const jsonOut = args.includes("--json") ? args[args.indexOf("--json") + 1] : null;
const targetDir = args.includes("--dir") ? args[args.indexOf("--dir") + 1] : "ui/src";

/** 번역 대상인 문자열 prop. 나머지 prop의 문자열은 기계값으로 본다. */
const TRANSLATABLE_PROPS = new Set([
  "title", "label", "placeholder", "description", "message", "heading",
  "alt", "aria-label", "aria-description", "tooltip", "emptyText",
  "confirmText", "cancelText", "submitText", "errorMessage", "helperText",
]);

/** 사용자에게 보이지 않는 문자열을 거르는 규칙. */
function isMachineString(text) {
  const s = text.trim();
  if (s.length < 2) return true;
  if (!/[A-Za-z]/.test(s)) return true;              // 숫자·기호만
  if (/^[a-z0-9]+([-_.][a-z0-9]+)+$/.test(s)) return true; // kebab/snake/dotted id
  if (/^[A-Z0-9_]+$/.test(s)) return true;            // 상수
  if (/^(https?:)?\/\//.test(s) || s.startsWith("/")) return true; // URL·경로
  if (/^#[0-9a-fA-F]{3,8}$/.test(s)) return true;     // 색상
  if (/^[a-z]+:[a-z]/.test(s)) return true;           // scheme/prefix
  if (!/\s/.test(s) && /^[a-z]/.test(s) && s.length < 12) return true; // 단일 소문자 토큰
  return false;
}

function listFiles(dir) {
  const out = [];
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) {
        if (name === "node_modules" || name === "__snapshots__" || name === "fixtures") continue;
        walk(p);
      } else if (/\.tsx$/.test(name) && !/\.(test|stories)\.tsx$/.test(name)) {
        out.push(p);
      }
    }
  };
  walk(dir);
  return out;
}

/** 파일 경로 + 원문으로 안정적인 키를 만든다. 파일이 바뀌어도 원문이 같으면 키가 유지된다. */
function makeKey(file, text) {
  const scope = relative(ROOT, file)
    .replace(/^ui\/src\//, "")
    .replace(/\.tsx$/, "")
    .replace(/[^A-Za-z0-9]+/g, ".")
    .toLowerCase();
  const hash = createHash("sha1").update(text.trim()).digest("hex").slice(0, 8);
  return `${scope}.${hash}`;
}

const findings = [];
const parseErrors = [];

for (const file of listFiles(join(ROOT, targetDir))) {
  const code = readFileSync(file, "utf8");
  let ast;
  try {
    ast = parse(code, {
      sourceType: "module",
      plugins: ["typescript", "jsx", "decorators-legacy", "explicitResourceManagement"],
      errorRecovery: true,
    });
  } catch (error) {
    parseErrors.push(`${relative(ROOT, file)}: ${error.message}`);
    continue;
  }

  const record = (text, kind, node) => {
    if (isMachineString(text)) return;
    findings.push({
      key: makeKey(file, text),
      text: text.trim().replace(/\s+/g, " "),
      file: relative(ROOT, file),
      line: node.loc?.start.line ?? 0,
      kind,
    });
  };

  traverse(ast, {
    // <div>사용자에게 보이는 텍스트</div>
    JSXText(path) {
      const text = path.node.value.trim();
      if (text) record(text, "jsx-text", path.node);
    },
    // <Button title="..." /> — 번역 대상 prop만
    JSXAttribute(path) {
      const name = path.node.name.name;
      if (typeof name !== "string" || !TRANSLATABLE_PROPS.has(name)) return;
      const init = path.node.value;
      if (!init) return;
      if (init.type === "StringLiteral") {
        record(init.value, `prop:${name}`, init);
      } else if (init.type === "JSXExpressionContainer" && init.expression.type === "StringLiteral") {
        record(init.expression.value, `prop:${name}`, init.expression);
      }
    },
    // {cond ? "문장 하나" : "다른 문장"} — JSX 표현식 안의 문장형 리터럴만
    JSXExpressionContainer(path) {
      path.traverse({
        StringLiteral(inner) {
          if (/\s/.test(inner.node.value.trim())) {
            record(inner.node.value, "jsx-expr", inner.node);
          }
        },
      });
    },
  });
}

// 같은 원문은 하나의 키로 합친다. 중복 번역은 용어 불일치의 원인이다.
const byKey = new Map();
for (const f of findings) {
  const existing = byKey.get(f.key);
  if (existing) existing.occurrences.push(`${f.file}:${f.line}`);
  else byKey.set(f.key, { key: f.key, text: f.text, kind: f.kind, occurrences: [`${f.file}:${f.line}`] });
}

const byFile = new Map();
for (const f of findings) byFile.set(f.file, (byFile.get(f.file) ?? 0) + 1);

console.log(`대상 디렉터리 : ${targetDir}`);
console.log(`스캔한 파일   : ${listFiles(join(ROOT, targetDir)).length}`);
console.log(`문자열 발견   : ${findings.length}`);
console.log(`고유 키       : ${byKey.size}`);
console.log(`영향받는 파일 : ${byFile.size}`);
console.log(`\n상위 20개 파일 (문자열 수):`);
for (const [file, n] of [...byFile].sort((a, b) => b[1] - a[1]).slice(0, 20)) {
  console.log(`  ${String(n).padStart(4)}  ${file}`);
}

if (jsonOut) {
  writeFileSync(jsonOut, JSON.stringify([...byKey.values()], null, 2));
  console.log(`\n키 맵 저장: ${jsonOut}`);
}
