import type { SemanticAction } from "../../semantic-actions/src/model.js";

export interface DiscoveredWebMcpTool {
  id: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
}

export function mapWebMcpToSemanticActions(tools: DiscoveredWebMcpTool[]): SemanticAction[] {
  return tools.map((tool) => ({
    id: tool.id,
    description: tool.description,
    inputSchema: tool.inputSchema,
    outputSchema: tool.outputSchema,
    source: "webmcp",
    // Default to high risk and required approval to enforce proper authorization.
    // WebMCP tools may perform destructive actions; do not assume read-only access.
    // Override this explicitly for known safe read-only tools.
    risk: "high",
    approval: "required",
  }));
}

export function chooseImplementationSource(options: {
  hasWebMcp: boolean;
  hasAdapter: boolean;
  forceAdapter?: boolean;
}): "webmcp" | "adapter" | "none" {
  if (options.forceAdapter && options.hasAdapter) return "adapter";
  if (options.hasWebMcp) return "webmcp";
  if (options.hasAdapter) return "adapter";
  return "none";
}
