import type { RecordingPackage } from "../../../../packages/recorder-protocol/src/recording.js";

export function summarizeRecording(recording: RecordingPackage): {
  site: string;
  interactions: number;
  hasSemanticLabels: boolean;
} {
  return {
    site: recording.site,
    interactions: recording.interactions.length,
    hasSemanticLabels: recording.interactions.some((step) => Boolean(step.semanticLabel)),
  };
}
