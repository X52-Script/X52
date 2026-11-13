import { LangError, type BinOp, type Dialect, type Expr, type Fn, type Prog, type Stmt, type UnaryOp } from "./ast";
import { lex, type Tok } from "./lex";

const X52_WORDS = new Set(["fn", "let", "return", "while", "if", "else", "print"]);

class Parser {
  private i = 0;
  constructor(
    private readonly toks: Tok[],
    private readonly dialect: Dialect,
  ) {}

  parse(): Prog {
    const fns: Fn[] = [];
    const top: Stmt[] = [];
    this.skipSep();
    while (!this.eof()) {
      if (this.dialect === "x52" && this.isKw("fn")) fns.push(this.parseFnX52());
      else if (this.dialect === "x52p" && this.isPunc("$")) fns.push(this.parseFnPlus());
      else top.push(this.parseStmt());
      this.skipSep();
    }
    return { fns, top };
  }

  private cur(): Tok {
    return this.toks[this.i] ?? { k: "eof", v: "", line: this.toks.at(-1)?.line ?? 1 };
  }
  private eof(): boolean {
    return this.cur().k === "eof";
  }
  private eat(): Tok {
    const t = this.cur();
    if (t.k === "eof") throw new LangError("โค้ดจบก่อนครบ", t.line);
    this.i += 1;
    return t;
  }
  private isKw(w: string): boolean {
    const t = this.cur();
    return t.k === "id" && t.v === w;
  }
  private isOp(w: string): boolean {
    const t = this.cur();
    return t.k === "op" && t.v === w;
  }
  private isPunc(w: string): boolean {
    const t = this.cur();
    return t.k === "punc" && t.v === w;
  }
  private expectKw(w: string): void {
    if (!this.isKw(w)) throw new LangError(`ต้องมีคำว่า ${w}`, this.cur().line);
    this.eat();
  }
  private expectPunc(w: string): void {
    if (!this.isPunc(w)) throw new LangError(`ต้องมี ${w}`, this.cur().line);
    this.eat();
  }
  private skipSep(): void {
    while (this.isPunc(";")) this.eat();
  }
  private ident(): string {
    const t = this.cur();
    if (t.k !== "id") throw new LangError("ต้องมีชื่อ", t.line);
    if (this.dialect === "x52" && X52_WORDS.has(t.v)) throw new LangError(`${t.v} เป็นคำสงวนของ X52`, t.line);
    if (this.dialect === "x52p" && X52_WORDS.has(t.v)) {
      throw new LangError(`คำว่า ${t.v} เป็นของ X52 — X52+ ใช้สัญลักษณ์สั้นแทน`, t.line);
    }
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(t.v)) throw new LangError("ชื่อใช้ a-z กับขีดล่าง", t.line);
    this.eat();
    return t.v;
  }
  private canStartExpr(): boolean {
    const t = this.cur();
    return t.k === "num" || t.k === "id" || (t.k === "punc" && t.v === "(") || (t.k === "op" && (t.v === "!" || t.v === "-"));
  }

  private parseFnX52(): Fn {
    const line = this.cur().line;
    this.expectKw("fn");
    const n = this.ident();
    this.expectPunc("(");
    const p = this.params();
    this.expectPunc(")");
    const b = this.block();
    return { n, p, b, line };
  }

  private parseFnPlus(): Fn {
    const line = this.cur().line;
    this.expectPunc("$");
    const n = this.ident();
    this.expectPunc("(");
    const p = this.params();
    this.expectPunc(")");
    const b = this.block();
    return { n, p, b, line };
  }

  private params(): string[] {
    const p: string[] = [];
    if (this.isPunc(")")) return p;
    p.push(this.ident());
    while (this.isPunc(",")) {
      this.eat();
      p.push(this.ident());
    }
    return p;
  }

  private block(): Stmt[] {
    this.expectPunc("{");
    const body: Stmt[] = [];
    this.skipSep();
    while (!this.isPunc("}") && !this.eof()) {
      body.push(this.parseStmt());
      this.skipSep();
    }
    this.expectPunc("}");
    return body;
  }

  private parseStmt(): Stmt {
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
        const c = this.parseExpr();
        return { t: "while", c, b: this.block(), line };
      }
      if (this.isPunc("?")) {
        this.eat();
        const c = this.parseExpr();
        const a = this.block();
        let e: Stmt[] = [];
        if (this.isPunc(":")) {
          this.eat();
          e = this.block();
        }
        return { t: "if", c, a, e, line };
      }
      if (this.isPunc("^")) {
        this.eat();
        return { t: "ret", x: this.canStartExpr() ? this.parseExpr() : null, line };
      }
      if (this.isOp("!")) {
        this.eat();
        return { t: "print", x: this.parseExpr(), line };
      }
    }
    if (this.cur().k === "id" && this.isAssignOp(this.peek())) return this.parseAssign(line);
    return { t: "expr", x: this.parseExpr(), line };
  }

  private peek(): Tok {
    return this.toks[this.i + 1] ?? { k: "eof", v: "", line: this.cur().line };
  }
  private isAssignOp(t: Tok): boolean {
    return t.k === "op" && (t.v === "=" || t.v === "+=" || t.v === "-=" || t.v === "*=" || t.v === "/=" || t.v === "%=");
  }

  private parseLet(line: number): Stmt {
    this.expectKw("let");
    const n = this.ident();
    if (!this.isOp("=")) throw new LangError("let ต้องตามด้วย =", this.cur().line);
    this.eat();
    return { t: "let", n, x: this.parseExpr(), line };
  }

  private parseAssign(line: number): Stmt {
    const n = this.ident();
    const op = this.eat();
    if (op.v === "=") return { t: "set", n, x: this.parseExpr(), line };
    const bin = op.v[0] as BinOp;
    return { t: "set", n, x: { t: "bin", op: bin, l: { t: "var", n, line }, r: this.parseExpr(), line }, line };
  }

  private parseReturn(line: number): Stmt {
    this.expectKw("return");
    return { t: "ret", x: this.canStartExpr() ? this.parseExpr() : null, line };
  }

  private parseWhile(line: number): Stmt {
    this.expectKw("while");
    const c = this.parseExpr();
    return { t: "while", c, b: this.block(), line };
  }

  private parseIf(line: number): Stmt {
    this.expectKw("if");
    const c = this.parseExpr();
    const a = this.block();
    let e: Stmt[] = [];
    if (this.isKw("else")) {
      this.eat();
      if (this.isKw("if")) e = [this.parseIf(this.cur().line)];
      else e = this.block();
    }
    return { t: "if", c, a, e, line };
  }

  private parsePrint(line: number): Stmt {
    this.expectKw("print");
    this.expectPunc("(");
    const x = this.parseExpr();
    this.expectPunc(")");
    return { t: "print", x, line };
  }

  private parseExpr(): Expr {
    return this.parseOr();
  }
  private parseOr(): Expr {
    let l = this.parseAnd();
    while (this.isOp("||")) {
      const line = this.cur().line;
      this.eat();
      l = { t: "bin", op: "||", l, r: this.parseAnd(), line };
    }
    return l;
  }
  private parseAnd(): Expr {
    let l = this.parseCmp();
    while (this.isOp("&&")) {
      const line = this.cur().line;
      this.eat();
      l = { t: "bin", op: "&&", l, r: this.parseCmp(), line };
    }
    return l;
  }
  private parseCmp(): Expr {
    let l = this.parseAdd();
    const ops = new Set(["==", "!=", "<", ">", "<=", ">="]);
    while (this.cur().k === "op" && ops.has(this.cur().v)) {
      const line = this.cur().line;
      const op = this.eat().v as BinOp;
      l = { t: "bin", op, l, r: this.parseAdd(), line };
    }
    return l;
  }
  private parseAdd(): Expr {
    let l = this.parseMul();
    while (this.isOp("+") || this.isOp("-")) {
      const line = this.cur().line;
      const op = this.eat().v as BinOp;
      l = { t: "bin", op, l, r: this.parseMul(), line };
    }
    return l;
  }
  private parseMul(): Expr {
    let l = this.parseUnary();
    while (this.isOp("*") || this.isOp("/") || this.isOp("%")) {
      const line = this.cur().line;
      const op = this.eat().v as BinOp;
      l = { t: "bin", op, l, r: this.parseUnary(), line };
    }
    return l;
  }
  private parseUnary(): Expr {
    if (this.isOp("!") || this.isOp("-")) {
      const line = this.cur().line;
      const op = this.eat().v as UnaryOp;
      return { t: "un", op, x: this.parseUnary(), line };
    }
    return this.parsePost();
  }
  private parsePost(): Expr {
    const e = this.parsePrimary();
    if (e.t === "var" && this.isPunc("(")) {
      this.eat();
      const args: Expr[] = [];
      if (!this.isPunc(")")) {
        args.push(this.parseExpr());
        while (this.isPunc(",")) {
          this.eat();
          args.push(this.parseExpr());
        }
      }
      this.expectPunc(")");
      return { t: "call", n: e.n, a: args, line: e.line };
    }
    return e;
  }
  private parsePrimary(): Expr {
    const t = this.cur();
    if (t.k === "num") {
      this.eat();
      const v = Number(t.v);
      if (!Number.isFinite(v)) throw new LangError("เลขไม่ถูกต้อง", t.line);
      return { t: "num", v, line: t.line };
    }
    if (t.k === "id") {
      if (this.dialect === "x52" && X52_WORDS.has(t.v)) throw new LangError(`ใช้ ${t.v} ตรงนี้ไม่ได้`, t.line);
      if (this.dialect === "x52p" && X52_WORDS.has(t.v)) {
        throw new LangError(`คำว่า ${t.v} เป็นของ X52`, t.line);
      }
      this.eat();
      return { t: "var", n: t.v, line: t.line };
    }
    if (this.isPunc("(")) {
      this.eat();
      const e = this.parseExpr();
      this.expectPunc(")");
      return e;
    }
    throw new LangError("นิพจน์ไม่ครบ", t.line);
  }
}

export function parseSource(src: string, dialect: Dialect): Prog {
  if (!src.trim()) throw new LangError("ยังไม่มีโค้ด");
  return new Parser(lex(src, dialect), dialect).parse();
}
