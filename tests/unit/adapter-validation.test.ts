import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { validateAdapter } from "../../packages/adapter-schema/src/validate.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const adapterFile = readFileSync(join(__dirname, "../../adapters/example/adapter.yaml"), "utf8");

test("example adapter validates", () => {
  const parsed = parse(adapterFile);
  const adapter = validateAdapter(parsed);
  assert.equal(adapter.id, "example.search");
});

test("invalid adapter is rejected", () => {
  assert.throws(() => validateAdapter({ id: "bad" }), /validation failed/i);
});
