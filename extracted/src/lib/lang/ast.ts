export type Dialect = "x52" | "x52p";

export type BinOp =
  | "+"
  | "-"
  | "*"
  | "/"
  | "%"
  | "=="
  | "!="
  | "<"
  | ">"
  | "<="
  | ">="
  | "&&"
  | "||";

export type UnaryOp = "-" | "!";

export type Expr =
  | { t: "num"; v: number; line: number }
  | { t: "var"; n: string; line: number }
  | { t: "bin"; op: BinOp; l: Expr; r: Expr; line: number }
  | { t: "un"; op: UnaryOp; x: Expr; line: number }
  | { t: "call"; n: string; a: Expr[]; line: number };

export type Stmt =
  | { t: "let"; n: string; x: Expr; line: number }
  | { t: "set"; n: string; x: Expr; line: number }
  | { t: "while"; c: Expr; b: Stmt[]; line: number }
  | { t: "if"; c: Expr; a: Stmt[]; e: Stmt[]; line: number }
  | { t: "ret"; x: Expr | null; line: number }
  | { t: "print"; x: Expr; line: number }
  | { t: "expr"; x: Expr; line: number };

export type Fn = { n: string; p: string[]; b: Stmt[]; line: number };
export type Prog = { fns: Fn[]; top: Stmt[] };

export class LangError extends Error {
  constructor(message: string, line?: number) {
    super(line ? `${message} (บรรทัด ${line})` : message);
    this.name = "LangError";
  }
}

export function formatNum(n: number): string {
  if (!Number.isFinite(n)) return "ไม่ใช่จำนวน";
  if (Object.is(n, -0)) return "0";
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return String(n);
  const rounded = Math.round(n * 1e6) / 1e6;
  return String(rounded);
}

export function mergeProgs(parts: Prog[]): Prog {
  const fns: Fn[] = [];
  const seen = new Set<string>();
  const top: Stmt[] = [];
  for (const part of parts) {
    for (const fn of part.fns) {
      if (seen.has(fn.n)) throw new LangError(`ฟังก์ชัน ${fn.n} ซ้ำ`, fn.line);
      seen.add(fn.n);
      fns.push(fn);
    }
    top.push(...part.top);
  }
  return { fns, top };
}
