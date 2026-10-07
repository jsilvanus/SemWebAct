import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "yaml";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { SemWebActRuntime } from "../../apps/server/src/mcp/semantic-runtime.js";
import type { BrowserDriver, LocatedElement } from "../../packages/adapter-runtime/src/types.js";
import type { WebMcpRuntime } from "../../packages/webmcp/src/runtime.js";

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
    return { id: "loc-1" };
  }

  async click(): Promise<void> {}
  async fill(): Promise<void> {}
  async press(): Promise<void> {}
  async waitForElement(): Promise<void> {}

  async extract(): Promise<unknown> {
    return [{ name: "demo" }];
  }
}

class FakeWebMcpRuntime implements WebMcpRuntime {
  public readonly invoked: Array<{ toolId: string; input: Record<string, unknown> }> = [];

  constructor(private readonly tools: Array<{ id: string; description: string }>) {}

  async discoverTools() {
    return this.tools.map((tool) => ({
      ...tool,
      inputSchema: { type: "object" },
      outputSchema: { type: "array" },
    }));
  }

  async invoke(toolId: string, input: Record<string, unknown>) {
    this.invoked.push({ toolId, input });
    return { actionId: toolId, source: "webmcp" as const, data: [{ native: true }] };
  }
}

test("semwebact runtime demonstrates MCP -> semantic action -> adapter execution", async () => {
  const runtime = new SemWebActRuntime(adapter, new FakeDriver());
  const actions = await runtime.refreshActions();
  assert.equal(actions.some((a) => a.id === "example.search"), true);

  const tools = runtime.mcpTools();
  assert.equal(tools.some((tool) => tool.name === "example.search"), true);

  const result = await runtime.invoke("example.search", { query: "test" });
  assert.equal(result.source, "adapter");
  assert.deepEqual(result.data, { results: [{ name: "demo" }] });
});

test("semwebact runtime prefers WebMCP over adapter unless forced", async () => {
  const webMcp = new FakeWebMcpRuntime([{ id: "example.search", description: "Native search" }]);
  const runtime = new SemWebActRuntime(adapter, new FakeDriver(), webMcp);

  await runtime.refreshActions();
  const preferred = await runtime.invoke("example.search", { query: "hello" });
  assert.equal(preferred.source, "webmcp");

  await runtime.refreshActions({ forceAdapter: true });
  const forced = await runtime.invoke("example.search", { query: "hello" });
  assert.equal(forced.source, "adapter");
  assert.equal(webMcp.invoked.length, 1);
});
