import type { ActionRisk } from "../../../../packages/semantic-actions/src/model.js";

export interface AdapterIdentity {
  id: string;
  name: string;
  version: string;
  source: "git" | "local" | "registry";
  author?: string;
  license?: string;
  site: { domains: string[] };
  permissions?: Array<"read" | "write" | "sensitive" | "destructive">;
  risk?: ActionRisk;
}

export interface AdapterTrust {
  signature?: string;
  publisher?: string;
  trustedPublisher?: boolean;
  sha256?: string;
}

export interface InstalledAdapter extends AdapterIdentity {
  uri: string;
  pinned?: boolean;
  trust?: AdapterTrust;
  installedAt: string;
}

function parseSemver(value: string): [number, number, number] {
  const m = value.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!m) {
    throw new Error(`Invalid semantic version: ${value}`);
  }
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function compareSemver(a: string, b: string): number {
  const [aMaj, aMin, aPatch] = parseSemver(a);
  const [bMaj, bMin, bPatch] = parseSemver(b);

  if (aMaj !== bMaj) return aMaj - bMaj;
  if (aMin !== bMin) return aMin - bMin;
  return aPatch - bPatch;
}

export class AdapterRegistry {
  private readonly adaptersByKey = new Map<string, InstalledAdapter>();

  install(adapter: Omit<InstalledAdapter, "installedAt">): InstalledAdapter {
    const installed: InstalledAdapter = {
      ...adapter,
      installedAt: new Date().toISOString(),
    };

    parseSemver(installed.version);
    this.adaptersByKey.set(this.keyOf(installed.id, installed.version), installed);
    return installed;
  }

  installFromLocal(input: Omit<InstalledAdapter, "source" | "installedAt">): InstalledAdapter {
    return this.install({ ...input, source: "local" });
  }

  installFromGit(input: Omit<InstalledAdapter, "source" | "installedAt">): InstalledAdapter {
    return this.install({ ...input, source: "git" });
  }

  installFromRegistry(input: Omit<InstalledAdapter, "source" | "installedAt">): InstalledAdapter {
    return this.install({ ...input, source: "registry" });
  }

  list(): InstalledAdapter[] {
    return [...this.adaptersByKey.values()].sort((a, b) => {
      if (a.id !== b.id) return a.id.localeCompare(b.id);
      return compareSemver(a.version, b.version);
    });
  }

  get(id: string, version: string): InstalledAdapter | undefined {
    return this.adaptersByKey.get(this.keyOf(id, version));
  }

  resolveLatest(id: string): InstalledAdapter | undefined {
    return this.list()
      .filter((entry) => entry.id === id)
      .sort((a, b) => compareSemver(b.version, a.version))[0];
  }

  resolvePinned(id: string): InstalledAdapter | undefined {
    return this.list().find((entry) => entry.id === id && entry.pinned);
  }

  remove(id: string, version: string): void {
    this.adaptersByKey.delete(this.keyOf(id, version));
  }

  private keyOf(id: string, version: string): string {
    return `${id}@${version}`;
  }
}
