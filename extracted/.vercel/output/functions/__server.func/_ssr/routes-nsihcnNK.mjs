import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as FilePenLine, n as Play, r as FilePlus2 } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-nsihcnNK.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var PRESETS = [
	{
		id: "sum",
		label: "รวมลำดับ",
		hint: "บวก 0 ถึง n-1",
		x52: `fn main() {
  let n = 3000000
  let s = 0
  let i = 0
  while i < n {
    s = s + i
    i = i + 1
  }
  print(s)
}
`,
		x52p: `$main(){
n=3000000;s=0;i=0
~i<n{s=s+i;i=i+1}
!s
}
`
	},
	{
		id: "mix",
		label: "สะสมคูณ",
		hint: "วนคูณแล้วหารเอาเศษ",
		x52: `fn main() {
  let n = 2500000
  let x = 1
  let i = 0
  while i < n {
    x = (x * 13 + i) % 1000003
    i = i + 1
  }
  print(x)
}
`,
		x52p: `$main(){
n=2500000;x=1;i=0
~i<n{x=(x*13+i)%1000003;i=i+1}
!x
}
`
	},
	{
		id: "call",
		label: "เรียกฟังก์ชัน",
		hint: "ทุกอบเรียกฟังก์ชันหนึ่งครั้ง",
		x52: `fn tick(x) {
  return (x * 13 + 7) % 1000003
}

fn main() {
  let n = 1200000
  let x = 1
  let i = 0
  while i < n {
    x = tick(x)
    i = i + 1
  }
  print(x)
}
`,
		x52p: `$tick(x){^(x*13+7)%1000003}
$main(){
n=1200000;x=1;i=0
~i<n{x=tick(x);i=i+1}
!x
}
`
	}
];
var TEMPLATE_X52 = [{
	path: "src/util.x52",
	body: `fn double(x) {
  return x + x
}

fn clamp(x) {
  if x > 100 {
    return 100
  }
  return x
}
`
}, {
	path: "src/main.x52",
	body: `fn main() {
  let n = 40
  let s = 0
  let i = 1
  while i <= n {
    s = s + double(i)
    i = i + 1
  }
  print(clamp(s))
  print(s)
}
`
}];
var TEMPLATE_X52P = [{
	path: "src/util.x52p",
	body: `$double(x){^x+x}
$clamp(x){?x>100{^100};^x}
`
}, {
	path: "src/main.x52p",
	body: `$main(){
n=40;s=0;i=1
~i<=n{s=s+double(i);i=i+1}
!clamp(s)
!s
}
`
}];
var MAP_ROWS = [
	{
		easy: "fn main() { }",
		fast: "$main(){ }",
		means: "ฟังก์ชัน"
	},
	{
		easy: "let n = 1",
		fast: "n=1",
		means: "ตั้งค่า"
	},
	{
		easy: "while i < n { }",
		fast: "~i<n{ }",
		means: "วนลูป"
	},
	{
		easy: "if a { } else { }",
		fast: "?a{ }:{ }",
		means: "แยกทาง"
	},
	{
		easy: "print(n)",
		fast: "!n",
		means: "พิมพ์"
	},
	{
		easy: "return n",
		fast: "^n",
		means: "ส่งค่ากลับ"
	}
];
var WORKFLOWS = {
	create: `name: create
# Create file without write
# ไม่เขียนเนื้อหาลงไฟล์
# รันแล้วไม่ขึ้น error: ถ้าชื่อซ้ำ จะได้ชื่อใหม่ เพราะจะไม่วางทับ
# ถ้า error: วางทับไฟล์เดิม จะได้ไม่ต้องไปหาเอง
conflict: rename
path: src/main.x52
`,
	write: `name: write
# Write without create
# เขียนเนื้อหา แต่ไม่สร้างไฟล์ให้ถ้ายังไม่มี
# รันแล้วไม่ขึ้น error: เขียนลงชื่อใหม่ ของเดิมไม่ถูกทับ
# ถ้า error: วางทับ path ที่ระบุ จะได้ไม่ต้องไปหาเอง
conflict: rename
path: src/main.x52
body: |
  fn main() {
    print(52)
  }
`
};
function setConflict(src, conflict) {
	if (/^conflict\s*:/m.test(src)) return src.replace(/^conflict\s*:.*/m, `conflict: ${conflict}`);
	return `conflict: ${conflict}\n${src}`;
}
function parseWf(src, expect) {
	let name = null;
	let conflict = null;
	let path = null;
	let body = null;
	const lines = src.split(/\r?\n/);
	for (let i = 0; i < lines.length; i += 1) {
		const raw = lines[i] ?? "";
		const trimmed = raw.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const m = /^(name|conflict|path|body)\s*:\s*(.*)$/.exec(trimmed);
		if (!m) throw new Error(`อ่านไม่ได้ที่บรรทัด ${i + 1} — ใช้ได้แค่ name, conflict, path, body`);
		const key = m[1];
		const val = (m[2] ?? "").trim();
		if (key === "body" && (val === "|" || val === "|-")) {
			const indent = raw.match(/^\s*/)?.[0].length ?? 0;
			const block = [];
			i += 1;
			while (i < lines.length) {
				const l = lines[i] ?? "";
				if (l.trim() === "") {
					block.push("");
					i += 1;
					continue;
				}
				if ((l.match(/^\s*/)?.[0].length ?? 0) <= indent) {
					i -= 1;
					break;
				}
				block.push(l);
				i += 1;
			}
			body = unindent(block);
			continue;
		}
		if (key === "name") name = val;
		else if (key === "conflict") conflict = val;
		else if (key === "path") path = stripQuote(val);
		else body = stripQuote(val);
	}
	if (name !== "create" && name !== "write") throw new Error("name ต้องเป็น create หรือ write");
	if (expect && name !== expect) throw new Error(`ไฟล์นี้เป็น ${expect}.yml — ตั้ง name: ${expect}`);
	if (conflict !== "rename" && conflict !== "overwrite") throw new Error("conflict ต้องเป็น rename หรือ overwrite");
	if (!path) throw new Error("ยังไม่มี path");
	return {
		name,
		conflict,
		path,
		body: name === "write" ? body ?? "" : "",
		ignoredBody: name === "create" && body !== null && body !== ""
	};
}
function stripQuote(v) {
	if (v.startsWith("\"") && v.endsWith("\"") || v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1);
	return v;
}
function unindent(block) {
	const indents = block.filter((l) => l.trim()).map((l) => l.match(/^\s*/)?.[0].length ?? 0);
	const min = indents.length ? Math.min(...indents) : 0;
	return block.map((l) => l.trim() ? l.slice(min) : "").join("\n").replace(/\n+$/, "");
}
function validatePath(path) {
	const p = path.trim();
	if (!p) return "ยังไม่ได้ใส่ path";
	if (p.length > 80) return "path ยาวเกิน";
	if (p.startsWith("/") || p.includes("..") || p.includes("\\")) return "ใช้ path สั้น ๆ เช่น src/main.x52";
	if (!/^[A-Za-z0-9._/-]+$/.test(p)) return "path ใช้ได้แค่ตัวอักษร ตัวเลข จุด ขีด และ /";
	if (p.endsWith("/")) return "ต้องเป็นชื่อไฟล์ ไม่ใช่โฟลเดอร์";
	return null;
}
function freshName(path, has) {
	if (!has(path)) return path;
	const slash = path.lastIndexOf("/");
	const dir = slash >= 0 ? path.slice(0, slash + 1) : "";
	const file = slash >= 0 ? path.slice(slash + 1) : path;
	const dot = file.lastIndexOf(".");
	const ext = dot > 0 ? file.slice(dot) : "";
	const root = (ext ? file.slice(0, dot) : file).replace(/-\d+$/, "");
	for (let i = 2; i < 1e3; i += 1) {
		const next = `${dir}${root}-${i}${ext}`;
		if (!has(next)) return next;
	}
	return `${dir}${root}-x${ext}`;
}
function upsert(files, next) {
	const rest = files.filter((f) => f.path !== next.path);
	rest.push(next);
	rest.sort((a, b) => a.path.localeCompare(b.path));
	return rest;
}
function runWorkflow(files, doc) {
	const requested = doc.path.trim();
	const invalid = validatePath(requested);
	const has = (p) => files.some((f) => f.path === p);
	if (invalid) return {
		ok: false,
		recovered: false,
		requested,
		actual: requested,
		message: invalid,
		files
	};
	if (doc.name === "create") {
		const noteBits = doc.ignoredBody ? " ข้ามเนื้อหา เพราะ create ไม่เขียน" : "";
		if (!has(requested)) {
			const filesNext = upsert(files, {
				path: requested,
				body: "",
				via: "create",
				note: "created"
			});
			return {
				ok: true,
				recovered: false,
				requested,
				actual: requested,
				message: `สร้างไฟล์ว่าง ${requested} โดยไม่เขียนเนื้อหา${noteBits}`,
				files: filesNext
			};
		}
		if (doc.conflict === "rename") {
			const actual = freshName(requested, has);
			const filesNext = upsert(files, {
				path: actual,
				body: "",
				via: "create",
				note: "renamed"
			});
			return {
				ok: true,
				recovered: false,
				requested,
				actual,
				message: `ไม่ขึ้น error จึงไม่วางทับ — ได้ชื่อใหม่ ${actual}${noteBits}`,
				files: filesNext
			};
		}
		const filesNext = upsert(files, {
			path: requested,
			body: "",
			via: "create",
			note: "overwrote"
		});
		return {
			ok: false,
			recovered: true,
			requested,
			actual: requested,
			message: `error ที่ ${requested} — วางทับให้ว่างแล้ว ไม่ต้องไปหาไฟล์เอง${noteBits}`,
			files: filesNext
		};
	}
	if (!has(requested)) {
		if (doc.conflict === "overwrite") {
			const filesNext = upsert(files, {
				path: requested,
				body: doc.body,
				via: "write",
				note: "overwrote"
			});
			return {
				ok: false,
				recovered: true,
				requested,
				actual: requested,
				message: `error ไม่มีไฟล์ให้เขียน — วางทับลง ${requested} ให้แล้ว ไม่ต้องไปหาเอง`,
				files: filesNext
			};
		}
		return {
			ok: false,
			recovered: false,
			requested,
			actual: requested,
			message: "write ไม่สร้างไฟล์ — ยังไม่มี path นี้ รัน create ก่อน หรือรันแบบ error เพื่อวางทับ",
			files
		};
	}
	if (doc.conflict === "rename") {
		const actual = freshName(requested, has);
		const filesNext = upsert(files, {
			path: actual,
			body: doc.body,
			via: "write",
			note: "renamed"
		});
		return {
			ok: true,
			recovered: false,
			requested,
			actual,
			message: `ไม่ขึ้น error จึงไม่วางทับ — เขียนลงชื่อใหม่ ${actual}`,
			files: filesNext
		};
	}
	const filesNext = upsert(files, {
		path: requested,
		body: doc.body,
		via: "write",
		note: "overwrote"
	});
	return {
		ok: false,
		recovered: true,
		requested,
		actual: requested,
		message: `error ที่ ${requested} — วางทับเนื้อหาแล้ว ไม่ต้องไปหาไฟล์เอง`,
		files: filesNext
	};
}
var LangError = class extends Error {
	constructor(message, line) {
		super(line ? `${message} (บรรทัด ${line})` : message);
		this.name = "LangError";
	}
};
function formatNum(n) {
	if (!Number.isFinite(n)) return "ไม่ใช่จำนวน";
	if (Object.is(n, -0)) return "0";
	if (Number.isInteger(n) && Math.abs(n) < 0x38d7ea4c68000) return String(n);
	const rounded = Math.round(n * 1e6) / 1e6;
	return String(rounded);
}
function mergeProgs(parts) {
	const fns = [];
	const seen = /* @__PURE__ */ new Set();
	const top = [];
	for (const part of parts) {
		for (const fn of part.fns) {
			if (seen.has(fn.n)) throw new LangError(`ฟังก์ชัน ${fn.n} ซ้ำ`, fn.line);
			seen.add(fn.n);
			fns.push(fn);
		}
		top.push(...part.top);
	}
	return {
		fns,
		top
	};
}
var IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;
var CMP = /* @__PURE__ */ new Set([
	"==",
	"!=",
	"<",
	">",
	"<=",
	">="
]);
function vn(n) {
	if (!IDENT.test(n)) throw new LangError(`ชื่อ ${n} ใช้ใน X52+ ไม่ได้`);
	return `v_${n}`;
}
function fnName(n) {
	if (!IDENT.test(n) || n === "<top>") return n === "<top>" ? "f___top" : `f_${n}`;
	return `f_${n}`;
}
var Emit = class {
	known;
	constructor(known) {
		this.known = known;
	}
	expr(e) {
		if (e.t === "num") return Number.isFinite(e.v) ? String(e.v) : "0";
		if (e.t === "var") {
			if (!this.known.has(e.n)) throw new LangError(`ไม่รู้จัก ${e.n}`, e.line);
			return vn(e.n);
		}
		if (e.t === "un") {
			const x = this.expr(e.x);
			return e.op === "-" ? `(-${x})` : `(${x}?0:1)`;
		}
		if (e.t === "call") {
			if (!IDENT.test(e.n)) throw new LangError(`ไม่รู้จักฟังก์ชัน ${e.n}`, e.line);
			return `${fnName(e.n)}(${e.a.map((a) => this.expr(a)).join(",")})`;
		}
		const l = this.expr(e.l);
		const r = this.expr(e.r);
		if (CMP.has(e.op)) return `((${l}${e.op}${r})?1:0)`;
		return `(${l}${e.op}${r})`;
	}
	stmt(s) {
		if (s.t === "let" || s.t === "set") {
			if (!this.known.has(s.n)) throw new LangError(`ไม่รู้จัก ${s.n}`, s.line);
			return `${vn(s.n)}=${this.expr(s.x)};`;
		}
		if (s.t === "print") return `print(${this.expr(s.x)});`;
		if (s.t === "ret") return `return ${s.x ? this.expr(s.x) : "0"};`;
		if (s.t === "expr") return `${this.expr(s.x)};`;
		if (s.t === "while") return `while(${this.expr(s.c)}){if(--fuel.n<0)throw new Error("FUEL");${s.b.map((x) => this.stmt(x)).join("")}}`;
		if (s.t === "if") {
			const e = s.e.length ? `else{${s.e.map((x) => this.stmt(x)).join("")}}` : "";
			return `if(${this.expr(s.c)}){${s.a.map((x) => this.stmt(x)).join("")}}${e}`;
		}
		return "";
	}
};
function localsOf(fn) {
	const locals = /* @__PURE__ */ new Map();
	const add = (n) => {
		if (!IDENT.test(n)) throw new LangError(`ชื่อ ${n} ใช้ไม่ได้`, fn.line);
		if (!locals.has(n)) locals.set(n, locals.size);
	};
	for (const p of fn.p) {
		if (locals.has(p)) throw new LangError(`พารามิเตอร์ ${p} ซ้ำ`, fn.line);
		add(p);
	}
	const walk = (stmts) => {
		for (const s of stmts) {
			if (s.t === "let") throw new LangError("X52+ ไม่มี let — ใส่ชื่อ = ค่า ได้เลย", s.line);
			if (s.t === "set") add(s.n);
			else if (s.t === "while") walk(s.b);
			else if (s.t === "if") {
				walk(s.a);
				walk(s.e);
			}
		}
	};
	walk(fn.b);
	return locals;
}
function compileJit(prog) {
	const fns = prog.fns.slice();
	if (prog.top.length) fns.push({
		n: "<top>",
		p: [],
		b: prog.top,
		line: prog.top[0]?.line ?? 1
	});
	const declared = new Set(fns.map((f) => f.n));
	if (!declared.has("main") && !declared.has("<top>")) throw new LangError("ยังไม่มี main");
	const checkCalls = (e) => {
		if (e.t === "call" && !declared.has(e.n)) throw new LangError(`ไม่รู้จักฟังก์ชัน ${e.n}`, e.line);
		if (e.t === "bin") {
			checkCalls(e.l);
			checkCalls(e.r);
		} else if (e.t === "un") checkCalls(e.x);
		else if (e.t === "call") e.a.forEach(checkCalls);
	};
	const walkStmt = (s) => {
		if (s.t === "let" || s.t === "set" || s.t === "print") checkCalls(s.x);
		else if (s.t === "ret" && s.x) checkCalls(s.x);
		else if (s.t === "expr") checkCalls(s.x);
		else if (s.t === "while") {
			checkCalls(s.c);
			s.b.forEach(walkStmt);
		} else if (s.t === "if") {
			checkCalls(s.c);
			s.a.forEach(walkStmt);
			s.e.forEach(walkStmt);
		}
	};
	const bodies = fns.map((fn) => {
		const locals = localsOf(fn);
		fn.b.forEach(walkStmt);
		const em = new Emit(new Set(locals.keys()));
		const params = fn.p.map(vn).join(",");
		const extra = [...locals.keys()].filter((n) => !fn.p.includes(n));
		const decl = extra.length ? `let ${extra.map((n) => `${vn(n)}=0`).join(",")};` : "";
		const arity = `if(arguments.length!==${fn.p.length})throw new Error("ARITY:${fn.n}:${fn.p.length}");`;
		return `function ${fnName(fn.n)}(${params}){${arity}if(--fuel.n<0)throw new Error("FUEL");${decl}${fn.b.map((s) => em.stmt(s)).join("")}return 0;}`;
	});
	const entry = declared.has("<top>") ? "f___top" : "f_main";
	const source = `"use strict";${bodies.join("")}${entry}();`;
	try {
		return new Function("print", "fuel", source);
	} catch {
		throw new LangError("คอมไพล์ X52+ ไม่ผ่าน");
	}
}
var TWO = [
	"+=",
	"-=",
	"*=",
	"/=",
	"%=",
	"==",
	"!=",
	"<=",
	">=",
	"&&",
	"||"
];
var ONE_OP = "+-*/%=<>!";
function lex(src, dialect) {
	const out = [];
	let i = 0;
	let line = 1;
	while (i < src.length) {
		const c = src[i];
		if (c === "\n") {
			line += 1;
			i += 1;
			continue;
		}
		if (c === " " || c === "	" || c === "\r") {
			i += 1;
			continue;
		}
		if (c === "/" && src[i + 1] === "/") {
			while (i < src.length && src[i] !== "\n") i += 1;
			continue;
		}
		if (dialect === "x52p" && c === "#") {
			while (i < src.length && src[i] !== "\n") i += 1;
			continue;
		}
		if (c >= "0" && c <= "9") {
			const start = i;
			let dots = 0;
			while (i < src.length && (src[i] >= "0" && src[i] <= "9" || src[i] === ".")) {
				if (src[i] === ".") dots += 1;
				i += 1;
			}
			if (dots > 1) throw new LangError("เลขทศนิยมไม่ถูกต้อง", line);
			out.push({
				k: "num",
				v: src.slice(start, i),
				line
			});
			continue;
		}
		if (c >= "A" && c <= "Z" || c >= "a" && c <= "z" || c === "_") {
			const start = i;
			i += 1;
			while (i < src.length) {
				const d = src[i];
				if (d >= "A" && d <= "Z" || d >= "a" && d <= "z" || d >= "0" && d <= "9" || d === "_") i += 1;
				else break;
			}
			out.push({
				k: "id",
				v: src.slice(start, i),
				line
			});
			continue;
		}
		const two = src.slice(i, i + 2);
		if (TWO.includes(two)) {
			out.push({
				k: "op",
				v: two,
				line
			});
			i += 2;
			continue;
		}
		if (ONE_OP.includes(c)) {
			out.push({
				k: "op",
				v: c,
				line
			});
			i += 1;
			continue;
		}
		if ("(){},;".includes(c) || dialect === "x52p" && "~?^$:".includes(c)) {
			out.push({
				k: "punc",
				v: c,
				line
			});
			i += 1;
			continue;
		}
		if (dialect === "x52" && "~?^$:".includes(c)) throw new LangError("สัญลักษณ์นี้เป็นของ X52+ ไม่ใช่ X52", line);
		if (c === "#") throw new LangError("คอมเมนต์ของ X52 ใช้ //", line);
		throw new LangError(`ไม่รู้จักตัวอักษร ${c}`, line);
	}
	return out;
}
var X52_WORDS = /* @__PURE__ */ new Set([
	"fn",
	"let",
	"return",
	"while",
	"if",
	"else",
	"print"
]);
var Parser = class {
	toks;
	dialect;
	i = 0;
	constructor(toks, dialect) {
		this.toks = toks;
		this.dialect = dialect;
	}
	parse() {
		const fns = [];
		const top = [];
		this.skipSep();
		while (!this.eof()) {
			if (this.dialect === "x52" && this.isKw("fn")) fns.push(this.parseFnX52());
			else if (this.dialect === "x52p" && this.isPunc("$")) fns.push(this.parseFnPlus());
			else top.push(this.parseStmt());
			this.skipSep();
		}
		return {
			fns,
			top
		};
	}
	cur() {
		return this.toks[this.i] ?? {
			k: "eof",
			v: "",
			line: this.toks.at(-1)?.line ?? 1
		};
	}
	eof() {
		return this.cur().k === "eof";
	}
	eat() {
		const t = this.cur();
		if (t.k === "eof") throw new LangError("โค้ดจบก่อนครบ", t.line);
		this.i += 1;
		return t;
	}
	isKw(w) {
		const t = this.cur();
		return t.k === "id" && t.v === w;
	}
	isOp(w) {
		const t = this.cur();
		return t.k === "op" && t.v === w;
	}
	isPunc(w) {
		const t = this.cur();
		return t.k === "punc" && t.v === w;
	}
	expectKw(w) {
		if (!this.isKw(w)) throw new LangError(`ต้องมีคำว่า ${w}`, this.cur().line);
		this.eat();
	}
	expectPunc(w) {
		if (!this.isPunc(w)) throw new LangError(`ต้องมี ${w}`, this.cur().line);
		this.eat();
	}
	skipSep() {
		while (this.isPunc(";")) this.eat();
	}
	ident() {
		const t = this.cur();
		if (t.k !== "id") throw new LangError("ต้องมีชื่อ", t.line);
		if (this.dialect === "x52" && X52_WORDS.has(t.v)) throw new LangError(`${t.v} เป็นคำสงวนของ X52`, t.line);
		if (this.dialect === "x52p" && X52_WORDS.has(t.v)) throw new LangError(`คำว่า ${t.v} เป็นของ X52 — X52+ ใช้สัญลักษณ์สั้นแทน`, t.line);
		if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(t.v)) throw new LangError("ชื่อใช้ a-z กับขีดล่าง", t.line);
		this.eat();
		return t.v;
	}
	canStartExpr() {
		const t = this.cur();
		return t.k === "num" || t.k === "id" || t.k === "punc" && t.v === "(" || t.k === "op" && (t.v === "!" || t.v === "-");
	}
	parseFnX52() {
		const line = this.cur().line;
		this.expectKw("fn");
		const n = this.ident();
		this.expectPunc("(");
		const p = this.params();
		this.expectPunc(")");
		return {
			n,
			p,
			b: this.block(),
			line
		};
	}
	parseFnPlus() {
		const line = this.cur().line;
		this.expectPunc("$");
		const n = this.ident();
		this.expectPunc("(");
		const p = this.params();
		this.expectPunc(")");
		return {
			n,
			p,
			b: this.block(),
			line
		};
	}
	params() {
		const p = [];
		if (this.isPunc(")")) return p;
		p.push(this.ident());
		while (this.isPunc(",")) {
			this.eat();
			p.push(this.ident());
		}
		return p;
	}
	block() {
		this.expectPunc("{");
		const body = [];
		this.skipSep();
		while (!this.isPunc("}") && !this.eof()) {
			body.push(this.parseStmt());
			this.skipSep();
		}
		this.expectPunc("}");
		return body;
	}
	parseStmt() {
		const line = this.cur().line;
		if (this.dialect === "x52") {
			if (this.isKw("fn")) throw new LangError("ประกาศฟังก์ชันได้เฉพาะด้านนอก", line);
			if (this.isKw("let")) return this.parseLet(line);
			if (this.isKw("return")) return this.parseReturn(line);
			if (this.isKw("while")) return this.parseWhile(line);
			if (this.isKw("if")) return this.parseIf(line);
			if (this.isKw("else")) throw new LangError("else ต้องตามหลัง if", line);
			if (this.isKw("print")) return this.parsePrint(line);
		} else {
			if (this.isPunc("$")) throw new LangError("ประกาศ $ฟังก์ชัน ได้เฉพาะด้านนอก", line);
			if (this.isPunc("~")) {
				this.eat();
				return {
					t: "while",
					c: this.parseExpr(),
					b: this.block(),
					line
				};
			}
			if (this.isPunc("?")) {
				this.eat();
				const c = this.parseExpr();
				const a = this.block();
				let e = [];
				if (this.isPunc(":")) {
					this.eat();
					e = this.block();
				}
				return {
					t: "if",
					c,
					a,
					e,
					line
				};
			}
			if (this.isPunc("^")) {
				this.eat();
				return {
					t: "ret",
					x: this.canStartExpr() ? this.parseExpr() : null,
					line
				};
			}
			if (this.isOp("!")) {
				this.eat();
				return {
					t: "print",
					x: this.parseExpr(),
					line
				};
			}
		}
		if (this.cur().k === "id" && this.isAssignOp(this.peek())) return this.parseAssign(line);
		return {
			t: "expr",
			x: this.parseExpr(),
			line
		};
	}
	peek() {
		return this.toks[this.i + 1] ?? {
			k: "eof",
			v: "",
			line: this.cur().line
		};
	}
	isAssignOp(t) {
		return t.k === "op" && (t.v === "=" || t.v === "+=" || t.v === "-=" || t.v === "*=" || t.v === "/=" || t.v === "%=");
	}
	parseLet(line) {
		this.expectKw("let");
		const n = this.ident();
		if (!this.isOp("=")) throw new LangError("let ต้องตามด้วย =", this.cur().line);
		this.eat();
		return {
			t: "let",
			n,
			x: this.parseExpr(),
			line
		};
	}
	parseAssign(line) {
		const n = this.ident();
		const op = this.eat();
		if (op.v === "=") return {
			t: "set",
			n,
			x: this.parseExpr(),
			line
		};
		return {
			t: "set",
			n,
			x: {
				t: "bin",
				op: op.v[0],
				l: {
					t: "var",
					n,
					line
				},
				r: this.parseExpr(),
				line
			},
			line
		};
	}
	parseReturn(line) {
		this.expectKw("return");
		return {
			t: "ret",
			x: this.canStartExpr() ? this.parseExpr() : null,
			line
		};
	}
	parseWhile(line) {
		this.expectKw("while");
		return {
			t: "while",
			c: this.parseExpr(),
			b: this.block(),
			line
		};
	}
	parseIf(line) {
		this.expectKw("if");
		const c = this.parseExpr();
		const a = this.block();
		let e = [];
		if (this.isKw("else")) {
			this.eat();
			if (this.isKw("if")) e = [this.parseIf(this.cur().line)];
			else e = this.block();
		}
		return {
			t: "if",
			c,
			a,
			e,
			line
		};
	}
	parsePrint(line) {
		this.expectKw("print");
		this.expectPunc("(");
		const x = this.parseExpr();
		this.expectPunc(")");
		return {
			t: "print",
			x,
			line
		};
	}
	parseExpr() {
		return this.parseOr();
	}
	parseOr() {
		let l = this.parseAnd();
		while (this.isOp("||")) {
			const line = this.cur().line;
			this.eat();
			l = {
				t: "bin",
				op: "||",
				l,
				r: this.parseAnd(),
				line
			};
		}
		return l;
	}
	parseAnd() {
		let l = this.parseCmp();
		while (this.isOp("&&")) {
			const line = this.cur().line;
			this.eat();
			l = {
				t: "bin",
				op: "&&",
				l,
				r: this.parseCmp(),
				line
			};
		}
		return l;
	}
	parseCmp() {
		let l = this.parseAdd();
		const ops = /* @__PURE__ */ new Set([
			"==",
			"!=",
			"<",
			">",
			"<=",
			">="
		]);
		while (this.cur().k === "op" && ops.has(this.cur().v)) {
			const line = this.cur().line;
			l = {
				t: "bin",
				op: this.eat().v,
				l,
				r: this.parseAdd(),
				line
			};
		}
		return l;
	}
	parseAdd() {
		let l = this.parseMul();
		while (this.isOp("+") || this.isOp("-")) {
			const line = this.cur().line;
			l = {
				t: "bin",
				op: this.eat().v,
				l,
				r: this.parseMul(),
				line
			};
		}
		return l;
	}
	parseMul() {
		let l = this.parseUnary();
		while (this.isOp("*") || this.isOp("/") || this.isOp("%")) {
			const line = this.cur().line;
			l = {
				t: "bin",
				op: this.eat().v,
				l,
				r: this.parseUnary(),
				line
			};
		}
		return l;
	}
	parseUnary() {
		if (this.isOp("!") || this.isOp("-")) {
			const line = this.cur().line;
			return {
				t: "un",
				op: this.eat().v,
				x: this.parseUnary(),
				line
			};
		}
		return this.parsePost();
	}
	parsePost() {
		const e = this.parsePrimary();
		if (e.t === "var" && this.isPunc("(")) {
			this.eat();
			const args = [];
			if (!this.isPunc(")")) {
				args.push(this.parseExpr());
				while (this.isPunc(",")) {
					this.eat();
					args.push(this.parseExpr());
				}
			}
			this.expectPunc(")");
			return {
				t: "call",
				n: e.n,
				a: args,
				line: e.line
			};
		}
		return e;
	}
	parsePrimary() {
		const t = this.cur();
		if (t.k === "num") {
			this.eat();
			const v = Number(t.v);
			if (!Number.isFinite(v)) throw new LangError("เลขไม่ถูกต้อง", t.line);
			return {
				t: "num",
				v,
				line: t.line
			};
		}
		if (t.k === "id") {
			if (this.dialect === "x52" && X52_WORDS.has(t.v)) throw new LangError(`ใช้ ${t.v} ตรงนี้ไม่ได้`, t.line);
			if (this.dialect === "x52p" && X52_WORDS.has(t.v)) throw new LangError(`คำว่า ${t.v} เป็นของ X52`, t.line);
			this.eat();
			return {
				t: "var",
				n: t.v,
				line: t.line
			};
		}
		if (this.isPunc("(")) {
			this.eat();
			const e = this.parseExpr();
			this.expectPunc(")");
			return e;
		}
		throw new LangError("นิพจน์ไม่ครบ", t.line);
	}
};
function parseSource(src, dialect) {
	if (!src.trim()) throw new LangError("ยังไม่มีโค้ด");
	return new Parser(lex(src, dialect), dialect).parse();
}
var OP = {
	CONST: 1,
	LOAD: 2,
	STORE: 3,
	DUP: 4,
	POP: 5,
	ADD: 6,
	SUB: 7,
	MUL: 8,
	DIV: 9,
	MOD: 10,
	NEG: 11,
	NOT: 12,
	EQ: 13,
	NE: 14,
	LT: 15,
	GT: 16,
	LE: 17,
	GE: 18,
	JMP: 19,
	JT: 20,
	JF: 21,
	CALL: 22,
	RET: 23,
	PRINT: 24,
	FUEL: 25
};
var BIN = {
	"+": OP.ADD,
	"-": OP.SUB,
	"*": OP.MUL,
	"/": OP.DIV,
	"%": OP.MOD,
	"==": OP.EQ,
	"!=": OP.NE,
	"<": OP.LT,
	">": OP.GT,
	"<=": OP.LE,
	">=": OP.GE
};
var Cmp = class {
	locals;
	fnIndex;
	code = [];
	consts = [];
	constructor(locals, fnIndex) {
		this.locals = locals;
		this.fnIndex = fnIndex;
	}
	constOf(n) {
		const i = this.consts.indexOf(n);
		if (i >= 0) return i;
		this.consts.push(n);
		return this.consts.length - 1;
	}
	emit(...xs) {
		this.code.push(...xs);
	}
	hole(op) {
		this.code.push(op, 0);
		return this.code.length - 1;
	}
	patch(at) {
		this.code[at] = this.code.length - (at + 1);
	}
	expr(e) {
		if (e.t === "num") {
			this.emit(OP.CONST, this.constOf(e.v));
			return;
		}
		if (e.t === "var") {
			const slot = this.locals.get(e.n);
			if (slot === void 0) throw new LangError(`ไม่รู้จัก ${e.n}`, e.line);
			this.emit(OP.LOAD, slot);
			return;
		}
		if (e.t === "un") {
			this.expr(e.x);
			this.emit(e.op === "-" ? OP.NEG : OP.NOT);
			return;
		}
		if (e.t === "call") {
			const fi = this.fnIndex.get(e.n);
			if (fi === void 0) throw new LangError(`ไม่รู้จักฟังก์ชัน ${e.n}`, e.line);
			for (const a of e.a) this.expr(a);
			this.emit(OP.CALL, fi, e.a.length);
			return;
		}
		if (e.op === "&&") {
			this.expr(e.l);
			this.emit(OP.DUP);
			const end = this.hole(OP.JF);
			this.emit(OP.POP);
			this.expr(e.r);
			this.patch(end);
			return;
		}
		if (e.op === "||") {
			this.expr(e.l);
			this.emit(OP.DUP);
			const end = this.hole(OP.JT);
			this.emit(OP.POP);
			this.expr(e.r);
			this.patch(end);
			return;
		}
		this.expr(e.l);
		this.expr(e.r);
		const op = BIN[e.op];
		if (!op) throw new LangError(`เครื่องหมาย ${e.op} ใช้ไม่ได้`, e.line);
		this.emit(op);
	}
	stmts(list) {
		for (const s of list) this.stmt(s);
	}
	stmt(s) {
		if (s.t === "let" || s.t === "set") {
			const slot = this.locals.get(s.n);
			if (slot === void 0) throw new LangError(`ไม่รู้จัก ${s.n}`, s.line);
			this.expr(s.x);
			this.emit(OP.STORE, slot);
			return;
		}
		if (s.t === "print") {
			this.expr(s.x);
			this.emit(OP.PRINT);
			return;
		}
		if (s.t === "ret") {
			if (s.x) this.expr(s.x);
			else this.emit(OP.CONST, this.constOf(0));
			this.emit(OP.RET);
			return;
		}
		if (s.t === "expr") {
			this.expr(s.x);
			this.emit(OP.POP);
			return;
		}
		if (s.t === "while") {
			const start = this.code.length;
			this.expr(s.c);
			const end = this.hole(OP.JF);
			this.emit(OP.FUEL);
			this.stmts(s.b);
			const back = this.hole(OP.JMP);
			this.code[back] = start - (back + 1);
			this.patch(end);
			return;
		}
		if (s.t === "if") {
			this.expr(s.c);
			const elseAt = this.hole(OP.JF);
			this.stmts(s.a);
			const end = this.hole(OP.JMP);
			this.patch(elseAt);
			this.stmts(s.e);
			this.patch(end);
			return;
		}
	}
};
function collectLocals(fn, dialect) {
	const locals = /* @__PURE__ */ new Map();
	const add = (n) => {
		if (!locals.has(n)) locals.set(n, locals.size);
	};
	for (const p of fn.p) {
		if (locals.has(p)) throw new LangError(`พารามิเตอร์ ${p} ซ้ำ`, fn.line);
		add(p);
	}
	const walk = (stmts) => {
		for (const s of stmts) if (s.t === "let") {
			if (dialect === "x52p") throw new LangError("X52+ ไม่มี let — ใส่ชื่อ = ค่า ได้เลย", s.line);
			add(s.n);
		} else if (s.t === "set") {
			if (!locals.has(s.n)) {
				if (dialect === "x52") throw new LangError(`ยังไม่มี ${s.n} ใช้ let ก่อน`, s.line);
				add(s.n);
			}
		} else if (s.t === "while") walk(s.b);
		else if (s.t === "if") {
			walk(s.a);
			walk(s.e);
		}
	};
	walk(fn.b);
	return locals;
}
function compileVm(prog, dialect) {
	const fns = prog.fns.slice();
	if (prog.top.length) fns.push({
		n: "<top>",
		p: [],
		b: prog.top,
		line: prog.top[0]?.line ?? 1
	});
	const names = /* @__PURE__ */ new Map();
	fns.forEach((fn, i) => {
		if (names.has(fn.n)) throw new LangError(`ฟังก์ชัน ${fn.n} ซ้ำ`, fn.line);
		names.set(fn.n, i);
	});
	const funcs = fns.map((fn) => {
		const locals = collectLocals(fn, dialect);
		const c = new Cmp(locals, names);
		c.stmts(fn.b);
		c.emit(OP.CONST, c.constOf(0), OP.RET);
		return {
			name: fn.n,
			params: fn.p.length,
			localCount: locals.size,
			consts: c.consts,
			code: c.code
		};
	});
	let entry = names.get("<top>");
	if (entry === void 0) entry = names.get("main");
	if (entry === void 0) throw new LangError("ยังไม่มี main");
	return {
		funcs,
		entry
	};
}
function pop(fr) {
	const v = fr.stack.pop();
	if (v === void 0) throw new Error("STACK");
	return v;
}
function runVm(mod, print, fuel0, printCap) {
	let fuel = fuel0;
	let printed = 0;
	const start = mod.funcs[mod.entry];
	if (!start) throw new LangError("ไม่มีจุดเริ่ม");
	const frames = [{
		f: start,
		ip: 0,
		locals: Array.from({ length: start.localCount }, () => 0),
		stack: []
	}];
	while (frames.length) {
		const fr = frames[frames.length - 1];
		const code = fr.f.code;
		if (fr.ip >= code.length) {
			frames.pop();
			const parent = frames[frames.length - 1];
			if (parent) parent.stack.push(0);
			continue;
		}
		const op = code[fr.ip++];
		switch (op) {
			case OP.CONST:
				fr.stack.push(fr.f.consts[code[fr.ip++]]);
				break;
			case OP.LOAD:
				fr.stack.push(fr.locals[code[fr.ip++]]);
				break;
			case OP.STORE:
				fr.locals[code[fr.ip++]] = pop(fr);
				break;
			case OP.DUP:
				fr.stack.push(fr.stack[fr.stack.length - 1] ?? 0);
				break;
			case OP.POP:
				pop(fr);
				break;
			case OP.ADD:
			case OP.SUB:
			case OP.MUL:
			case OP.DIV:
			case OP.MOD: {
				const b = pop(fr);
				const a = pop(fr);
				if ((op === OP.DIV || op === OP.MOD) && b === 0) throw new Error("DIV0");
				fr.stack.push(op === OP.ADD ? a + b : op === OP.SUB ? a - b : op === OP.MUL ? a * b : op === OP.DIV ? a / b : a % b);
				break;
			}
			case OP.NEG:
				fr.stack.push(-pop(fr));
				break;
			case OP.NOT:
				fr.stack.push(pop(fr) ? 0 : 1);
				break;
			case OP.EQ:
			case OP.NE:
			case OP.LT:
			case OP.GT:
			case OP.LE:
			case OP.GE: {
				const b = pop(fr);
				const a = pop(fr);
				const ok = op === OP.EQ ? a === b : op === OP.NE ? a !== b : op === OP.LT ? a < b : op === OP.GT ? a > b : op === OP.LE ? a <= b : a >= b;
				fr.stack.push(ok ? 1 : 0);
				break;
			}
			case OP.JMP: {
				const rel = code[fr.ip++];
				fr.ip += rel;
				break;
			}
			case OP.JT:
			case OP.JF: {
				const rel = code[fr.ip++];
				const v = pop(fr);
				if (op === OP.JT ? !!v : !v) fr.ip += rel;
				break;
			}
			case OP.CALL: {
				const fi = code[fr.ip++];
				const argc = code[fr.ip++];
				const fn = mod.funcs[fi];
				if (!fn) throw new Error("CALL");
				if (argc !== fn.params) throw new Error(`ARITY:${fn.name}:${fn.params}`);
				const locals = Array.from({ length: fn.localCount }, () => 0);
				for (let i = argc - 1; i >= 0; i -= 1) locals[i] = pop(fr);
				frames.push({
					f: fn,
					ip: 0,
					locals,
					stack: []
				});
				break;
			}
			case OP.RET: {
				const v = fr.stack.pop() ?? 0;
				frames.pop();
				const parent = frames[frames.length - 1];
				if (parent) parent.stack.push(v);
				break;
			}
			case OP.PRINT:
				printed += 1;
				if (printed > printCap) throw new Error("PRINT_CAP");
				print(pop(fr));
				break;
			case OP.FUEL:
				fuel -= 1;
				if (fuel < 0) throw new Error("FUEL");
				break;
			default: throw new Error("OP");
		}
	}
}
var DEFAULT_FUEL = 4e7;
var PRINT_CAP = 200;
function explain(err) {
	const msg = err instanceof Error ? err.message : "รันไม่สำเร็จ";
	if (msg === "FUEL") return "งานใหญ่เกินงบที่ตั้งไว้ ลองลดจำนวนรอบ";
	if (msg === "DIV0") return "หารด้วยศูนย์";
	if (msg === "PRINT_CAP") return "พิมพ์เยอะเกิน ตัดที่ 200 บรรทัด";
	if (msg === "STACK" || msg === "OP" || msg === "CALL") return "เครื่องรันเจอคำสั่งที่ประกอบไม่ครบ";
	if (msg.startsWith("ARITY:")) {
		const [, name, n] = msg.split(":");
		return `ฟังก์ชัน ${name} ต้องรับ ${n} ค่า`;
	}
	return msg;
}
function loadProg(dialect, sources) {
	return mergeProgs(sources.map((src) => parseSource(src, dialect)));
}
function execute(dialect, source, fuel = DEFAULT_FUEL) {
	return executeSources(dialect, [source], fuel);
}
function executeSources(dialect, sources, fuel = DEFAULT_FUEL) {
	const engine = dialect === "x52" ? "vm" : "direct";
	const t0 = performance.now();
	let prog;
	try {
		prog = loadProg(dialect, sources);
	} catch (err) {
		return {
			ok: false,
			output: "",
			ms: 0,
			compileMs: performance.now() - t0,
			error: explain(err),
			engine
		};
	}
	const lines = [];
	const push = (n) => {
		lines.push(formatNum(n));
	};
	if (dialect === "x52") {
		let mod;
		try {
			mod = compileVm(prog, dialect);
		} catch (err) {
			return {
				ok: false,
				output: "",
				ms: 0,
				compileMs: performance.now() - t0,
				error: explain(err),
				engine
			};
		}
		const compileMs = performance.now() - t0;
		const t1 = performance.now();
		try {
			runVm(mod, push, fuel, PRINT_CAP);
		} catch (err) {
			return {
				ok: false,
				output: lines.join("\n"),
				ms: performance.now() - t1,
				compileMs,
				error: explain(err),
				engine
			};
		}
		return {
			ok: true,
			output: lines.join("\n"),
			ms: performance.now() - t1,
			compileMs,
			engine
		};
	}
	let jit;
	try {
		jit = compileJit(prog);
	} catch (err) {
		return {
			ok: false,
			output: "",
			ms: 0,
			compileMs: performance.now() - t0,
			error: explain(err),
			engine
		};
	}
	const compileMs = performance.now() - t0;
	const t1 = performance.now();
	try {
		jit(push, { n: fuel });
	} catch (err) {
		return {
			ok: false,
			output: lines.join("\n"),
			ms: performance.now() - t1,
			compileMs,
			error: explain(err),
			engine
		};
	}
	return {
		ok: true,
		output: lines.join("\n"),
		ms: performance.now() - t1,
		compileMs,
		engine
	};
}
function ProjectPanel({ dialect, files, onChange }) {
	const [active, setActive] = (0, import_react.useState)(0);
	const [run, setRun] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const file = files[active] ?? files[0];
	const tone = dialect === "x52" ? "moss" : "brass";
	function update(body) {
		onChange(files.map((f, i) => i === active ? {
			...f,
			body
		} : f));
	}
	function go() {
		setBusy(true);
		window.setTimeout(() => {
			try {
				setRun(executeSources(dialect, files.map((f) => f.body)));
			} finally {
				setBusy(false);
			}
		}, 30);
	}
	if (!file) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-4 lg:grid-cols-[16rem_1fr]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			className: "flex flex-col gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "px-1 text-xs text-muted",
					children: "เทมเพลตเดียวกัน สองไฟล์"
				}),
				files.map((f, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setActive(i),
					className: `h-11 truncate rounded-lg border px-3 text-left font-mono text-xs ${i === active ? tone === "moss" ? "border-moss bg-surface-2 text-moss" : "border-brass bg-surface-2 text-brass" : "border-line bg-surface text-fg"}`,
					children: f.path
				}, f.path)),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "px-1 text-sm leading-relaxed text-muted",
					children: dialect === "x52" ? "โปรเจค X52 ใช้คำเต็ม อ่านแล้วรู้เรื่องทันที เครื่องจะตีความทีละคำสั่ง" : "โปรเจค X52+ โครงไฟล์เหมือนกัน แต่แหล่งโค้ดสั้นและสแกนยาก เครื่องรันตรงจึงเร็วกว่าชัด"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "flex min-w-0 flex-col gap-3 rounded-lg border border-line bg-surface p-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex flex-wrap items-center justify-between gap-2 px-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: `font-mono text-sm font-semibold ${tone === "moss" ? "text-moss" : "text-brass"}`,
						children: file.path
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: go,
						disabled: busy,
						className: `inline-flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold disabled:opacity-60 ${tone === "moss" ? "bg-moss text-moss-ink" : "bg-brass text-brass-ink"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
							className: "size-4",
							"aria-hidden": "true"
						}), busy ? "กำลังรัน" : "รันโปรเจค"]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					"aria-label": file.path,
					spellCheck: false,
					suppressHydrationWarning: true,
					value: file.body,
					onChange: (e) => update(e.target.value),
					className: `min-h-80 w-full resize-y rounded-lg border border-line bg-bg p-3 font-mono text-sm leading-relaxed text-fg outline-none ${tone === "moss" ? "focus:border-moss" : "focus:border-brass"}`
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-lg border border-line bg-bg p-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted",
							children: "ผลรันทั้งโปรเจค"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
							className: "mt-2 max-h-28 overflow-auto font-mono text-sm whitespace-pre-wrap text-fg",
							children: run ? run.output || (run.ok ? "(ไม่มีอะไรพิมพ์)" : "") : "ยังไม่รัน"
						}),
						run?.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-brass",
							children: run.error
						}) : null,
						run?.ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 font-mono text-xs text-muted",
							children: [
								"เวลารัน ",
								run.ms < 10 ? run.ms.toFixed(2) : run.ms.toFixed(1),
								" ms"
							]
						}) : null
					]
				})
			]
		})]
	});
}
function fmt(ms) {
	if (ms < .05) return "<0.1";
	if (ms < 10) return ms.toFixed(2);
	if (ms < 100) return ms.toFixed(1);
	return ms.toFixed(0);
}
function Meter({ label, ms, max, tone }) {
	const pct = max > 0 ? Math.max(4, Math.min(100, Math.round(ms / max * 100))) : 4;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-w-0 flex-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-1 flex items-baseline justify-between gap-3 font-mono text-xs",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: tone === "moss" ? "text-moss" : "text-brass",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "text-fg tabular-nums",
				children: [fmt(ms), " ms"]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "h-2 overflow-hidden rounded-full bg-bg",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: `h-full rounded-full motion-reduce:transition-none ${tone === "moss" ? "bg-moss" : "bg-brass"} transition-all duration-500`,
				style: { width: `${pct}%` }
			})
		})]
	});
}
function RacePanel({ x52, x52p, onX52, onX52p }) {
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [left, setLeft] = (0, import_react.useState)(null);
	const [right, setRight] = (0, import_react.useState)(null);
	function run() {
		setBusy(true);
		window.setTimeout(() => {
			try {
				setLeft(execute("x52", x52));
				setRight(execute("x52p", x52p));
			} finally {
				setBusy(false);
			}
		}, 40);
	}
	const bothOk = left?.ok && right?.ok;
	const max = Math.max(left?.ms ?? 0, right?.ms ?? 0, .1);
	let verdict = "กดรันทั้งคู่ แล้วดูแถบเวลา";
	if (left && right && bothOk) {
		if (right.ms + .05 < left.ms) {
			const ratio = left.ms / Math.max(right.ms, .05);
			verdict = `X52+ เร็วกว่า X52 ${ratio >= 10 ? ratio.toFixed(0) : ratio.toFixed(1)} เท่า ในงานเดียวกัน`;
		} else if (left.ms + .05 < right.ms) verdict = "รอบนี้ X52 เร็วกว่า — ลองตัวอย่างที่วนลูปยาวขึ้น";
		else verdict = "เวลาใกล้กันมาก ลองตัวอย่างที่หนักกว่า";
		if (left.output !== right.output) verdict = "ผลลัพธ์ไม่ตรงกัน ตรวจโค้ดทั้งสองฝั่ง";
	} else if (left && right) verdict = "มีฝั่งที่รันไม่ผ่าน อ่านข้อความสีทองใต้ช่องนั้น";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex flex-col gap-3 rounded-lg border border-line bg-surface p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: run,
							disabled: busy,
							className: "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-moss px-4 text-sm font-semibold text-moss-ink disabled:opacity-60",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
								className: "size-4",
								"aria-hidden": "true"
							}), busy ? "กำลังรัน" : "รันทั้งคู่"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: "แถบสั้นกว่าคือเร็วกว่า · วัดเฉพาะเวลารัน"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-sm text-brass",
						children: verdict
					}),
					left && right && bothOk ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-3 sm:flex-row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
							label: "X52 อ่านทีละคำสั่ง",
							ms: left.ms,
							max,
							tone: "moss"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
							label: "X52+ รันตรง",
							ms: right.ms,
							max,
							tone: "brass"
						})]
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Editor, {
					title: "X52",
					badge: "อ่านง่าย",
					tone: "moss",
					value: x52,
					onChange: onX52,
					label: "โค้ด X52"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Editor, {
					title: "X52+",
					badge: "อัดแน่น",
					tone: "brass",
					value: x52p,
					onChange: onX52p,
					label: "โค้ด X52+"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Output, {
					title: "ผล X52",
					run: left
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Output, {
					title: "ผล X52+",
					run: right
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
				className: "rounded-lg border border-line bg-surface px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
					className: "cursor-pointer text-sm font-medium text-fg",
					children: "เทียบสัญลักษณ์ X52 กับ X52+"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3",
					children: MAP_ROWS.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg border border-line bg-bg px-3 py-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted",
								children: row.means
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 truncate font-mono text-xs text-moss",
								children: row.easy
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate font-mono text-xs text-brass",
								children: row.fast
							})
						]
					}, row.means))
				})]
			})
		]
	});
}
function Editor({ title, badge, tone, value, onChange, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "flex min-w-0 flex-col gap-2 rounded-lg border border-line bg-surface p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex items-center justify-between gap-2 px-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: `font-mono text-sm font-semibold ${tone === "moss" ? "text-moss" : "text-brass"}`,
				children: title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs text-muted",
				children: badge
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
			"aria-label": label,
			spellCheck: false,
			suppressHydrationWarning: true,
			value,
			onChange: (e) => onChange(e.target.value),
			className: `min-h-56 w-full resize-y rounded-lg border border-line bg-bg p-3 font-mono text-sm leading-relaxed text-fg outline-none ${tone === "moss" ? "focus:border-moss" : "focus:border-brass"}`
		})]
	});
}
function Output({ title, run }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-w-0 rounded-lg border border-line bg-bg p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
				className: "mt-2 max-h-28 overflow-auto font-mono text-sm whitespace-pre-wrap text-fg",
				children: run ? run.output || (run.ok ? "(ไม่มีอะไรพิมพ์)" : "") : "ยังไม่รัน"
			}),
			run?.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-brass",
				children: run.error
			}) : null
		]
	});
}
var NOTE = {
	created: "สร้างใหม่",
	renamed: "ชื่อใหม่",
	overwrote: "วางทับ"
};
function WorkflowPanel(props) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-3xl text-sm leading-relaxed text-muted",
				children: "ทุกไฟล์ในแล็บนี้เกิดจากสองเวิร์กโฟลว์เท่านั้น create.yml สร้างไฟล์เปล่าโดยไม่เขียนเนื้อหา ส่วน write.yml เขียนเนื้อหาโดยไม่สร้างไฟล์ให้ ถ้ารันแล้วไม่ error ระบบจะไม่วางทับ และตั้งชื่อใหม่แทน ถ้าเป็น error ระบบจะวางทับไฟล์นั้นให้เลย จะได้ไม่ต้องไปหาเอง"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 xl:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					title: "create.yml",
					blurb: "Create file without write",
					icon: "create",
					yml: props.createYml,
					onYml: props.onCreate,
					expect: "create",
					files: props.files,
					onFiles: props.onFiles,
					onLog: props.onLog
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					title: "write.yml",
					blurb: "Write without create",
					icon: "write",
					yml: props.writeYml,
					onYml: props.onWrite,
					expect: "write",
					files: props.files,
					onFiles: props.onFiles,
					onLog: props.onLog
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid gap-4 lg:grid-cols-[1fr_18rem]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileList, {
					files: props.files,
					onFiles: props.onFiles
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-lg border border-line bg-surface p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-sm font-semibold text-fg",
						children: "บันทึกล่าสุด"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "mt-2 flex max-h-64 flex-col gap-2 overflow-auto",
						children: [props.log.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "text-sm text-muted",
							children: "ยังไม่รัน"
						}) : null, props.log.map((line, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "text-sm leading-relaxed text-fg",
							children: line
						}, `${i}-${line.slice(0, 12)}`))]
					})]
				})]
			})
		]
	});
}
function Card({ title, blurb, icon, yml, onYml, expect, files, onFiles, onLog }) {
	function go(conflict) {
		const next = setConflict(yml, conflict);
		onYml(next);
		try {
			const result = runWorkflow(files, parseWf(next, expect));
			onFiles(result.files);
			onLog(result.message);
		} catch (err) {
			onLog(err instanceof Error ? err.message : "อ่านเวิร์กโฟลว์ไม่ผ่าน");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "flex min-w-0 flex-col gap-3 rounded-lg border border-line bg-surface p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "flex items-start justify-between gap-3 px-1",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					className: "flex items-center gap-2 font-mono text-sm font-semibold text-fg",
					children: [icon === "create" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilePlus2, {
						className: "size-4 text-moss",
						"aria-hidden": "true"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilePenLine, {
						className: "size-4 text-brass",
						"aria-hidden": "true"
					}), title]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-muted",
					children: blurb
				})] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				"aria-label": title,
				spellCheck: false,
				suppressHydrationWarning: true,
				value: yml,
				onChange: (e) => onYml(e.target.value),
				className: "min-h-64 w-full resize-y rounded-lg border border-line bg-bg p-3 font-mono text-xs leading-relaxed text-fg outline-none focus:border-moss"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2 sm:flex-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => go("rename"),
					className: "inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-moss px-3 text-sm font-semibold text-moss-ink",
					children: "รันแบบไม่ error"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => go("overwrite"),
					className: "inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-brass px-3 text-sm font-semibold text-brass",
					children: "รันแบบ error แล้ววางทับ"
				})]
			})
		]
	});
}
function FileList({ files, onFiles }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-lg border border-line bg-surface p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between gap-2 px-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-sm font-semibold text-fg",
				children: "ไฟล์ที่ได้จากเวิร์กโฟลว์"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => onFiles([]),
				className: "h-11 rounded-lg border border-line px-3 text-sm text-muted",
				children: "ล้างแฟ้ม"
			})]
		}), files.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 rounded-lg border border-dashed border-line px-3 py-6 text-sm text-muted",
			children: "ยังไม่มีไฟล์ รัน create.yml เพื่อสร้างไฟล์เปล่า แล้วค่อย write.yml"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-3 flex flex-col gap-2",
			children: files.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "rounded-lg border border-line bg-bg p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-sm text-fg",
						children: f.path
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: `rounded-full px-2 py-1 font-mono text-xs ${f.note === "overwrote" ? "bg-brass text-brass-ink" : "bg-surface-2 text-moss"}`,
						children: NOTE[f.note]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
					className: "mt-2 max-h-24 overflow-auto font-mono text-xs whitespace-pre-wrap text-muted",
					children: f.body.length ? f.body : "(ว่าง — create ไม่ได้เขียนเนื้อหา)"
				})]
			}, f.path))
		})]
	});
}
var STORE = "x52-lab-v1";
var TABS = [
	{
		id: "race",
		label: "เทียบความเร็ว"
	},
	{
		id: "x52",
		label: "โปรเจค X52"
	},
	{
		id: "x52p",
		label: "โปรเจค X52+"
	},
	{
		id: "flow",
		label: "Workflows"
	}
];
function Studio() {
	const [tab, setTab] = (0, import_react.useState)("race");
	const [preset, setPreset] = (0, import_react.useState)(PRESETS[0].id);
	const [x52, setX52] = (0, import_react.useState)(PRESETS[0].x52);
	const [x52p, setX52p] = (0, import_react.useState)(PRESETS[0].x52p);
	const [proj52, setProj52] = (0, import_react.useState)(TEMPLATE_X52);
	const [projP, setProjP] = (0, import_react.useState)(TEMPLATE_X52P);
	const [createYml, setCreateYml] = (0, import_react.useState)(WORKFLOWS.create);
	const [writeYml, setWriteYml] = (0, import_react.useState)(WORKFLOWS.write);
	const [files, setFiles] = (0, import_react.useState)([]);
	const [log, setLog] = (0, import_react.useState)([]);
	const [ready, setReady] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		try {
			const raw = localStorage.getItem(STORE);
			if (raw) {
				const data = JSON.parse(raw);
				if (data.tab) setTab(data.tab);
				if (data.preset) setPreset(data.preset);
				if (typeof data.x52 === "string") setX52(data.x52);
				if (typeof data.x52p === "string") setX52p(data.x52p);
				if (Array.isArray(data.proj52) && data.proj52.length) setProj52(data.proj52);
				if (Array.isArray(data.projP) && data.projP.length) setProjP(data.projP);
				if (typeof data.createYml === "string") setCreateYml(data.createYml);
				if (typeof data.writeYml === "string") setWriteYml(data.writeYml);
				if (Array.isArray(data.files)) setFiles(data.files);
				if (Array.isArray(data.log)) setLog(data.log.slice(0, 12));
			}
		} catch {}
		setReady(true);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!ready) return;
		localStorage.setItem(STORE, JSON.stringify({
			tab,
			preset,
			x52,
			x52p,
			proj52,
			projP,
			createYml,
			writeYml,
			files,
			log: log.slice(0, 12)
		}));
	}, [
		ready,
		tab,
		preset,
		x52,
		x52p,
		proj52,
		projP,
		createYml,
		writeYml,
		files,
		log
	]);
	function pickPreset(id) {
		const found = PRESETS.find((p) => p.id === id);
		if (!found) return;
		setPreset(id);
		setX52(found.x52);
		setX52p(found.x52p);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-col gap-4 border-b border-line pb-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-mono text-xs tracking-widest text-brass",
								children: "X52 / X52+"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "mt-1 text-3xl font-semibold tracking-tight text-fg",
								children: "ห้องแล็บสองภาษา"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 max-w-2xl text-sm leading-relaxed text-muted",
								children: "เป้าของโปรเจคคือภาษาที่เร็วที่สุด X52 กับ X52+ แยกกัน แต่ใช้เทมเพลตเดียวกัน X52 อ่านง่ายกว่า แลกกับความเร็ว X52+ พิมพ์สั้น แหล่งโค้ดสแกนยาก และในสนามนี้เร็วกว่าแบบจับเวลาจริง"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "max-w-xs text-sm leading-relaxed text-muted",
						children: "สร้างไฟล์ด้วย create.yml เขียนเนื้อหาด้วย write.yml"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					role: "tablist",
					"aria-label": "ส่วนของแล็บ",
					className: "flex flex-wrap gap-2",
					children: TABS.map((item) => {
						const on = tab === item.id;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							role: "tab",
							"aria-selected": on,
							onClick: () => setTab(item.id),
							className: `h-11 rounded-lg px-3 text-sm font-medium ${on ? "bg-moss text-moss-ink" : "border border-line bg-surface text-fg"}`,
							children: item.label
						}, item.id);
					})
				})]
			}),
			tab === "race" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-2",
					children: PRESETS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => pickPreset(p.id),
						className: `h-11 rounded-lg border px-3 text-sm ${preset === p.id ? "border-brass bg-surface-2 text-brass" : "border-line bg-surface text-fg"}`,
						children: p.label
					}, p.id))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RacePanel, {
					x52,
					x52p,
					onX52: setX52,
					onX52p: setX52p
				})]
			}) : null,
			tab === "x52" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProjectPanel, {
				dialect: "x52",
				files: proj52,
				onChange: setProj52
			}) : null,
			tab === "x52p" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProjectPanel, {
				dialect: "x52p",
				files: projP,
				onChange: setProjP
			}) : null,
			tab === "flow" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WorkflowPanel, {
				createYml,
				writeYml,
				files,
				log,
				onCreate: setCreateYml,
				onWrite: setWriteYml,
				onFiles: setFiles,
				onLog: (line) => setLog((prev) => [line, ...prev].slice(0, 12))
			}) : null
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Studio, {});
}
//#endregion
export { Home as component };
