import type { SemanticAction } from "./model.js";

export class SemanticActionRegistry {
  private readonly actions = new Map<string, SemanticAction>();

  register(action: SemanticAction): void {
    this.actions.set(action.id, action);
  }

  registerMany(actions: SemanticAction[]): void {
    actions.forEach((action) => this.register(action));
  }

  list(): SemanticAction[] {
    return [...this.actions.values()];
  }

  get(id: string): SemanticAction | undefined {
    return this.actions.get(id);
  }
}
