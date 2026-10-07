export interface BrowserWorkerClientOptions {
  baseUrl: string;
  apiKey?: string;
}

export class BrowserWorkerClient {
  constructor(private readonly options: BrowserWorkerClientOptions) {}

  async createSession(site: string, allowedDomains: string[]): Promise<{ sessionId: string; site: string }> {
    return this.request("/sessions", "POST", { site, allowedDomains });
  }

  async destroySession(sessionId: string): Promise<{ ok: boolean }> {
    return this.request(`/sessions/${sessionId}`, "DELETE");
  }

  async navigate(sessionId: string, url: string): Promise<{ url: string }> {
    return this.request(`/sessions/${sessionId}/navigate`, "POST", { url });
  }

  async screenshot(sessionId: string, fullPage?: boolean): Promise<{ contentType: string; dataBase64: string }> {
    return this.request(`/sessions/${sessionId}/screenshot`, "POST", { fullPage });
  }

  private async request<T>(path: string, method: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.options.baseUrl}${path}`, {
      method,
      headers: {
        "content-type": "application/json",
        ...(this.options.apiKey ? { "x-api-key": this.options.apiKey } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const payload = (await response.json()) as T & { error?: string };
    if (!response.ok) {
      throw new Error(payload.error ?? `browser-worker request failed (${response.status})`);
    }

    return payload;
  }
}
