export interface BrowserContextRef {
  id: string;
  site: string;
}

export class ContextPool {
  private readonly contexts = new Map<string, BrowserContextRef>();

  create(site: string): BrowserContextRef {
    const ref = { id: crypto.randomUUID(), site };
    this.contexts.set(ref.id, ref);
    return ref;
  }

  destroy(id: string): void {
    this.contexts.delete(id);
  }
}
