import test from "node:test";
import assert from "node:assert/strict";
import { toMcpToolDescriptors } from "../../apps/server/src/mcp/gateway.js";

test("gateway exposes semantic actions as MCP tool descriptors", () => {
  const tools = toMcpToolDescriptors([
    {
      id: "wikipedia.search",
      description: "Search wikipedia",
      inputSchema: { type: "object" },
      outputSchema: { type: "array" },
      source: "adapter",
      risk: "read",
      approval: "none",
    },
  ]);

  assert.deepEqual(tools[0], {
    name: "wikipedia.search",
    description: "Search wikipedia",
    inputSchema: { type: "object" },
  });
});
