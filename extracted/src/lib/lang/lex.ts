import { LangError, type Dialect } from "./ast";

export type Tok = { k: "id" | "num" | "op" | "punc" | "eof"; v: string; line: number };

const TWO = ["+=", "-=", "*=", "/=", "%=", "==", "!=", "<=", ">=", "&&", "||"];
const ONE_OP = "+-*/%=<>!";

export function lex(src: string, dialect: Dialect): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  let line = 1;
  while (i < src.length) {
    const c = src[i]!;
    if (c === "\n") {
      line += 1;
      i += 1;
      continue;
    }
    if (c === " " || c === "\t" || c === "\r") {
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
      while (i < src.length && ((src[i]! >= "0" && src[i]! <= "9") || src[i] === ".")) {
        if (src[i] === ".") dots += 1;
        i += 1;
      }
      if (dots > 1) throw new LangError("เลขทศนิยมไม่ถูกต้อง", line);
      out.push({ k: "num", v: src.slice(start, i), line });
      continue;
    }
    if ((c >= "A" && c <= "Z") || (c >= "a" && c <= "z") || c === "_") {
      const start = i;
      i += 1;
      while (i < src.length) {
        const d = src[i]!;
        if ((d >= "A" && d <= "Z") || (d >= "a" && d <= "z") || (d >= "0" && d <= "9") || d === "_") i += 1;
        else break;
      }
      out.push({ k: "id", v: src.slice(start, i), line });
      continue;
    }
    const two = src.slice(i, i + 2);
    if (TWO.includes(two)) {
      out.push({ k: "op", v: two, line });
      i += 2;
      continue;
    }
    if (ONE_OP.includes(c)) {
      out.push({ k: "op", v: c, line });
      i += 1;
      continue;
    }
    if ("(){},;".includes(c) || (dialect === "x52p" && "~?^$:".includes(c))) {
      out.push({ k: "punc", v: c, line });
      i += 1;
      continue;
    }
    if (dialect === "x52" && "~?^$:".includes(c)) {
      throw new LangError("สัญลักษณ์นี้เป็นของ X52+ ไม่ใช่ X52", line);
    }
    if (c === "#") throw new LangError("คอมเมนต์ของ X52 ใช้ //", line);
    throw new LangError(`ไม่รู้จักตัวอักษร ${c}`, line);
  }
  return out;
}
