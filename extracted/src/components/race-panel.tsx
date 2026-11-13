import { Play } from "lucide-react";
import { useState } from "react";
import { execute, type Exec } from "@/lib/lang/run";
import { MAP_ROWS, PRESETS } from "@/lib/lang/samples";

type Props = {
  x52: string;
  x52p: string;
  onX52: (v: string) => void;
  onX52p: (v: string) => void;
};

function fmt(ms: number): string {
  if (ms < 0.05) return "<0.1";
  if (ms < 10) return ms.toFixed(2);
  if (ms < 100) return ms.toFixed(1);
  return ms.toFixed(0);
}

function Meter({ label, ms, max, tone }: { label: string; ms: number; max: number; tone: "moss" | "brass" }) {
  const pct = max > 0 ? Math.max(4, Math.min(100, Math.round((ms / max) * 100))) : 4;
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 flex items-baseline justify-between gap-3 font-mono text-xs">
        <span className={tone === "moss" ? "text-moss" : "text-brass"}>{label}</span>
        <span className="text-fg tabular-nums">{fmt(ms)} ms</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-bg">
        <div
          className={`h-full rounded-full motion-reduce:transition-none ${tone === "moss" ? "bg-moss" : "bg-brass"} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function RacePanel({ x52, x52p, onX52, onX52p }: Props) {
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState<Exec | null>(null);
  const [right, setRight] = useState<Exec | null>(null);

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
  const max = Math.max(left?.ms ?? 0, right?.ms ?? 0, 0.1);
  let verdict = "กดรันทั้งคู่ แล้วดูแถบเวลา";
  if (left && right && bothOk) {
    if (right.ms + 0.05 < left.ms) {
      const ratio = left.ms / Math.max(right.ms, 0.05);
      const shown = ratio >= 10 ? ratio.toFixed(0) : ratio.toFixed(1);
      verdict = `X52+ เร็วกว่า X52 ${shown} เท่า ในงานเดียวกัน`;
    } else if (left.ms + 0.05 < right.ms) {
      verdict = "รอบนี้ X52 เร็วกว่า — ลองตัวอย่างที่วนลูปยาวขึ้น";
    } else {
      verdict = "เวลาใกล้กันมาก ลองตัวอย่างที่หนักกว่า";
    }
    if (left.output !== right.output) verdict = "ผลลัพธ์ไม่ตรงกัน ตรวจโค้ดทั้งสองฝั่ง";
  } else if (left && right) {
    verdict = "มีฝั่งที่รันไม่ผ่าน อ่านข้อความสีทองใต้ช่องนั้น";
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={run}
            disabled={busy}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-moss px-4 text-sm font-semibold text-moss-ink disabled:opacity-60"
          >
            <Play className="size-4" aria-hidden="true" />
            {busy ? "กำลังรัน" : "รันทั้งคู่"}
          </button>
          <p className="text-sm text-muted">แถบสั้นกว่าคือเร็วกว่า · วัดเฉพาะเวลารัน</p>
        </div>
        <p className="font-mono text-sm text-brass">{verdict}</p>
        {left && right && bothOk ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            <Meter label="X52 อ่านทีละคำสั่ง" ms={left.ms} max={max} tone="moss" />
            <Meter label="X52+ รันตรง" ms={right.ms} max={max} tone="brass" />
          </div>
        ) : null}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Editor title="X52" badge="อ่านง่าย" tone="moss" value={x52} onChange={onX52} label="โค้ด X52" />
        <Editor title="X52+" badge="อัดแน่น" tone="brass" value={x52p} onChange={onX52p} label="โค้ด X52+" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Output title="ผล X52" run={left} />
        <Output title="ผล X52+" run={right} />
      </div>

      <details className="rounded-lg border border-line bg-surface px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium text-fg">เทียบสัญลักษณ์ X52 กับ X52+</summary>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {MAP_ROWS.map((row) => (
            <div key={row.means} className="rounded-lg border border-line bg-bg px-3 py-2">
              <p className="text-xs text-muted">{row.means}</p>
              <p className="mt-1 truncate font-mono text-xs text-moss">{row.easy}</p>
              <p className="truncate font-mono text-xs text-brass">{row.fast}</p>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

function Editor({
  title,
  badge,
  tone,
  value,
  onChange,
  label,
}: {
  title: string;
  badge: string;
  tone: "moss" | "brass";
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-2 rounded-lg border border-line bg-surface p-3">
      <header className="flex items-center justify-between gap-2 px-1">
        <h2 className={`font-mono text-sm font-semibold ${tone === "moss" ? "text-moss" : "text-brass"}`}>{title}</h2>
        <span className="text-xs text-muted">{badge}</span>
      </header>
      <textarea
        aria-label={label}
        spellCheck={false}
        suppressHydrationWarning
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`min-h-56 w-full resize-y rounded-lg border border-line bg-bg p-3 font-mono text-sm leading-relaxed text-fg outline-none ${tone === "moss" ? "focus:border-moss" : "focus:border-brass"}`}
      />
    </section>
  );
}

function Output({ title, run }: { title: string; run: Exec | null }) {
  return (
    <div className="min-w-0 rounded-lg border border-line bg-bg p-3">
      <p className="text-xs text-muted">{title}</p>
      <pre className="mt-2 max-h-28 overflow-auto font-mono text-sm whitespace-pre-wrap text-fg">
        {run ? run.output || (run.ok ? "(ไม่มีอะไรพิมพ์)" : "") : "ยังไม่รัน"}
      </pre>
      {run?.error ? <p className="mt-2 text-sm text-brass">{run.error}</p> : null}
    </div>
  );
}

export function applyPreset(id: string): { x52: string; x52p: string } | null {
  const found = PRESETS.find((p) => p.id === id);
  if (!found) return null;
  return { x52: found.x52, x52p: found.x52p };
}

export { PRESETS };
