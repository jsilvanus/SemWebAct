import { BrowserWorkerApi } from "./executor/worker.js";
import { createBrowserWorkerHttpServer } from "./http/api-server.js";
import { PlaywrightBrowserRuntime } from "./playwright/browser-runtime.js";

const runtime = new PlaywrightBrowserRuntime();
const api = new BrowserWorkerApi(runtime);
const { server } = createBrowserWorkerHttpServer(api);

const port = Number(process.env.BROWSER_WORKER_PORT ?? 3800);
server.listen(port, "0.0.0.0", () => {
  console.log(`semwebact-browser worker listening on ${port}`);
});
