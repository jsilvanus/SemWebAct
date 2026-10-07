import test from "node:test";
import assert from "node:assert/strict";
import { SessionManager } from "../../apps/server/src/auth/session-manager.js";
import { SessionAuthService, type BrowserWorkerSessionClient } from "../../apps/server/src/auth/session-auth-service.js";

class FakeBrowserWorkerClient implements BrowserWorkerSessionClient {
  public readonly destroyed: string[] = [];

  async createSession(site: string): Promise<{ sessionId: string; site: string }> {
    return { sessionId: `browser-${site}`, site };
  }

  async destroySession(sessionId: string): Promise<{ ok: boolean }> {
    this.destroyed.push(sessionId);
    return { ok: true };
  }
}

test("session auth service manages session-only authentication lifecycle", async () => {
  const sessions = new SessionManager();
  const browserWorker = new FakeBrowserWorkerClient();
  const service = new SessionAuthService(sessions, browserWorker);

  const session = await service.createSession({ site: "github.com", allowedDomains: ["github.com"] });
  assert.equal(session.mode, "session-only");
  assert.equal(session.authenticated, false);
  assert.equal(session.browserSessionId, "browser-github.com");

  const authenticated = service.markAuthenticated(session.id);
  assert.equal(authenticated.authenticated, true);

  const revoked = service.revoke(session.id);
  assert.equal(revoked.authenticated, false);

  await service.destroy(session.id);
  assert.deepEqual(browserWorker.destroyed, ["browser-github.com"]);
  assert.equal(service.getStatus(session.id), undefined);
});
