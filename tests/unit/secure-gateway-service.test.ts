import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "yaml";
import { readFileSync } from "node:fs";
import type { BrowserDriver, LocatedElement } from "../../packages/adapter-runtime/src/types.js";
import { SemWebActRuntime } from "../../apps/server/src/mcp/semantic-runtime.js";
import { McpGatewayService } from "../../apps/server/src/mcp/gateway-service.js";
import { SecureMcpGatewayService } from "../../apps/server/src/mcp/secure-gateway-service.js";
import { ActionAuthorization, ApprovalStore } from "../../apps/server/src/security/policy.js";
import { ActivityLog } from "../../apps/server/src/sessions/activity-log.js";

const adapter = parse(readFileSync("/home/runner/work/SemWebAct/SemWebAct/adapters/example/adapter.yaml", "utf8"));
adapter.risk = "write";
adapter.approval = "required";

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

test("secure gateway enforces approval and writes audit logs", async () => {
  const runtime = new SemWebActRuntime(adapter, new FakeDriver());
  await runtime.refreshActions();
  const gateway = new McpGatewayService(runtime);
  const log = new ActivityLog();
  const authz = new ActionAuthorization(new ApprovalStore());
  const secure = new SecureMcpGatewayService(runtime, gateway, authz, log);

  await assert.rejects(
    () => secure.invoke({ actorId: "u1", capabilities: ["WRITE"] }, "example.search", { query: "hello" }),
    /Approval required/,
  );

  const token = secure.requestApproval("u1", "example.search", 1000);
  const result = await secure.invoke(
    { actorId: "u1", capabilities: ["WRITE"], approvalToken: token },
    "example.search",
    { query: "hello" },
  );

  assert.equal(result.source, "adapter");
  assert.equal(log.all().length, 2);
  assert.equal(log.all()[0]?.result, "error");
  assert.equal(log.all()[1]?.result, "ok");
});
