import { SessionManager, type AuthSession } from "./session-manager.js";

export interface BrowserWorkerSessionClient {
  createSession(site: string, allowedDomains: string[]): Promise<{ sessionId: string; site: string }>;
  destroySession(sessionId: string): Promise<{ ok: boolean }>;
}

export interface CreateAuthSessionRequest {
  site: string;
  allowedDomains: string[];
}

export class SessionAuthService {
  constructor(
    private readonly sessions: SessionManager,
    private readonly browserWorker: BrowserWorkerSessionClient,
  ) {}

  async createSession(request: CreateAuthSessionRequest): Promise<AuthSession> {
    const browserSession = await this.browserWorker.createSession(request.site, request.allowedDomains);
    return this.sessions.create(request.site, browserSession.sessionId);
  }

  markAuthenticated(sessionId: string): AuthSession {
    return this.sessions.markAuthenticated(sessionId);
  }

  revoke(sessionId: string): AuthSession {
    return this.sessions.revoke(sessionId);
  }

  getStatus(sessionId: string): AuthSession | undefined {
    return this.sessions.get(sessionId);
  }

  async destroy(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }
    await this.browserWorker.destroySession(session.browserSessionId);
    this.sessions.destroy(sessionId);
  }
}
