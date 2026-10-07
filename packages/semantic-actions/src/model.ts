export type ActionRisk = "read" | "write" | "sensitive" | "destructive";

export interface SemanticAction {
  id: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  source: "webmcp" | "adapter";
  risk: ActionRisk;
  approval?: "required" | "none";
}

export interface SemanticActionResult {
  actionId: string;
  source: "webmcp" | "adapter";
  data: unknown;
}
