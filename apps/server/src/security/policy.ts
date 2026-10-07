import type { ActionRisk, SemanticAction } from "../../../../packages/semantic-actions/src/model.js";

export type Capability = "READ" | "WRITE" | "SENSITIVE" | "DESTRUCTIVE";

export interface ActionPolicy {
  actionId: string;
  risk: ActionRisk;
  approvalRequired: boolean;
}

export interface InvocationContext {
  actorId: string;
  capabilities: Capability[];
  approvalToken?: string;
}

export class ApprovalStore {
  private readonly approvals = new Map<string, { actorId: string; actionId: string; expiresAt: number }>();

  issue(actorId: string, actionId: string, ttlMs = 5 * 60 * 1000): string {
    const token = crypto.randomUUID();
    this.approvals.set(token, { actorId, actionId, expiresAt: Date.now() + ttlMs });
    return token;
  }

  consume(token: string, actorId: string, actionId: string): boolean {
    const approval = this.approvals.get(token);
    if (!approval) return false;
    this.approvals.delete(token);

    if (approval.actorId !== actorId || approval.actionId !== actionId) {
      return false;
    }

    return approval.expiresAt >= Date.now();
  }
}

export class ActionAuthorization {
  constructor(private readonly approvals: ApprovalStore) {}

  policyFor(action: SemanticAction): ActionPolicy {
    return {
      actionId: action.id,
      risk: action.risk,
      approvalRequired: action.approval === "required" || action.risk === "destructive",
    };
  }

  assertCanInvoke(action: SemanticAction, context: InvocationContext): void {
    const policy = this.policyFor(action);
    const required = this.requiredCapability(policy.risk);
    if (!context.capabilities.includes(required)) {
      throw new Error(`Forbidden: missing capability ${required} for action ${action.id}`);
    }

    if (policy.approvalRequired) {
      if (!context.approvalToken || !this.approvals.consume(context.approvalToken, context.actorId, action.id)) {
        throw new Error(`Approval required for action ${action.id}`);
      }
    }
  }

  requestApproval(actorId: string, actionId: string, ttlMs?: number): string {
    return this.approvals.issue(actorId, actionId, ttlMs);
  }

  private requiredCapability(risk: ActionRisk): Capability {
    switch (risk) {
      case "read":
        return "READ";
      case "write":
        return "WRITE";
      case "sensitive":
        return "SENSITIVE";
      case "destructive":
        return "DESTRUCTIVE";
    }
  }
}
