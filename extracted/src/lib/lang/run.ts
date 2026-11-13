import { formatNum, mergeProgs, type Dialect, type Prog } from "./ast";
import { compileJit } from "./jit";
import { parseSource } from "./parse";
import { compileVm, runVm } from "./vm";

export const DEFAULT_FUEL = 40_000_000;
const PRINT_CAP = 200;

export type Exec = {
  ok: boolean;
  output: string;
  ms: number;
  compileMs: number;
  error?: string;
  engine: "vm" | "direct";
};

function explain(err: unknown): string {
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

function loadProg(dialect: Dialect, sources: string[]): Prog {
  return mergeProgs(sources.map((src) => parseSource(src, dialect)));
}

export function execute(dialect: Dialect, source: string, fuel = DEFAULT_FUEL): Exec {
  return executeSources(dialect, [source], fuel);
}

export function executeSources(dialect: Dialect, sources: string[], fuel = DEFAULT_FUEL): Exec {
  const engine = dialect === "x52" ? "vm" : "direct";
  const t0 = performance.now();
  let prog: Prog;
  try {
    prog = loadProg(dialect, sources);
  } catch (err) {
    return { ok: false, output: "", ms: 0, compileMs: performance.now() - t0, error: explain(err), engine };
  }
  const lines: string[] = [];
  const push = (n: number) => {
    lines.push(formatNum(n));
  };
  if (dialect === "x52") {
    let mod;
    try {
      mod = compileVm(prog, dialect);
    } catch (err) {
      return { ok: false, output: "", ms: 0, compileMs: performance.now() - t0, error: explain(err), engine };
    }
    const compileMs = performance.now() - t0;
    const t1 = performance.now();
    try {
      runVm(mod, push, fuel, PRINT_CAP);
    } catch (err) {
      return { ok: false, output: lines.join("\n"), ms: performance.now() - t1, compileMs, error: explain(err), engine };
    }
    return { ok: true, output: lines.join("\n"), ms: performance.now() - t1, compileMs, engine };
  }
  let jit;
  try {
    jit = compileJit(prog);
  } catch (err) {
    return { ok: false, output: "", ms: 0, compileMs: performance.now() - t0, error: explain(err), engine };
  }
  const compileMs = performance.now() - t0;
  const t1 = performance.now();
  try {
    jit(push, { n: fuel });
  } catch (err) {
    return { ok: false, output: lines.join("\n"), ms: performance.now() - t1, compileMs, error: explain(err), engine };
  }
  return { ok: true, output: lines.join("\n"), ms: performance.now() - t1, compileMs, engine };
}
