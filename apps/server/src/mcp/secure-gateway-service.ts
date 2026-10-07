import type { SemanticActionResult } from "../../../../packages/semantic-actions/src/model.js";
import { ActivityLog } from "../sessions/activity-log.js";
import { ActionAuthorization, type InvocationContext } from "../security/policy.js";
import { McpGatewayService } from "./gateway-service.js";
import { SemWebActRuntime } from "./semantic-runtime.js";

export class SecureMcpGatewayService {
  constructor(
    private readonly runtime: SemWebActRuntime,
    private readonly gateway: McpGatewayService,
    private readonly authorization: ActionAuthorization,
    private readonly activityLog: ActivityLog,
  ) {}

  async invoke(context: InvocationContext, toolName: string, input: Record<string, unknown>): Promise<SemanticActionResult> {
    const action = this.runtime.getAction(toolName);
    if (!action) {
      throw new Error(`Unknown semantic action: ${toolName}`);
    }

    try {
      this.authorization.assertCanInvoke(action, context);
      const result = await this.gateway.invoke(toolName, input);
      this.activityLog.push({
        timestamp: new Date().toISOString(),
        actionId: toolName,
        source: result.source,
        result: "ok",
        risk: action.risk,
        actorId: context.actorId,
      });
      return result;
    } catch (error) {
      this.activityLog.push({
        timestamp: new Date().toISOString(),
        actionId: toolName,
        source: action.source,
        result: "error",
        risk: action.risk,
        actorId: context.actorId,
      });
      throw error;
    }
  }

  requestApproval(actorId: string, actionId: string, ttlMs?: number): string {
    return this.authorization.requestApproval(actorId, actionId, ttlMs);
  }
}
