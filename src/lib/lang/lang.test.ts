import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { execute } from "./run.ts";
import { freshName, parseWf, runWorkflow } from "../workflow/engine.ts";

const boomX52 = `fn boom() {\n  boom()\n}\nfn main() {\n  boom()\n}\n`;
const boomPlus = `$boom(){boom()}\n$main(){boom()}\n`;

describe("x52 runtime", () => {
  it("stops unbounded recursion in both dialects", () => {
    const vm = execute("x52", boomX52, 50);
    const jit = execute("x52p", boomPlus, 50);
    assert.equal(vm.ok, false);
    assert.equal(jit.ok, false);
    assert.match(vm.error ?? "", /งบ/);
    assert.match(jit.error ?? "", /งบ/);
  });

  it("rejects main with parameters in both dialects", () => {
    const vm = execute("x52", "fn main(x) {\n  print(x)\n}\n");
    const jit = execute("x52p", "$main(x){!x}\n");
    assert.equal(vm.ok, false);
    assert.equal(jit.ok, false);
    assert.match(vm.error ?? "", /main/);
    assert.match(jit.error ?? "", /main/);
  });

  it("runs top-level statements and then main", () => {
    const vm = execute("x52", "print(1)\nfn main() {\n  print(2)\n}\n");
    const jit = execute("x52p", "!1\n$main(){!2}\n");
    assert.equal(vm.ok, true, vm.error);
    assert.equal(jit.ok, true, jit.error);
    assert.equal(vm.output, "1\n2");
    assert.equal(jit.output, "1\n2");
  });

  it("does not call main twice when top-level already calls it", () => {
    const vm = execute("x52", "fn main() {\n  print(2)\n}\nmain()\n");
    assert.equal(vm.output, "2");
  });

  it("still runs main when the only call sits in a false branch", () => {
    const vm = execute("x52", "if 0 {\n  main()\n}\nfn main() {\n  print(99)\n}\n");
    const jit = execute("x52p", "?0{main()}\n$main(){!99}\n");
    assert.equal(vm.ok, true, vm.error);
    assert.equal(jit.ok, true, jit.error);
    assert.equal(vm.output, "99");
    assert.equal(jit.output, "99");
  });

  it("rejects division by zero in both dialects", () => {
    const vm = execute("x52", "fn main() {\n  print(1 / 0)\n}\n");
    const jit = execute("x52p", "$main(){!1/0}\n");
    const mod = execute("x52p", "$main(){!1%0}\n");
    assert.equal(vm.ok, false);
    assert.equal(jit.ok, false);
    assert.equal(mod.ok, false);
    assert.match(vm.error ?? "", /ศูนย์/);
    assert.match(jit.error ?? "", /ศูนย์/);
    assert.match(mod.error ?? "", /ศูนย์/);
  });
  it("keeps a small program matched across dialects", () => {
    const src52 = "fn add(a, b) {\n  return a + b\n}\nfn main() {\n  print(add(20, 22))\n}\n";
    const srcP = "$add(a,b){^a+b}\n$main(){!add(20,22)}\n";
    const vm = execute("x52", src52);
    const jit = execute("x52p", srcP);
    assert.equal(vm.ok, true, vm.error);
    assert.equal(jit.ok, true, jit.error);
    assert.equal(vm.output, "42");
    assert.equal(jit.output, "42");
  });
});

describe("workflow names", () => {
  it("does not fall back to a name that already exists", () => {
    const taken = new Set<string>(["a.txt"]);
    for (let i = 2; i < 1000; i += 1) taken.add(`a-${i}.txt`);
    assert.equal(
      freshName("a.txt", (path) => taken.has(path)),
      "a-1000.txt",
    );
    taken.add("a-1000.txt");
    assert.equal(
      freshName("a.txt", (path) => taken.has(path)),
      "a-1001.txt",
    );
    for (let i = 1001; i <= 100000; i += 1) taken.add(`a-${i}.txt`);
    assert.equal(
      freshName("a.txt", (path) => taken.has(path)),
      "a-100001.txt",
    );
  });

  it("does not let write create a missing file", () => {
    const doc = parseWf("name: write\nconflict: overwrite\npath: src/fresh.x52\nbody: hi\n", "write");
    const out = runWorkflow([], doc);
    assert.equal(out.ok, false);
    assert.equal(out.recovered, false);
    assert.equal(out.files.length, 0);
  });
});
