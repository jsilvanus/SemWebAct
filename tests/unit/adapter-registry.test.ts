import test from "node:test";
import assert from "node:assert/strict";
import { AdapterRegistry } from "../../apps/server/src/adapters/registry.js";

test("adapter registry installs from multiple sources and resolves versions", () => {
  const registry = new AdapterRegistry();

  registry.installFromRegistry({
    id: "example.search",
    name: "Example",
    version: "1.0.0",
    site: { domains: ["example.com"] },
    uri: "registry://example.search@1.0.0",
  });

  registry.installFromGit({
    id: "example.search",
    name: "Example",
    version: "1.2.0",
    site: { domains: ["example.com"] },
    uri: "https://github.com/acme/example-search.git",
    trust: { publisher: "acme", trustedPublisher: true, sha256: "abc" },
  });

  registry.installFromLocal({
    id: "example.search",
    name: "Example",
    version: "1.1.0",
    site: { domains: ["example.com"] },
    uri: "file:///tmp/example/adapter.yaml",
    pinned: true,
  });

  assert.equal(registry.resolveLatest("example.search")?.version, "1.2.0");
  assert.equal(registry.resolvePinned("example.search")?.version, "1.1.0");
  assert.equal(registry.list().length, 3);
});
