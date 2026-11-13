import { Play } from "lucide-react";
import { useState } from "react";
import { executeSources, type Exec } from "@/lib/lang/run";
import type { ProjFile } from "@/lib/lang/samples";

type Props = {
  dialect: "x52" | "x52p";
  files: ProjFile[];
  onChange: (files: ProjFile[]) => void;
};

export function ProjectPanel({ dialect, files, onChange }: Props) {
  const [active, setActive] = useState(0);
  const [run, setRun] = useState<Exec | null>(null);
  const [busy, setBusy] = useState(false);
  const file = files[active] ?? files[0];
  const tone = dialect === "x52" ? "moss" : "brass";

  function update(body: string) {
    onChange(files.map((f, i) => (i === active ? { ...f, body } : f)));
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

  return (
    <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
      <aside className="flex flex-col gap-2">
        <p className="px-1 text-xs text-muted">เทมเพลตเดียวกัน สองไฟล์</p>
        {files.map((f, i) => (
          <button
            key={f.path}
            type="button"
            onClick={() => setActive(i)}
            className={`h-11 truncate rounded-lg border px-3 text-left font-mono text-xs ${i === active ? (tone === "moss" ? "border-moss bg-surface-2 text-moss" : "border-brass bg-surface-2 text-brass") : "border-line bg-surface text-fg"}`}
          >
            {f.path}
          </button>
        ))}
        <p className="px-1 text-sm leading-relaxed text-muted">
          {dialect === "x52"
            ? "โปรเจค X52 ใช้คำเต็ม อ่านแล้วรู้เรื่องทันที เครื่องจะตีความทีละคำสั่ง"
            : "โปรเจค X52+ โครงไฟล์เหมือนกัน แต่แหล่งโค้ดสั้นและสแกนยาก เครื่องรันตรงจึงเร็วกว่าชัด"}
        </p>
      </aside>
      <section className="flex min-w-0 flex-col gap-3 rounded-lg border border-line bg-surface p-3">
        <header className="flex flex-wrap items-center justify-between gap-2 px-1">
          <h2 className={`font-mono text-sm font-semibold ${tone === "moss" ? "text-moss" : "text-brass"}`}>{file.path}</h2>
          <button
            type="button"
            onClick={go}
            disabled={busy}
            className={`inline-flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold disabled:opacity-60 ${tone === "moss" ? "bg-moss text-moss-ink" : "bg-brass text-brass-ink"}`}
          >
            <Play className="size-4" aria-hidden="true" />
            {busy ? "กำลังรัน" : "รันโปรเจค"}
          </button>
        </header>
        <textarea
          aria-label={file.path}
          spellCheck={false}
          suppressHydrationWarning
          value={file.body}
          onChange={(e) => update(e.target.value)}
          className={`min-h-80 w-full resize-y rounded-lg border border-line bg-bg p-3 font-mono text-sm leading-relaxed text-fg outline-none ${tone === "moss" ? "focus:border-moss" : "focus:border-brass"}`}
        />
        <div className="rounded-lg border border-line bg-bg p-3">
          <p className="text-xs text-muted">ผลรันทั้งโปรเจค</p>
          <pre className="mt-2 max-h-28 overflow-auto font-mono text-sm whitespace-pre-wrap text-fg">
            {run ? run.output || (run.ok ? "(ไม่มีอะไรพิมพ์)" : "") : "ยังไม่รัน"}
          </pre>
          {run?.error ? <p className="mt-2 text-sm text-brass">{run.error}</p> : null}
          {run?.ok ? (
            <p className="mt-2 font-mono text-xs text-muted">
              เวลารัน {run.ms < 10 ? run.ms.toFixed(2) : run.ms.toFixed(1)} ms
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
