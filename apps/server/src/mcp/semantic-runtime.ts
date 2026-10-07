import { AdapterExecutor } from "../../../../packages/adapter-runtime/src/executor.js";
import { validateAdapter } from "../../../../packages/adapter-schema/src/validate.js";
import type { BrowserDriver } from "../../../../packages/adapter-runtime/src/types.js";
import type { SemanticAction, SemanticActionResult } from "../../../../packages/semantic-actions/src/model.js";
import { mapWebMcpToSemanticActions, chooseImplementationSource } from "../../../../packages/webmcp/src/bridge.js";
import type { WebMcpRuntime } from "../../../../packages/webmcp/src/runtime.js";
import { toMcpToolDescriptors, type McpToolDescriptor } from "./gateway.js";

interface BoundAction {
  action: SemanticAction;
  source: "webmcp" | "adapter";
  adapterActionName?: string;
}

export class SemWebActRuntime {
  private readonly adapterExecutor: AdapterExecutor;
  private readonly boundActions = new Map<string, BoundAction>();

  constructor(
    private readonly rawAdapter: unknown,
    private readonly browserDriver: BrowserDriver,
    private readonly webMcpRuntime?: WebMcpRuntime,
  ) {
    this.adapterExecutor = new AdapterExecutor(rawAdapter, browserDriver);
  }

  async refreshActions(options?: { forceAdapter?: boolean }): Promise<SemanticAction[]> {
    const adapter = validateAdapter(this.rawAdapter);
    const adapterActions = this.buildAdapterActions(adapter);
    const discoveredWebMcp = this.webMcpRuntime ? await this.webMcpRuntime.discoverTools() : [];
    const webMcpActions = mapWebMcpToSemanticActions(discoveredWebMcp);

    this.boundActions.clear();

    const allIds = new Set([...adapterActions.map((a) => a.id), ...webMcpActions.map((a) => a.id)]);
    for (const id of allIds) {
      const adapterAction = adapterActions.find((action) => action.id === id);
      const webMcpAction = webMcpActions.find((action) => action.id === id);

      const source = chooseImplementationSource({
        hasWebMcp: Boolean(webMcpAction),
        hasAdapter: Boolean(adapterAction),
        forceAdapter: options?.forceAdapter,
      });

      if (source === "webmcp" && webMcpAction) {
        this.boundActions.set(id, { action: webMcpAction, source: "webmcp" });
      } else if (source === "adapter" && adapterAction) {
        this.boundActions.set(id, {
          action: adapterAction,
          source: "adapter",
          adapterActionName: this.adapterActionNameFromId(adapter, id),
        });
      }
    }

    return [...this.boundActions.values()].map((entry) => entry.action);
  }

  mcpTools(): McpToolDescriptor[] {
    return toMcpToolDescriptors([...this.boundActions.values()].map((entry) => entry.action));
  }

  async invoke(actionId: string, input: Record<string, unknown>): Promise<SemanticActionResult> {
    const bound = this.boundActions.get(actionId);
    if (!bound) {
      throw new Error(`Unknown semantic action: ${actionId}`);
    }

    if (bound.source === "webmcp") {
      if (!this.webMcpRuntime) {
        throw new Error("WebMCP runtime is not configured");
      }
      return this.webMcpRuntime.invoke(actionId, input);
    }

    const adapterActionName = bound.adapterActionName;
    if (!adapterActionName) {
      throw new Error(`Missing adapter action binding for ${actionId}`);
    }

    const data = await this.adapterExecutor.execute(adapterActionName, input);
    return {
      actionId,
      source: "adapter",
      data,
    };
  }

  private buildAdapterActions(adapter: ReturnType<typeof validateAdapter>): SemanticAction[] {
    return Object.entries(adapter.actions).map(([actionName, definition]) => {
      const id = this.semanticIdForAdapterAction(adapter.id, actionName);
      return {
        id,
        description: definition.description,
        inputSchema: definition.input,
        outputSchema: definition.output ?? {},
        source: "adapter",
        risk: adapter.risk ?? "read",
        approval: adapter.approval ?? "none",
      };
    });
  }

  private semanticIdForAdapterAction(adapterId: string, actionName: string): string {
    const last = adapterId.split(".").at(-1);
    if (last === actionName) {
      return adapterId;
    }
    return `${adapterId}.${actionName}`;
  }

  private adapterActionNameFromId(adapter: ReturnType<typeof validateAdapter>, semanticId: string): string {
    const direct = Object.keys(adapter.actions).find((name) => this.semanticIdForAdapterAction(adapter.id, name) === semanticId);
    if (!direct) {
      throw new Error(`No adapter action mapping found for semantic id ${semanticId}`);
    }
    return direct;
  }
}
