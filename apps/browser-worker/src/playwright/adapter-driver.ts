import type { BrowserDriver, LocatorStrategy, LocatedElement } from "../../../../packages/adapter-runtime/src/types.js";

interface LocatorLike {
  click(): Promise<void>;
  fill(value: string): Promise<void>;
  waitFor(options?: { timeout?: number; state?: "attached" | "visible" }): Promise<void>;
  allTextContents(): Promise<string[]>;
}

interface PageLike {
  url(): string;
  goto(url: string, options?: { waitUntil?: "domcontentloaded" }): Promise<void>;
  getByRole(role: string, options?: { name?: string }): LocatorLike;
  getByLabel(label: string): LocatorLike;
  getByPlaceholder(placeholder: string): LocatorLike;
  getByText(text: string): LocatorLike;
  locator(selector: string): LocatorLike;
  keyboard: {
    press(key: string): Promise<void>;
  };
}

export class PlaywrightAdapterDriver implements BrowserDriver {
  private readonly elements = new Map<string, LocatorLike>();

  constructor(private readonly page: PageLike) {}

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  async navigate(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: "domcontentloaded" });
  }

  async find(strategies: LocatorStrategy[]): Promise<LocatedElement> {
    const ordered = this.normalizeStrategies(strategies);

    for (const strategy of ordered) {
      const locator = this.locatorFromStrategy(strategy);
      if (!locator) {
        continue;
      }

      try {
        await locator.waitFor({ timeout: 1200, state: "attached" });
        const id = crypto.randomUUID();
        this.elements.set(id, locator);
        return { id };
      } catch {
        // continue trying fallback strategies
      }
    }

    throw new Error("Unable to locate element with configured strategies");
  }

  async click(element: LocatedElement): Promise<void> {
    await this.requireElement(element).click();
  }

  async fill(element: LocatedElement, value: string): Promise<void> {
    await this.requireElement(element).fill(value);
  }

  async press(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  async waitForElement(element: LocatedElement, timeoutMs?: number): Promise<void> {
    await this.requireElement(element).waitFor({ timeout: timeoutMs, state: "visible" });
  }

  async extract(element: LocatedElement): Promise<unknown> {
    const values = await this.requireElement(element).allTextContents();
    return values.map((value) => value.trim()).filter(Boolean);
  }

  private requireElement(element: LocatedElement): LocatorLike {
    const locator = this.elements.get(element.id);
    if (!locator) {
      throw new Error(`Unknown element handle: ${element.id}`);
    }
    return locator;
  }

  private normalizeStrategies(strategies: LocatorStrategy[]): LocatorStrategy[] {
    const grouped = {
      role: [] as LocatorStrategy[],
      label: [] as LocatorStrategy[],
      placeholder: [] as LocatorStrategy[],
      text: [] as LocatorStrategy[],
      semantic: [] as LocatorStrategy[],
      css: [] as LocatorStrategy[],
    };

    for (const strategy of strategies) {
      if (strategy.role) grouped.role.push(strategy);
      else if (strategy.label) grouped.label.push(strategy);
      else if (strategy.placeholder) grouped.placeholder.push(strategy);
      else if (strategy.text) grouped.text.push(strategy);
      else if (strategy.semantic) grouped.semantic.push(strategy);
      else if (strategy.css) grouped.css.push(strategy);
    }

    return [
      ...grouped.role,
      ...grouped.label,
      ...grouped.placeholder,
      ...grouped.text,
      ...grouped.semantic,
      ...grouped.css,
    ];
  }

  private locatorFromStrategy(strategy: LocatorStrategy): LocatorLike | undefined {
    if (strategy.role) {
      return this.page.getByRole(strategy.role.role, { name: strategy.role.name });
    }
    if (strategy.label) {
      return this.page.getByLabel(strategy.label);
    }
    if (strategy.placeholder) {
      return this.page.getByPlaceholder(strategy.placeholder);
    }
    if (strategy.text) {
      return this.page.getByText(strategy.text);
    }
    if (strategy.semantic) {
      return this.page.locator(`[data-semantic="${strategy.semantic}"], [data-testid="${strategy.semantic}"]`);
    }
    if (strategy.css) {
      return this.page.locator(strategy.css);
    }
    return undefined;
  }
}
