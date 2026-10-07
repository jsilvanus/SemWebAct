import test from "node:test";
import assert from "node:assert/strict";
import { BrowserWorkerApi, type BrowserRuntime } from "../../apps/browser-worker/src/executor/worker.js";
import { createBrowserWorkerHttpServer } from "../../apps/browser-worker/src/http/api-server.js";

class FakeRuntime implements BrowserRuntime {
  private readonly sessions = new Set<string>();

  async createSession(site: string, _allowedDomains: string[]): Promise<{ sessionId: string; site: string }> {
    const id = `http-${site}`;
    this.sessions.add(id);
    return { sessionId: id, site };
  }

  async destroySession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async navigate(sessionId: string, url: string): Promise<{ url: string }> {
    if (!this.sessions.has(sessionId)) throw new Error("missing session");
    return { url };
  }

  async screenshot(sessionId: string): Promise<Buffer> {
    if (!this.sessions.has(sessionId)) throw new Error("missing session");
    return Buffer.from("image");
  }
}

test("browser-worker http API serves session and action routes", async () => {
  const api = new BrowserWorkerApi(new FakeRuntime());
  const wrapper = createBrowserWorkerHttpServer(api);

  await new Promise<void>((resolve) => wrapper.server.listen(0, "127.0.0.1", () => resolve()));
  const address = wrapper.server.address();
  assert.ok(address && typeof address === "object");
  const base = `http://127.0.0.1:${address.port}`;

  const health = await fetch(`${base}/health`);
  assert.equal(health.status, 200);

  const createdResponse = await fetch(`${base}/sessions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ site: "example", allowedDomains: ["example.com"] }),
  });
  assert.equal(createdResponse.status, 201);
  const created = (await createdResponse.json()) as { sessionId: string };

  const nav = await fetch(`${base}/sessions/${created.sessionId}/navigate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url: "https://example.com" }),
  });
  assert.equal(nav.status, 200);

  const screenshot = await fetch(`${base}/sessions/${created.sessionId}/screenshot`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fullPage: true }),
  });
  const shot = (await screenshot.json()) as { contentType: string };
  assert.equal(shot.contentType, "image/png");

  const destroy = await fetch(`${base}/sessions/${created.sessionId}`, { method: "DELETE" });
  assert.equal(destroy.status, 200);

  await wrapper.close();
});
