import { LangError, type BinOp, type Dialect, type Expr, type Fn, type Prog, type Stmt } from "./ast";

const OP = {
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
  FUEL: 25,
} as const;

const BIN: Record<string, number> = {
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
  ">=": OP.GE,
};

export type ByteFunc = {
  name: string;
  params: number;
  localCount: number;
  consts: number[];
  code: number[];
};

export type Module = { funcs: ByteFunc[]; entry: number };

class Cmp {
  code: number[] = [];
  consts: number[] = [];
  constructor(
    private readonly locals: Map<string, number>,
    private readonly fnIndex: Map<string, number>,
  ) {}
  constOf(n: number): number {
    const i = this.consts.indexOf(n);
    if (i >= 0) return i;
    this.consts.push(n);
    return this.consts.length - 1;
  }
  emit(...xs: number[]): void {
    this.code.push(...xs);
  }
  hole(op: number): number {
    this.code.push(op, 0);
    return this.code.length - 1;
  }
  patch(at: number): void {
    this.code[at] = this.code.length - (at + 1);
  }
  expr(e: Expr): void {
    if (e.t === "num") {
      this.emit(OP.CONST, this.constOf(e.v));
      return;
    }
    if (e.t === "var") {
      const slot = this.locals.get(e.n);
      if (slot === undefined) throw new LangError(`ไม่รู้จัก ${e.n}`, e.line);
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
      if (fi === undefined) throw new LangError(`ไม่รู้จักฟังก์ชัน ${e.n}`, e.line);
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
    const op = BIN[e.op as BinOp];
    if (!op) throw new LangError(`เครื่องหมาย ${e.op} ใช้ไม่ได้`, e.line);
    this.emit(op);
  }
  stmts(list: Stmt[]): void {
    for (const s of list) this.stmt(s);
  }
  stmt(s: Stmt): void {
    if (s.t === "let" || s.t === "set") {
      const slot = this.locals.get(s.n);
      if (slot === undefined) throw new LangError(`ไม่รู้จัก ${s.n}`, s.line);
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
}

function collectLocals(fn: Fn, dialect: Dialect): Map<string, number> {
  const locals = new Map<string, number>();
  const add = (n: string) => {
    if (!locals.has(n)) locals.set(n, locals.size);
  };
  for (const p of fn.p) {
    if (locals.has(p)) throw new LangError(`พารามิเตอร์ ${p} ซ้ำ`, fn.line);
    add(p);
  }
  const walk = (stmts: Stmt[]) => {
    for (const s of stmts) {
      if (s.t === "let") {
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
    }
  };
  walk(fn.b);
  return locals;
}

export function compileVm(prog: Prog, dialect: Dialect): Module {
  const fns = prog.fns.slice();
  if (prog.top.length) fns.push({ n: "<top>", p: [], b: prog.top, line: prog.top[0]?.line ?? 1 });
  const names = new Map<string, number>();
  fns.forEach((fn, i) => {
    if (names.has(fn.n)) throw new LangError(`ฟังก์ชัน ${fn.n} ซ้ำ`, fn.line);
    names.set(fn.n, i);
  });
  const funcs: ByteFunc[] = fns.map((fn) => {
    const locals = collectLocals(fn, dialect);
    const c = new Cmp(locals, names);
    c.stmts(fn.b);
    c.emit(OP.CONST, c.constOf(0), OP.RET);
    return { name: fn.n, params: fn.p.length, localCount: locals.size, consts: c.consts, code: c.code };
  });
  let entry = names.get("<top>");
  if (entry === undefined) entry = names.get("main");
  if (entry === undefined) throw new LangError("ยังไม่มี main");
  return { funcs, entry };
}

type Frame = { f: ByteFunc; ip: number; locals: number[]; stack: number[] };

function pop(fr: Frame): number {
  const v = fr.stack.pop();
  if (v === undefined) throw new Error("STACK");
  return v;
}

export function runVm(mod: Module, print: (n: number) => void, fuel0: number, printCap: number): void {
  let fuel = fuel0;
  let printed = 0;
  const start = mod.funcs[mod.entry];
  if (!start) throw new LangError("ไม่มีจุดเริ่ม");
  const frames: Frame[] = [{ f: start, ip: 0, locals: Array.from({ length: start.localCount }, () => 0), stack: [] }];
  while (frames.length) {
    const fr = frames[frames.length - 1]!;
    const code = fr.f.code;
    if (fr.ip >= code.length) {
      frames.pop();
      const parent = frames[frames.length - 1];
      if (parent) parent.stack.push(0);
      continue;
    }
    const op = code[fr.ip++]!;
    switch (op) {
      case OP.CONST:
        fr.stack.push(fr.f.consts[code[fr.ip++]!]!);
        break;
      case OP.LOAD:
        fr.stack.push(fr.locals[code[fr.ip++]!]!);
        break;
      case OP.STORE:
        fr.locals[code[fr.ip++]!] = pop(fr);
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
        const ok =
          op === OP.EQ ? a === b : op === OP.NE ? a !== b : op === OP.LT ? a < b : op === OP.GT ? a > b : op === OP.LE ? a <= b : a >= b;
        fr.stack.push(ok ? 1 : 0);
        break;
      }
      case OP.JMP: {
        const rel = code[fr.ip++]!;
        fr.ip += rel;
        break;
      }
      case OP.JT:
      case OP.JF: {
        const rel = code[fr.ip++]!;
        const v = pop(fr);
        if (op === OP.JT ? !!v : !v) fr.ip += rel;
        break;
      }
      case OP.CALL: {
        const fi = code[fr.ip++]!;
        const argc = code[fr.ip++]!;
        const fn = mod.funcs[fi];
        if (!fn) throw new Error("CALL");
        if (argc !== fn.params) throw new Error(`ARITY:${fn.name}:${fn.params}`);
        const locals = Array.from({ length: fn.localCount }, () => 0);
        for (let i = argc - 1; i >= 0; i -= 1) locals[i] = pop(fr);
        frames.push({ f: fn, ip: 0, locals, stack: [] });
        break;
      }
      case OP.RET: {
        const v = fr.stack.pop() ?? 0;
        frames.pop();
        const parent = frames[frames.length - 1];
        if (parent) parent.stack.push(v);
        break;
      }
      case OP.PRINT: {
        printed += 1;
        if (printed > printCap) throw new Error("PRINT_CAP");
        print(pop(fr));
        break;
      }
      case OP.FUEL:
        fuel -= 1;
        if (fuel < 0) throw new Error("FUEL");
        break;
      default:
        throw new Error("OP");
    }
  }
}
