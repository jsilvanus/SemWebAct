import type { SemanticAction } from "../../../../packages/semantic-actions/src/model.js";

export interface McpToolDescriptor {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export function toMcpToolDescriptors(actions: SemanticAction[]): McpToolDescriptor[] {
  return actions.map((action) => ({
    name: action.id,
    description: action.description,
    inputSchema: action.inputSchema,
  }));
}
