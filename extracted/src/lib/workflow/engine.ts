export type Conflict = "rename" | "overwrite";
export type WfName = "create" | "write";

export type VFile = {
  path: string;
  body: string;
  via: WfName;
  note: "created" | "renamed" | "overwrote";
};

export type WfDoc = {
  name: WfName;
  conflict: Conflict;
  path: string;
  body: string;
  ignoredBody: boolean;
};

export type WfOutcome = {
  ok: boolean;
  recovered: boolean;
  requested: string;
  actual: string;
  message: string;
  files: VFile[];
};

const CREATE_YML = `name: create
# Create file without write
# ไม่เขียนเนื้อหาลงไฟล์
# รันแล้วไม่ขึ้น error: ถ้าชื่อซ้ำ จะได้ชื่อใหม่ เพราะจะไม่วางทับ
# ถ้า error: วางทับไฟล์เดิม จะได้ไม่ต้องไปหาเอง
conflict: rename
path: src/main.x52
`;

const WRITE_YML = `name: write
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
`;

export const WORKFLOWS = { create: CREATE_YML, write: WRITE_YML };

export function setConflict(src: string, conflict: Conflict): string {
  if (/^conflict\s*:/m.test(src)) return src.replace(/^conflict\s*:.*/m, `conflict: ${conflict}`);
  return `conflict: ${conflict}\n${src}`;
}

