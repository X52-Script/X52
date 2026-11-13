import { FilePenLine, FilePlus2 } from "lucide-react";
import { parseWf, runWorkflow, setConflict, type Conflict, type VFile, type WfName } from "@/lib/workflow/engine";

type Props = {
  createYml: string;
  writeYml: string;
  files: VFile[];
  log: string[];
  onCreate: (v: string) => void;
  onWrite: (v: string) => void;
  onFiles: (files: VFile[]) => void;
  onLog: (line: string) => void;
};

const NOTE: Record<VFile["note"], string> = {
  created: "สร้างใหม่",
  renamed: "ชื่อใหม่",
  overwrote: "วางทับ",
};

export function WorkflowPanel(props: Props) {
  return (
    <div className="flex flex-col gap-4">
      <p className="max-w-3xl text-sm leading-relaxed text-muted">
        ทุกไฟล์ในแล็บนี้เกิดจากสองเวิร์กโฟลว์เท่านั้น create.yml สร้างไฟล์เปล่าโดยไม่เขียนเนื้อหา ส่วน write.yml เขียนเนื้อหาโดยไม่สร้างไฟล์ให้
        ถ้ารันแล้วไม่ error ระบบจะไม่วางทับ และตั้งชื่อใหม่แทน ถ้าเป็น error ระบบจะวางทับไฟล์นั้นให้เลย จะได้ไม่ต้องไปหาเอง
      </p>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card
          title="create.yml"
          blurb="Create file without write"
          icon="create"
          yml={props.createYml}
          onYml={props.onCreate}
          expect="create"
          files={props.files}
          onFiles={props.onFiles}
          onLog={props.onLog}
        />
        <Card
          title="write.yml"
          blurb="Write without create"
          icon="write"
          yml={props.writeYml}
          onYml={props.onWrite}
          expect="write"
          files={props.files}
          onFiles={props.onFiles}
          onLog={props.onLog}
        />
      </div>
      <section className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <FileList files={props.files} onFiles={props.onFiles} />
        <div className="rounded-lg border border-line bg-surface p-3">
          <h3 className="text-sm font-semibold text-fg">บันทึกล่าสุด</h3>
          <ul className="mt-2 flex max-h-64 flex-col gap-2 overflow-auto">
            {props.log.length === 0 ? <li className="text-sm text-muted">ยังไม่รัน</li> : null}
            {props.log.map((line, i) => (
              <li key={`${i}-${line.slice(0, 12)}`} className="text-sm leading-relaxed text-fg">
                {line}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function Card({
  title,
  blurb,
  icon,
  yml,
  onYml,
  expect,
  files,
  onFiles,
  onLog,
}: {
  title: string;
  blurb: string;
  icon: WfName;
  yml: string;
  onYml: (v: string) => void;
  expect: WfName;
  files: VFile[];
  onFiles: (files: VFile[]) => void;
  onLog: (line: string) => void;
}) {
  function go(conflict: Conflict) {
    const next = setConflict(yml, conflict);
    onYml(next);
    try {
      const doc = parseWf(next, expect);
      const result = runWorkflow(files, doc);
      onFiles(result.files);
      onLog(result.message);
    } catch (err) {
      onLog(err instanceof Error ? err.message : "อ่านเวิร์กโฟลว์ไม่ผ่าน");
    }
  }

  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-lg border border-line bg-surface p-3">
      <header className="flex items-start justify-between gap-3 px-1">
        <div>
          <h2 className="flex items-center gap-2 font-mono text-sm font-semibold text-fg">
            {icon === "create" ? <FilePlus2 className="size-4 text-moss" aria-hidden="true" /> : <FilePenLine className="size-4 text-brass" aria-hidden="true" />}
            {title}
          </h2>
          <p className="mt-1 text-xs text-muted">{blurb}</p>
        </div>
      </header>
      <textarea
        aria-label={title}
        spellCheck={false}
        suppressHydrationWarning
        value={yml}
        onChange={(e) => onYml(e.target.value)}
        className="min-h-64 w-full resize-y rounded-lg border border-line bg-bg p-3 font-mono text-xs leading-relaxed text-fg outline-none focus:border-moss"
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => go("rename")}
          className="inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-moss px-3 text-sm font-semibold text-moss-ink"
        >
          รันแบบไม่ error
        </button>
        <button
          type="button"
          onClick={() => go("overwrite")}
          className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-brass px-3 text-sm font-semibold text-brass"
        >
          รันแบบ error แล้ววางทับ
        </button>
      </div>
    </section>
  );
}

function FileList({ files, onFiles }: { files: VFile[]; onFiles: (files: VFile[]) => void }) {
  return (
    <section className="rounded-lg border border-line bg-surface p-3">
      <div className="flex items-center justify-between gap-2 px-1">
        <h3 className="text-sm font-semibold text-fg">ไฟล์ที่ได้จากเวิร์กโฟลว์</h3>
        <button
          type="button"
          onClick={() => onFiles([])}
          className="h-11 rounded-lg border border-line px-3 text-sm text-muted"
        >
          ล้างแฟ้ม
        </button>
      </div>
      {files.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-line px-3 py-6 text-sm text-muted">
          ยังไม่มีไฟล์ รัน create.yml เพื่อสร้างไฟล์เปล่า แล้วค่อย write.yml
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {files.map((f) => (
            <li key={f.path} className="rounded-lg border border-line bg-bg p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-sm text-fg">{f.path}</p>
                <span className={`rounded-full px-2 py-1 font-mono text-xs ${f.note === "overwrote" ? "bg-brass text-brass-ink" : "bg-surface-2 text-moss"}`}>
                  {NOTE[f.note]}
                </span>
              </div>
              <pre className="mt-2 max-h-24 overflow-auto font-mono text-xs whitespace-pre-wrap text-muted">
                {f.body.length ? f.body : "(ว่าง — create ไม่ได้เขียนเนื้อหา)"}
              </pre>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
