import test from "node:test";
import assert from "node:assert/strict";
import { BrowserWorkerApi, type BrowserRuntime } from "../../apps/browser-worker/src/executor/worker.js";

class FakeRuntime implements BrowserRuntime {
  public readonly sessions = new Set<string>();

  async createSession(site: string, _allowedDomains: string[]): Promise<{ sessionId: string; site: string }> {
    const id = `s-${site}`;
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
    return Buffer.from("png");
  }
}

test("browser worker api handles session lifecycle and operations", async () => {
  const runtime = new FakeRuntime();
  const api = new BrowserWorkerApi(runtime);

  const created = await api.createSession({ site: "example", allowedDomains: ["example.com"] });
  assert.equal(created.sessionId, "s-example");

  const nav = await api.navigate({ sessionId: created.sessionId, url: "https://example.com" });
  assert.equal(nav.url, "https://example.com");

  const screenshot = await api.screenshot({ sessionId: created.sessionId, fullPage: true });
  assert.equal(screenshot.contentType, "image/png");
  assert.equal(screenshot.dataBase64, Buffer.from("png").toString("base64"));

  await api.destroySession(created.sessionId);
  await assert.rejects(() => api.navigate({ sessionId: created.sessionId, url: "https://example.com" }));
});

test("browser worker api validates create session request", async () => {
  const api = new BrowserWorkerApi(new FakeRuntime());
  await assert.rejects(() => api.createSession({ site: "", allowedDomains: ["example.com"] }), /site is required/);
  await assert.rejects(() => api.createSession({ site: "example", allowedDomains: [] }), /allowedDomains/);
});
