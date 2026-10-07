export interface CreateSessionRequest {
  site: string;
  allowedDomains: string[];
}

export interface CreateSessionResponse {
  sessionId: string;
  site: string;
}

export interface NavigateRequest {
  sessionId: string;
  url: string;
}

export interface ScreenshotRequest {
  sessionId: string;
  fullPage?: boolean;
}

export interface ScreenshotResponse {
  contentType: "image/png";
  dataBase64: string;
}

export interface BrowserRuntime {
  createSession(site: string, allowedDomains: string[]): Promise<{ sessionId: string; site: string }>;
  destroySession(sessionId: string): Promise<void>;
  navigate(sessionId: string, url: string): Promise<{ url: string }>;
  screenshot(sessionId: string, fullPage?: boolean): Promise<Buffer>;
}

export class BrowserWorkerApi {
  constructor(private readonly runtime: BrowserRuntime) {}

  async createSession(request: CreateSessionRequest): Promise<CreateSessionResponse> {
    if (!request.site) {
      throw new Error("site is required");
    }
    if (!request.allowedDomains.length) {
      throw new Error("allowedDomains must not be empty");
    }

    return this.runtime.createSession(request.site, request.allowedDomains);
  }

  async destroySession(sessionId: string): Promise<void> {
    await this.runtime.destroySession(sessionId);
  }

  async navigate(request: NavigateRequest): Promise<{ url: string }> {
    return this.runtime.navigate(request.sessionId, request.url);
  }

  async screenshot(request: ScreenshotRequest): Promise<ScreenshotResponse> {
    const buffer = await this.runtime.screenshot(request.sessionId, request.fullPage);
    return {
      contentType: "image/png",
      dataBase64: buffer.toString("base64"),
    };
  }
}
