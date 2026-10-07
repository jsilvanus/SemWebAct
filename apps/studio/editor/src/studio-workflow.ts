import type { RecordedInteraction, RecordingPackage } from "../../../../packages/recorder-protocol/src/recording.js";

export interface StudioObjectDefinition {
  name: string;
  strategies: Array<{ role?: { role: string; name?: string }; label?: string; placeholder?: string; text?: string; semantic?: string; css?: string }>;
}

export interface StudioActionDefinition {
  name: string;
  description: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  steps: Array<Record<string, unknown>>;
}

export interface StudioAdapterDraft {
  id: string;
  name: string;
  version: string;
  domains: string[];
  risk: "read" | "write" | "sensitive" | "destructive";
  approval: "none" | "required";
  objects: StudioObjectDefinition[];
  actions: StudioActionDefinition[];
}

export function inferObjectsFromRecording(recording: RecordingPackage): StudioObjectDefinition[] {
  const objects = new Map<string, StudioObjectDefinition>();

  for (const interaction of recording.interactions) {
    if (!interaction.semanticLabel) {
      continue;
    }

    if (!objects.has(interaction.semanticLabel)) {
      objects.set(interaction.semanticLabel, {
        name: interaction.semanticLabel,
        strategies: interaction.candidateLocators
          .filter(Boolean)
          .map((value) => (value.startsWith("role:")
            ? { role: { role: value.replace(/^role:/, "") } }
            : value.startsWith("label:")
              ? { label: value.replace(/^label:/, "") }
              : value.startsWith("placeholder:")
                ? { placeholder: value.replace(/^placeholder:/, "") }
                : value.startsWith("text:")
                  ? { text: value.replace(/^text:/, "") }
                  : value.startsWith("semantic:")
                    ? { semantic: value.replace(/^semantic:/, "") }
                    : { css: value })),
      });
    }
  }

  return [...objects.values()];
}

export function generateAdapterYaml(draft: StudioAdapterDraft): string {
  const objectBlocks = draft.objects
    .map((objectDef) => {
      const strategies = objectDef.strategies
        .map((strategy) => {
          if (strategy.role) {
            const nameLine = strategy.role.name ? `\n            name: ${strategy.role.name}` : "";
            return `        - role:\n            role: ${strategy.role.role}${nameLine}`;
          }
          if (strategy.label) return `        - label: ${strategy.label}`;
          if (strategy.placeholder) return `        - placeholder: ${strategy.placeholder}`;
          if (strategy.text) return `        - text: ${strategy.text}`;
          if (strategy.semantic) return `        - semantic: ${strategy.semantic}`;
          if (strategy.css) return `        - css: "${strategy.css}"`;
          return "";
        })
        .filter(Boolean)
        .join("\n");

      return `  ${objectDef.name}:\n    locator:\n      strategies:\n${strategies}`;
    })
    .join("\n");

  const actionsBlock = draft.actions
    .map((action) => {
      const steps = action.steps
        .map((step) => {
          const [name, value] = Object.entries(step)[0] ?? [];
          if (!name) {
            return "";
          }

          if (typeof value === "string") {
            return `      - ${name}: ${value}`;
          }

          if (value && typeof value === "object") {
            const nested = Object.entries(value as Record<string, unknown>)
              .map(([k, v]) => `          ${k}: ${typeof v === "string" ? `\"${v}\"` : String(v)}`)
              .join("\n");
            return `      - ${name}:\n${nested}`;
          }

          return `      - ${name}`;
        })
        .filter(Boolean)
        .join("\n");

      const inputLines = Object.entries(action.input)
        .map(([key, value]) => `      ${key}:\n        type: ${String((value as { type?: string }).type ?? "string")}\n        required: ${String((value as { required?: boolean }).required ?? false)}`)
        .join("\n");

      const outputLines = action.output
        ? `\n    output:\n${Object.entries(action.output)
            .map(([key, value]) => `      ${key}:\n        type: ${String((value as { type?: string }).type ?? "string")}`)
            .join("\n")}`
        : "";

      return `  ${action.name}:\n    description: ${action.description}\n    input:\n${inputLines}\n    steps:\n${steps}${outputLines}`;
    })
    .join("\n");

  return [
    `id: ${draft.id}`,
    `name: ${draft.name}`,
    `version: ${draft.version}`,
    "site:",
    "  domains:",
    ...draft.domains.map((domain) => `    - ${domain}`),
    `risk: ${draft.risk}`,
    `approval: ${draft.approval}`,
    "objects:",
    objectBlocks,
    "actions:",
    actionsBlock,
  ].join("\n");
}

export function buildReplayTest(action: string, input: Record<string, unknown>, expect: Record<string, unknown>): string {
  const inputBlock = Object.entries(input)
    .map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`)
    .join("\n");
  const expectBlock = Object.entries(expect)
    .map(([k, v]) => `  ${k}:\n    type: ${(v as { type?: string }).type ?? "string"}`)
    .join("\n");

  return `action: ${action}\ninput:\n${inputBlock}\nexpect:\n${expectBlock}`;
}

export function toActionFromInteractionSequence(name: string, description: string, interactions: RecordedInteraction[]): StudioActionDefinition {
  const steps: Array<Record<string, unknown>> = [];

  for (const interaction of interactions) {
    if (interaction.type === "click") {
      steps.push({ find: interaction.semanticLabel ?? "unnamed_target" });
      steps.push({ click: {} });
    } else if (interaction.type === "fill") {
      steps.push({ find: interaction.semanticLabel ?? "unnamed_field" });
      steps.push({ fill: { value: interaction.value ?? "" } });
    } else if (interaction.type === "press") {
      steps.push({ press: { key: interaction.value ?? "Enter" } });
    }
  }

  return {
    name,
    description,
    input: {},
    steps,
  };
}
