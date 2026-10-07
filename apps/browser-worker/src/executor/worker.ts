import { ContextPool } from "../sessions/context-pool.js";

export class BrowserWorkerApi {
  private readonly contexts = new ContextPool();

  createSession(site: string): { sessionId: string } {
    const context = this.contexts.create(site);
    return { sessionId: context.id };
  }

  destroySession(sessionId: string): void {
    this.contexts.destroy(sessionId);
  }
}
