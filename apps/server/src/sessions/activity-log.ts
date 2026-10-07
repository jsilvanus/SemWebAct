import type { ActionRisk } from "../../../../packages/semantic-actions/src/model.js";

export interface ActivityRecord {
  timestamp: string;
  actionId: string;
  source: "webmcp" | "adapter";
  result: "ok" | "error";
  risk?: ActionRisk;
  actorId?: string;
}

export class ActivityLog {
  private readonly records: ActivityRecord[] = [];

  push(record: ActivityRecord): void {
    this.records.push(record);
  }

  all(): ActivityRecord[] {
    return [...this.records];
  }
}
