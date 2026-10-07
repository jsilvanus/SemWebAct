import type { SemanticActionResult } from "../../../../packages/semantic-actions/src/model.js";
import type { McpToolDescriptor } from "./gateway.js";
import { SemWebActRuntime } from "./semantic-runtime.js";

export class McpGatewayService {
  constructor(private readonly runtime: SemWebActRuntime) {}

  async refresh(options?: { forceAdapter?: boolean }): Promise<McpToolDescriptor[]> {
    await this.runtime.refreshActions(options);
    return this.runtime.mcpTools();
  }

  listTools(): McpToolDescriptor[] {
    return this.runtime.mcpTools();
  }

  async invoke(toolName: string, input: Record<string, unknown>): Promise<SemanticActionResult> {
    return this.runtime.invoke(toolName, input);
  }
}
