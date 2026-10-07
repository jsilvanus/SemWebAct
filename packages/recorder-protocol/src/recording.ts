export interface RecordedInteraction {
  type: "click" | "fill" | "press";
  timestamp: string;
  url: string;
  candidateLocators: string[];
  value?: string;
  semanticLabel?: string;
}

export interface RecordingPackage {
  startedAt: string;
  site: string;
  pageTitle: string;
  interactions: RecordedInteraction[];
  screenshots: string[];
  domSnapshots: string[];
  accessibilitySnapshots: string[];
  redactionPolicy: "secrets-redacted";
}
