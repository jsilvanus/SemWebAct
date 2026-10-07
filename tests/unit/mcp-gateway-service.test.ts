import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "yaml";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { SemWebActRuntime } from "../../apps/server/src/mcp/semantic-runtime.js";
import { McpGatewayService } from "../../apps/server/src/mcp/gateway-service.js";
import type { BrowserDriver, LocatedElement } from "../../packages/adapter-runtime/src/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const adapter = parse(readFileSync(join(__dirname, "../../adapters/example/adapter.yaml"), "utf8"));

class FakeDriver implements BrowserDriver {
  private url = "https://example.com";
  async getCurrentUrl(): Promise<string> { return this.url; }
  async navigate(url: string): Promise<void> { this.url = url; }
  async find(): Promise<LocatedElement> { return { id: "id1" }; }
  async click(): Promise<void> {}
  async fill(): Promise<void> {}
  async press(): Promise<void> {}
  async waitForElement(): Promise<void> {}
  async extract(): Promise<unknown> { return [{ name: "ok" }]; }
}

test("mcp gateway service dynamically refreshes and invokes semantic tools", async () => {
  const runtime = new SemWebActRuntime(adapter, new FakeDriver());
  const gateway = new McpGatewayService(runtime);

  const tools = await gateway.refresh();
  assert.equal(tools.some((tool) => tool.name === "example.search"), true);

  const result = await gateway.invoke("example.search", { query: "hello" });
  assert.equal(result.actionId, "example.search");
  assert.equal(result.source, "adapter");
});