export function parseWf(src: string, expect?: WfName): WfDoc {
  let name: string | null = null;
  let conflict: string | null = null;
  let path: string | null = null;
  let body: string | null = null;
  const lines = src.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i] ?? "";
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = /^(name|conflict|path|body)\s*:\s*(.*)$/.exec(trimmed);
    if (!m) throw new Error(`อ่านไม่ได้ที่บรรทัด ${i + 1} — ใช้ได้แค่ name, conflict, path, body`);
    const key = m[1]!;
    const val = (m[2] ?? "").trim();
    if (key === "body" && (val === "|" || val === "|-")) {
      const indent = raw.match(/^\s*/)?.[0].length ?? 0;
      const block: string[] = [];
      i += 1;
      while (i < lines.length) {
        const l = lines[i] ?? "";
        if (l.trim() === "") {
          block.push("");
          i += 1;
          continue;
        }
        const ind = l.match(/^\s*/)?.[0].length ?? 0;
        if (ind <= indent) {
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
  if (conflict !== "rename" && conflict !== "overwrite") {
    throw new Error("conflict ต้องเป็น rename หรือ overwrite");
  }
  if (!path) throw new Error("ยังไม่มี path");
  const ignoredBody = name === "create" && body !== null && body !== "";
  return { name, conflict, path, body: name === "write" ? (body ?? "") : "", ignoredBody };
}

function stripQuote(v: string): string {
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
  return v;
}

function unindent(block: string[]): string {
  const indents = block.filter((l) => l.trim()).map((l) => l.match(/^\s*/)?.[0].length ?? 0);
  const min = indents.length ? Math.min(...indents) : 0;
  return block
    .map((l) => (l.trim() ? l.slice(min) : ""))
    .join("\n")
    .replace(/\n+$/, "");
}

export function validatePath(path: string): string | null {
  const p = path.trim();
  if (!p) return "ยังไม่ได้ใส่ path";
  if (p.length > 80) return "path ยาวเกิน";
  if (p.startsWith("/") || p.includes("..") || p.includes("\\")) return "ใช้ path สั้น ๆ เช่น src/main.x52";
  if (!/^[A-Za-z0-9._/-]+$/.test(p)) return "path ใช้ได้แค่ตัวอักษร ตัวเลข จุด ขีด และ /";
  if (p.endsWith("/")) return "ต้องเป็นชื่อไฟล์ ไม่ใช่โฟลเดอร์";
  return null;
}

export function freshName(path: string, has: (p: string) => boolean): string {
  if (!has(path)) return path;
  const slash = path.lastIndexOf("/");
  const dir = slash >= 0 ? path.slice(0, slash + 1) : "";
  const file = slash >= 0 ? path.slice(slash + 1) : path;
  const dot = file.lastIndexOf(".");
  const ext = dot > 0 ? file.slice(dot) : "";
  const base = ext ? file.slice(0, dot) : file;
  const root = base.replace(/-\d+$/, "");
  for (let i = 2; i < 1000; i += 1) {
    const next = `${dir}${root}-${i}${ext}`;
    if (!has(next)) return next;
  }
  return `${dir}${root}-x${ext}`;
}

function upsert(files: VFile[], next: VFile): VFile[] {
  const rest = files.filter((f) => f.path !== next.path);
  rest.push(next);
  rest.sort((a, b) => a.path.localeCompare(b.path));
  return rest;
}

export function runWorkflow(files: VFile[], doc: WfDoc): WfOutcome {
  const requested = doc.path.trim();
  const invalid = validatePath(requested);
  const has = (p: string) => files.some((f) => f.path === p);
  if (invalid) {
    return {
      ok: false,
      recovered: false,
      requested,
      actual: requested,
      message: invalid,
      files,
    };
  }
  if (doc.name === "create") {
    const noteBits = doc.ignoredBody ? " ข้ามเนื้อหา เพราะ create ไม่เขียน" : "";
    if (!has(requested)) {
      const filesNext = upsert(files, { path: requested, body: "", via: "create", note: "created" });
      return {
        ok: true,
        recovered: false,
        requested,
        actual: requested,
        message: `สร้างไฟล์ว่าง ${requested} โดยไม่เขียนเนื้อหา${noteBits}`,
        files: filesNext,
      };
    }
    if (doc.conflict === "rename") {
      const actual = freshName(requested, has);
      const filesNext = upsert(files, { path: actual, body: "", via: "create", note: "renamed" });
      return {
        ok: true,
        recovered: false,
        requested,
        actual,
        message: `ไม่ขึ้น error จึงไม่วางทับ — ได้ชื่อใหม่ ${actual}${noteBits}`,
        files: filesNext,
      };
    }
    const filesNext = upsert(files, { path: requested, body: "", via: "create", note: "overwrote" });
    return {
      ok: false,
      recovered: true,
      requested,
      actual: requested,
      message: `error ที่ ${requested} — วางทับให้ว่างแล้ว ไม่ต้องไปหาไฟล์เอง${noteBits}`,
      files: filesNext,
    };
  }
  if (!has(requested)) {
    if (doc.conflict === "overwrite") {
      const filesNext = upsert(files, { path: requested, body: doc.body, via: "write", note: "overwrote" });
      return {
        ok: false,
        recovered: true,
        requested,
        actual: requested,
        message: `error ไม่มีไฟล์ให้เขียน — วางทับลง ${requested} ให้แล้ว ไม่ต้องไปหาเอง`,
        files: filesNext,
      };
    }
    return {
      ok: false,
      recovered: false,
      requested,
      actual: requested,
      message: "write ไม่สร้างไฟล์ — ยังไม่มี path นี้ รัน create ก่อน หรือรันแบบ error เพื่อวางทับ",
      files,
    };
  }
  if (doc.conflict === "rename") {
    const actual = freshName(requested, has);
    const filesNext = upsert(files, { path: actual, body: doc.body, via: "write", note: "renamed" });
    return {
      ok: true,
      recovered: false,
      requested,
      actual,
      message: `ไม่ขึ้น error จึงไม่วางทับ — เขียนลงชื่อใหม่ ${actual}`,
      files: filesNext,
    };
  }
  const filesNext = upsert(files, { path: requested, body: doc.body, via: "write", note: "overwrote" });
  return {
    ok: false,
    recovered: true,
    requested,
    actual: requested,
    message: `error ที่ ${requested} — วางทับเนื้อหาแล้ว ไม่ต้องไปหาไฟล์เอง`,
    files: filesNext,
  };
}
