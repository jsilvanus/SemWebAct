export interface AuthSession {
  id: string;
  site: string;
  browserSessionId: string;
  mode: "session-only";
  authenticated: boolean;
  createdAt: string;
  authenticatedAt?: string;
}

export class SessionManager {
  private readonly sessions = new Map<string, AuthSession>();

  create(site: string, browserSessionId: string): AuthSession {
    const session: AuthSession = {
      id: crypto.randomUUID(),
      site,
      browserSessionId,
      mode: "session-only",
      authenticated: false,
      createdAt: new Date().toISOString(),
    };
    this.sessions.set(session.id, session);
    return session;
  }

  markAuthenticated(sessionId: string): AuthSession {
    const session = this.require(sessionId);
    const updated: AuthSession = {
      ...session,
      authenticated: true,
      authenticatedAt: new Date().toISOString(),
    };
    this.sessions.set(sessionId, updated);
    return updated;
  }

  revoke(sessionId: string): AuthSession {
    const session = this.require(sessionId);
    const updated: AuthSession = {
      ...session,
      authenticated: false,
      authenticatedAt: undefined,
    };
    this.sessions.set(sessionId, updated);
    return updated;
  }

  get(sessionId: string): AuthSession | undefined {
    return this.sessions.get(sessionId);
  }

  destroy(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  list(): AuthSession[] {
    return [...this.sessions.values()];
  }

  private require(sessionId: string): AuthSession {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Unknown auth session: ${sessionId}`);
    }
    return session;
  }
}
