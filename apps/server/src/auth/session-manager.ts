export interface AuthSession {
  id: string;
  site: string;
  mode: "session-only";
  createdAt: string;
}

export class SessionManager {
  private readonly sessions = new Map<string, AuthSession>();

  create(site: string): AuthSession {
    const session: AuthSession = {
      id: crypto.randomUUID(),
      site,
      mode: "session-only",
      createdAt: new Date().toISOString(),
    };
    this.sessions.set(session.id, session);
    return session;
  }

  destroy(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  list(): AuthSession[] {
    return [...this.sessions.values()];
  }
}
