import assert from "node:assert/strict";
import { execute, executeSources } from "./run";
import { PRESETS, TEMPLATE_X52, TEMPLATE_X52P } from "./samples";
import { parseWf, runWorkflow, type VFile } from "../workflow/engine";

function pair(id: string) {
  const p = PRESETS.find((x) => x.id === id);
  if (!p) throw new Error(id);
  const a = execute("x52", p.x52);
  const b = execute("x52p", p.x52p);
  assert.equal(a.ok, true, a.error);
  assert.equal(b.ok, true, b.error);
  assert.equal(a.output, b.output, `${id} outputs differ ${a.output} vs ${b.output}`);
  console.log(`${id} x52 ${a.ms.toFixed(1)}ms  x52+ ${b.ms.toFixed(1)}ms  out ${a.output}  ratio ${(a.ms / Math.max(b.ms, 0.01)).toFixed(1)}`);
}

pair("sum");
pair("mix");
pair("call");

const projA = executeSources(
  "x52",
  TEMPLATE_X52.map((f) => f.body),
);
const projB = executeSources(
  "x52p",
  TEMPLATE_X52P.map((f) => f.body),
);
assert.equal(projA.ok, true, projA.error);
assert.equal(projB.ok, true, projB.error);
assert.equal(projA.output, "100\n1640");
assert.equal(projB.output, projA.output);

const bad = execute("x52", "fn main() {\n  print(nope)\n}\n");
assert.equal(bad.ok, false);

const plusWord = execute("x52p", "fn main(){ print(1) }\n");
assert.equal(plusWord.ok, false);

let files: VFile[] = [];
const created = runWorkflow(files, parseWf("name: create\nconflict: rename\npath: src/main.x52\n", "create"));
assert.equal(created.ok, true);
assert.equal(created.files[0]?.body, "");
files = created.files;
const renamed = runWorkflow(files, parseWf("name: create\nconflict: rename\npath: src/main.x52\n", "create"));
assert.equal(renamed.ok, true);
assert.equal(renamed.actual, "src/main-2.x52");
assert.equal(renamed.files.find((f) => f.path === "src/main.x52")?.body, "");
files = renamed.files;
const overwritten = runWorkflow(files, parseWf("name: create\nconflict: overwrite\npath: src/main.x52\nbody: |\n  no\n", "create"));
assert.equal(overwritten.recovered, true);
assert.equal(overwritten.files.find((f) => f.path === "src/main.x52")?.body, "");
files = overwritten.files;
const wrote = runWorkflow(files, parseWf("name: write\nconflict: rename\npath: src/main.x52\nbody: |\n  fn main() {\n    print(52)\n  }\n", "write"));
assert.equal(wrote.ok, true);
assert.equal(wrote.actual, "src/main-3.x52");
assert.match(wrote.files.find((f) => f.path === "src/main-3.x52")?.body ?? "", /print\(52\)/);
assert.equal(wrote.files.find((f) => f.path === "src/main.x52")?.body, "");
const missing = runWorkflow(wrote.files, parseWf("name: write\nconflict: rename\npath: src/fresh.x52\nbody: hi\n", "write"));
assert.equal(missing.ok, false);
assert.equal(missing.recovered, false);
const recovered = runWorkflow(wrote.files, parseWf("name: write\nconflict: overwrite\npath: src/fresh.x52\nbody: hi\n", "write"));
assert.equal(recovered.recovered, true);
assert.equal(recovered.files.find((f) => f.path === "src/fresh.x52")?.body, "hi");

console.log("selfcheck ok");
