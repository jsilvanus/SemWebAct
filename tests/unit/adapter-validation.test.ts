import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { validateAdapter } from "../../packages/adapter-schema/src/validate.js";

const adapterFile = readFileSync("/home/runner/work/SemWebAct/SemWebAct/adapters/example/adapter.yaml", "utf8");

test("example adapter validates", () => {
  const parsed = parse(adapterFile);
  const adapter = validateAdapter(parsed);
  assert.equal(adapter.id, "example.search");
});

test("invalid adapter is rejected", () => {
  assert.throws(() => validateAdapter({ id: "bad" }), /validation failed/i);
});
