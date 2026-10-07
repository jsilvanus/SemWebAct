import test from "node:test";
import assert from "node:assert/strict";
import { ApprovalStore, ActionAuthorization } from "../../apps/server/src/security/policy.js";

const action = {
  id: "github.delete_issue",
  description: "Delete issue",
  inputSchema: {},
  outputSchema: {},
  source: "adapter" as const,
  risk: "destructive" as const,
  approval: "required" as const,
};

test("authorization enforces capabilities and approval", () => {
  const approvals = new ApprovalStore();
  const authz = new ActionAuthorization(approvals);

  assert.throws(
    () => authz.assertCanInvoke(action, { actorId: "u1", capabilities: ["DESTRUCTIVE"] }),
    /Approval required/,
  );

  const token = authz.requestApproval("u1", action.id, 1000);
  assert.doesNotThrow(() =>
    authz.assertCanInvoke(action, {
      actorId: "u1",
      capabilities: ["DESTRUCTIVE"],
      approvalToken: token,
    }),
  );

  assert.throws(
    () => authz.assertCanInvoke(action, { actorId: "u2", capabilities: ["READ"] }),
    /missing capability/,
  );
});
