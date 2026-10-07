import test from "node:test";
import assert from "node:assert/strict";
import { chooseImplementationSource, mapWebMcpToSemanticActions } from "../../packages/webmcp/src/bridge.js";

test("webmcp source is preferred when available", () => {
  assert.equal(chooseImplementationSource({ hasWebMcp: true, hasAdapter: true }), "webmcp");
  assert.equal(chooseImplementationSource({ hasWebMcp: true, hasAdapter: true, forceAdapter: true }), "adapter");
});

test("discovered webmcp tools are mapped to semantic actions", () => {
  const actions = mapWebMcpToSemanticActions([
    {
      id: "github.search",
      description: "Search repos",
      inputSchema: { type: "object" },
      outputSchema: { type: "array" },
    },
  ]);
  assert.equal(actions[0]?.source, "webmcp");
});
