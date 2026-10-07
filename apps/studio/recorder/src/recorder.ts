import type { RecordedInteraction, RecordingPackage } from "../../../../packages/recorder-protocol/src/recording.js";

function redactValue(value: string | undefined): string | undefined {
  if (!value) return value;
  const lowered = value.toLowerCase();
  if (lowered.includes("password") || lowered.includes("token") || lowered.includes("secret")) {
    return "[REDACTED]";
  }
  return value;
}

export class DeterministicRecorder {
  private readonly interactions: RecordedInteraction[] = [];

  record(interaction: RecordedInteraction): void {
    this.interactions.push({
      ...interaction,
      value: redactValue(interaction.value),
    });
  }

  recordFill(url: string, candidateLocators: string[], value: string, semanticLabel?: string): void {
    this.record({
      type: "fill",
      timestamp: new Date().toISOString(),
      url,
      candidateLocators,
      value,
      semanticLabel,
    });
  }

  recordClick(url: string, candidateLocators: string[], semanticLabel?: string): void {
    this.record({
      type: "click",
      timestamp: new Date().toISOString(),
      url,
      candidateLocators,
      semanticLabel,
    });
  }

  recordPress(url: string, key: string, semanticLabel?: string): void {
    this.record({
      type: "press",
      timestamp: new Date().toISOString(),
      url,
      candidateLocators: [],
      value: key,
      semanticLabel,
    });
  }

  export(site: string, pageTitle: string): RecordingPackage {
    return {
      startedAt: new Date().toISOString(),
      site,
      pageTitle,
      interactions: [...this.interactions],
      screenshots: [],
      domSnapshots: [],
      accessibilitySnapshots: [],
      redactionPolicy: "secrets-redacted",
    };
  }
}
