import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { isAllowedOrigin } from "./domain-guard.js";

interface SessionState {
  id: string;
  site: string;
  allowedDomains: string[];
  context: BrowserContext;
  page: Page;
}

export class PlaywrightBrowserRuntime {
  private browser: Browser | undefined;
  private readonly sessions = new Map<string, SessionState>();

  async start(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true });
    }
  }

  async stop(): Promise<void> {
    for (const session of this.sessions.values()) {
      await session.context.close();
    }
    this.sessions.clear();
    await this.browser?.close();
    this.browser = undefined;
  }

  async createSession(site: string, allowedDomains: string[]): Promise<{ sessionId: string; site: string }> {
    await this.start();

    const context = await this.browser!.newContext();
    const page = await context.newPage();
    const sessionId = crypto.randomUUID();

    this.sessions.set(sessionId, {
      id: sessionId,
      site,
      allowedDomains,
      context,
      page,
    });

    return { sessionId, site };
  }

  async destroySession(sessionId: string): Promise<void> {
    const session = this.requireSession(sessionId);
    await session.context.close();
    this.sessions.delete(sessionId);
  }

  async navigate(sessionId: string, url: string): Promise<{ url: string }> {
    const session = this.requireSession(sessionId);
    this.assertAllowed(url, session.allowedDomains);

    await session.page.goto(url, { waitUntil: "domcontentloaded" });
    const currentUrl = session.page.url();
    this.assertAllowed(currentUrl, session.allowedDomains);

    return { url: currentUrl };
  }

  async screenshot(sessionId: string, fullPage?: boolean): Promise<Buffer> {
    const session = this.requireSession(sessionId);
    const bytes = await session.page.screenshot({ type: "png", fullPage: Boolean(fullPage) });
    return Buffer.from(bytes);
  }

  private requireSession(sessionId: string): SessionState {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Unknown browser session: ${sessionId}`);
    }
    return session;
  }

  private assertAllowed(url: string, domains: string[]): void {
    if (!isAllowedOrigin(url, domains)) {
      throw new Error(`Navigation blocked by domain policy: ${url}`);
    }
  }
}
