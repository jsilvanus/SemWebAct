import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "yaml";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { AdapterExecutor } from "../../packages/adapter-runtime/src/executor.js";
import type { BrowserDriver, LocatedElement } from "../../packages/adapter-runtime/src/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const adapter = parse(readFileSync(join(__dirname, "../../adapters/example/adapter.yaml"), "utf8"));

class FakeDriver implements BrowserDriver {
  private url = "https://example.com";

  async getCurrentUrl(): Promise<string> {
    return this.url;
  }

  async navigate(url: string): Promise<void> {
    this.url = url;
  }

  async find(): Promise<LocatedElement> {
    return { id: "e1" };
  }

  async click(): Promise<void> {}

  async fill(_element: LocatedElement, value: string): Promise<void> {
    assert.equal(value, "hello");
  }

  async press(key: string): Promise<void> {
    assert.equal(key, "Enter");
  }

  async waitForElement(): Promise<void> {}

  async extract(): Promise<unknown> {
    return [{ name: "result" }];
  }
}

test("executor runs supported semantic steps", async () => {
  const result = await new AdapterExecutor(adapter, new FakeDriver()).execute("search", { query: "hello" });
  assert.deepEqual(result.results, [{ name: "result" }]);
});

test("executor blocks navigation outside adapter domains", async () => {
  const cloned = structuredClone(adapter);
  cloned.actions.search.steps[0].navigate.url = "https://evil.example.net";

  await assert.rejects(
    () => new AdapterExecutor(cloned, new FakeDriver()).execute("search", { query: "hello" }),
    /domain policy/,
  );
});

test("executor enforces required input fields", async () => {
  await assert.rejects(
    () => new AdapterExecutor(adapter, new FakeDriver()).execute("search", {}),
    /Missing required action input: query/,
  );
});
