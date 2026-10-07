import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { BrowserWorkerApi } from "../executor/worker.js";

export interface BrowserWorkerHttpServer {
  server: Server;
  close(): Promise<void>;
}

async function readJsonBody<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {} as T;
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T;
}

function sendJson(res: ServerResponse, code: number, payload: unknown): void {
  res.statusCode = code;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(payload));
}

export function createBrowserWorkerHttpServer(api: BrowserWorkerApi): BrowserWorkerHttpServer {
  const server = createServer(async (req, res) => {
    try {
      const method = req.method ?? "GET";
      const path = req.url ?? "/";

      if (method === "GET" && path === "/health") {
        return sendJson(res, 200, { ok: true });
      }

      if (method === "POST" && path === "/sessions") {
        const body = await readJsonBody<{ site: string; allowedDomains: string[] }>(req);
        const session = await api.createSession(body);
        return sendJson(res, 201, session);
      }

      const navigateMatch = method === "POST" ? path.match(/^\/sessions\/([^/]+)\/navigate$/) : null;
      if (navigateMatch) {
        const body = await readJsonBody<{ url: string }>(req);
        const result = await api.navigate({ sessionId: navigateMatch[1] ?? "", url: body.url });
        return sendJson(res, 200, result);
      }

      const screenshotMatch = method === "POST" ? path.match(/^\/sessions\/([^/]+)\/screenshot$/) : null;
      if (screenshotMatch) {
        const body = await readJsonBody<{ fullPage?: boolean }>(req);
        const result = await api.screenshot({ sessionId: screenshotMatch[1] ?? "", fullPage: body.fullPage });
        return sendJson(res, 200, result);
      }

      const destroyMatch = method === "DELETE" ? path.match(/^\/sessions\/([^/]+)$/) : null;
      if (destroyMatch) {
        await api.destroySession(destroyMatch[1] ?? "");
        return sendJson(res, 200, { ok: true });
      }

      return sendJson(res, 404, { error: "not_found" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return sendJson(res, 400, { error: message });
    }
  });

  return {
    server,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      }),
  };
}
