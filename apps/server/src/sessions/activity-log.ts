export interface ActivityRecord {
  timestamp: string;
  actionId: string;
  source: "webmcp" | "adapter";
  result: "ok" | "error";
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
