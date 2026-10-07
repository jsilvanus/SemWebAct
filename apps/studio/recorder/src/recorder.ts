import type { RecordedInteraction, RecordingPackage } from "../../../../packages/recorder-protocol/src/recording.js";

export class DeterministicRecorder {
  private readonly interactions: RecordedInteraction[] = [];

  record(interaction: RecordedInteraction): void {
    this.interactions.push(interaction);
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
