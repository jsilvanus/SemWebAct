import test from "node:test";
import assert from "node:assert/strict";
import { buildReplayTest, generateAdapterYaml, inferObjectsFromRecording, toActionFromInteractionSequence } from "../../apps/studio/editor/src/studio-workflow.js";
import { DeterministicRecorder } from "../../apps/studio/recorder/src/recorder.js";

test("studio workflow infers objects, generates adapter yaml, and replay test", () => {
  const recorder = new DeterministicRecorder();
  recorder.recordClick("https://example.com", ["role:textbox", "css:#search"], "search_box");
  recorder.recordFill("https://example.com", ["label:Search"], "query text", "search_box");
  recorder.recordPress("https://example.com", "Enter", "search_box");

  const recording = recorder.export("example.com", "Example");
  const objects = inferObjectsFromRecording(recording);
  assert.equal(objects.length, 1);
  assert.equal(objects[0]?.name, "search_box");

  const action = toActionFromInteractionSequence("search", "Search site", recording.interactions);
  const yaml = generateAdapterYaml({
    id: "example.search",
    name: "Example Search",
    version: "1.0.0",
    domains: ["example.com"],
    risk: "read",
    approval: "none",
    objects,
    actions: [action],
  });

  assert.match(yaml, /id: example.search/);
  assert.match(yaml, /actions:/);

  const replay = buildReplayTest("search", { query: "hello" }, { results: { type: "list" } });
  assert.match(replay, /action: search/);
  assert.match(replay, /expect:/);
});

test("studio recorder redacts sensitive fill values", () => {
  const recorder = new DeterministicRecorder();
  recorder.recordFill("https://example.com/login", ["label:Password"], "my-password", "password_field");
  const recording = recorder.export("example.com", "Login");
  assert.equal(recording.interactions[0]?.value, "[REDACTED]");
});
