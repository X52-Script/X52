import { useEffect, useState } from "react";
import { PRESETS, TEMPLATE_X52, TEMPLATE_X52P, type ProjFile } from "@/lib/lang/samples";
import { WORKFLOWS, type VFile } from "@/lib/workflow/engine";
import { ProjectPanel } from "@/components/project-panel";
import { PRESETS as RACE_PRESETS, RacePanel } from "@/components/race-panel";
import { WorkflowPanel } from "@/components/workflow-panel";

type Tab = "race" | "x52" | "x52p" | "flow";

const STORE = "x52-lab-v1";

const TABS: { id: Tab; label: string }[] = [
  { id: "race", label: "เทียบความเร็ว" },
  { id: "x52", label: "โปรเจค X52" },
  { id: "x52p", label: "โปรเจค X52+" },
  { id: "flow", label: "Workflows" },
];

export function Studio() {
  const [tab, setTab] = useState<Tab>("race");
  const [preset, setPreset] = useState(PRESETS[0]!.id);
  const [x52, setX52] = useState(PRESETS[0]!.x52);
  const [x52p, setX52p] = useState(PRESETS[0]!.x52p);
  const [proj52, setProj52] = useState<ProjFile[]>(TEMPLATE_X52);
  const [projP, setProjP] = useState<ProjFile[]>(TEMPLATE_X52P);
  const [createYml, setCreateYml] = useState(WORKFLOWS.create);
  const [writeYml, setWriteYml] = useState(WORKFLOWS.write);
  const [files, setFiles] = useState<VFile[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) {
        const data = JSON.parse(raw) as Partial<{
          tab: Tab;
          preset: string;
          x52: string;
          x52p: string;
          proj52: ProjFile[];
          projP: ProjFile[];
          createYml: string;
          writeYml: string;
          files: VFile[];
          log: string[];
        }>;
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
    } catch {
      /* keep defaults */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(
      STORE,
      JSON.stringify({ tab, preset, x52, x52p, proj52, projP, createYml, writeYml, files, log: log.slice(0, 12) }),
    );
  }, [ready, tab, preset, x52, x52p, proj52, projP, createYml, writeYml, files, log]);

  function pickPreset(id: string) {
    const found = PRESETS.find((p) => p.id === id);
    if (!found) return;
    setPreset(id);
    setX52(found.x52);
    setX52p(found.x52p);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6">
      <header className="flex flex-col gap-4 border-b border-line pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-xs tracking-widest text-brass">X52 / X52+</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-fg">ห้องแล็บสองภาษา</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              เป้าของโปรเจคคือภาษาที่เร็วที่สุด X52 กับ X52+ แยกกัน แต่ใช้เทมเพลตเดียวกัน X52 อ่านง่ายกว่า แลกกับความเร็ว
              X52+ พิมพ์สั้น แหล่งโค้ดสแกนยาก และในสนามนี้เร็วกว่าแบบจับเวลาจริง
            </p>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-muted">สร้างไฟล์ด้วย create.yml เขียนเนื้อหาด้วย write.yml</p>
        </div>
        <div role="tablist" aria-label="ส่วนของแล็บ" className="flex flex-wrap gap-2">
          {TABS.map((item) => {
            const on = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setTab(item.id)}
                className={`h-11 rounded-lg px-3 text-sm font-medium ${on ? "bg-moss text-moss-ink" : "border border-line bg-surface text-fg"}`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      {tab === "race" ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {RACE_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => pickPreset(p.id)}
                className={`h-11 rounded-lg border px-3 text-sm ${preset === p.id ? "border-brass bg-surface-2 text-brass" : "border-line bg-surface text-fg"}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <RacePanel x52={x52} x52p={x52p} onX52={setX52} onX52p={setX52p} />
        </div>
      ) : null}

      {tab === "x52" ? <ProjectPanel dialect="x52" files={proj52} onChange={setProj52} /> : null}
      {tab === "x52p" ? <ProjectPanel dialect="x52p" files={projP} onChange={setProjP} /> : null}
      {tab === "flow" ? (
        <WorkflowPanel
          createYml={createYml}
          writeYml={writeYml}
          files={files}
          log={log}
          onCreate={setCreateYml}
          onWrite={setWriteYml}
          onFiles={setFiles}
          onLog={(line) => setLog((prev) => [line, ...prev].slice(0, 12))}
        />
      ) : null}
    </main>
  );
}
