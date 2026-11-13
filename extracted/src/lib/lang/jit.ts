import { LangError, type Expr, type Fn, type Prog, type Stmt } from "./ast";

const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;
const CMP = new Set(["==", "!=", "<", ">", "<=", ">="]);

function vn(n: string): string {
  if (!IDENT.test(n)) throw new LangError(`ชื่อ ${n} ใช้ใน X52+ ไม่ได้`);
  return `v_${n}`;
}
function fnName(n: string): string {
  if (!IDENT.test(n) || n === "<top>") return n === "<top>" ? "f___top" : `f_${n}`;
  return `f_${n}`;
}

class Emit {
  constructor(private readonly known: Set<string>) {}
  expr(e: Expr): string {
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
  stmt(s: Stmt): string {
    if (s.t === "let" || s.t === "set") {
      if (!this.known.has(s.n)) throw new LangError(`ไม่รู้จัก ${s.n}`, s.line);
      return `${vn(s.n)}=${this.expr(s.x)};`;
    }
    if (s.t === "print") return `print(${this.expr(s.x)});`;
    if (s.t === "ret") return `return ${s.x ? this.expr(s.x) : "0"};`;
    if (s.t === "expr") return `${this.expr(s.x)};`;
    if (s.t === "while") {
      return `while(${this.expr(s.c)}){if(--fuel.n<0)throw new Error("FUEL");${s.b.map((x) => this.stmt(x)).join("")}}`;
    }
    if (s.t === "if") {
      const e = s.e.length ? `else{${s.e.map((x) => this.stmt(x)).join("")}}` : "";
      return `if(${this.expr(s.c)}){${s.a.map((x) => this.stmt(x)).join("")}}${e}`;
    }
    return "";
  }
}

function localsOf(fn: Fn): Map<string, number> {
  const locals = new Map<string, number>();
  const add = (n: string) => {
    if (!IDENT.test(n)) throw new LangError(`ชื่อ ${n} ใช้ไม่ได้`, fn.line);
    if (!locals.has(n)) locals.set(n, locals.size);
  };
  for (const p of fn.p) {
    if (locals.has(p)) throw new LangError(`พารามิเตอร์ ${p} ซ้ำ`, fn.line);
    add(p);
  }
  const walk = (stmts: Stmt[]) => {
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

export type JitFn = (print: (n: number) => void, fuel: { n: number }) => void;

export function compileJit(prog: Prog): JitFn {
  const fns = prog.fns.slice();
  if (prog.top.length) fns.push({ n: "<top>", p: [], b: prog.top, line: prog.top[0]?.line ?? 1 });
  const declared = new Set(fns.map((f) => f.n));
  if (!declared.has("main") && !declared.has("<top>")) throw new LangError("ยังไม่มี main");
  const checkCalls = (e: Expr) => {
    if (e.t === "call" && !declared.has(e.n)) throw new LangError(`ไม่รู้จักฟังก์ชัน ${e.n}`, e.line);
    if (e.t === "bin") {
      checkCalls(e.l);
      checkCalls(e.r);
    } else if (e.t === "un") checkCalls(e.x);
    else if (e.t === "call") e.a.forEach(checkCalls);
  };
  const walkStmt = (s: Stmt) => {
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
    const fuel = `if(--fuel.n<0)throw new Error("FUEL");`;
    return `function ${fnName(fn.n)}(${params}){${arity}${fuel}${decl}${fn.b.map((s) => em.stmt(s)).join("")}return 0;}`;
  });
  const entry = declared.has("<top>") ? "f___top" : "f_main";
  const source = `"use strict";${bodies.join("")}${entry}();`;
  try {
    const made = new Function("print", "fuel", source) as JitFn;
    return made;
  } catch {
    throw new LangError("คอมไพล์ X52+ ไม่ผ่าน");
  }
}
