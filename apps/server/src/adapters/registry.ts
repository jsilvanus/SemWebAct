export interface InstalledAdapter {
  id: string;
  name: string;
  version: string;
  source: "git" | "local" | "registry";
}

export class AdapterRegistry {
  private readonly adapters = new Map<string, InstalledAdapter>();

  install(adapter: InstalledAdapter): void {
    this.adapters.set(`${adapter.id}@${adapter.version}`, adapter);
  }

  list(): InstalledAdapter[] {
    return [...this.adapters.values()];
  }
}
