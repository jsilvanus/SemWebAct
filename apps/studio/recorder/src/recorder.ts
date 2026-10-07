import type { RecordedInteraction, RecordingPackage } from "../../../../packages/recorder-protocol/src/recording.js";

function shouldRedactValue(semanticLabel?: string, candidateLocators?: string[]): boolean {
  // Redaction should be driven by field identity (label/role/name), not by value content.
  // Check if the semantic label or locators indicate a sensitive field.
  const allIdentifiers = [semanticLabel, ...(candidateLocators || [])].join(" ").toLowerCase();
  const sensitivePatterns = ["password", "token", "secret", "apikey", "api-key", "api_key", "auth", "credential"];
  return sensitivePatterns.some(pattern => allIdentifiers.includes(pattern));
}

function redactValue(value: string | undefined, shouldRedact: boolean): string | undefined {
  if (!value || !shouldRedact) return value;
  return "[REDACTED]";
}

export class DeterministicRecorder {
  private readonly interactions: RecordedInteraction[] = [];

  record(interaction: RecordedInteraction): void {
    // Determine if this interaction should have its value redacted based on field identity
    const shouldRedact = shouldRedactValue(interaction.semanticLabel, interaction.candidateLocators);
    this.interactions.push({
      ...interaction,
      value: redactValue(interaction.value, shouldRedact),
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
