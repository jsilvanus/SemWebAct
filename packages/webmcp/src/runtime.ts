import type { SemanticActionResult } from "../../semantic-actions/src/model.js";
import type { DiscoveredWebMcpTool } from "./bridge.js";

export interface WebMcpRuntime {
  discoverTools(): Promise<DiscoveredWebMcpTool[]>;
  invoke(toolId: string, input: Record<string, unknown>): Promise<SemanticActionResult>;
}
