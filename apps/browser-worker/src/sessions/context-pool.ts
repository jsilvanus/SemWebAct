export interface BrowserContextRef {
  id: string;
  site: string;
  allowedDomains: string[];
}

export class ContextPool {
  private readonly contexts = new Map<string, BrowserContextRef>();

  create(site: string, allowedDomains: string[]): BrowserContextRef {
    const ref = { id: crypto.randomUUID(), site, allowedDomains };
    this.contexts.set(ref.id, ref);
    return ref;
  }

  get(id: string): BrowserContextRef | undefined {
    return this.contexts.get(id);
  }

  destroy(id: string): void {
    this.contexts.delete(id);
  }
}
