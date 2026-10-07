import type { AdapterDefinition } from "../../adapter-schema/src/schema.js";

export type LocatorStrategy = AdapterDefinition["objects"][string]["locator"]["strategies"][number];

export interface LocatedElement {
  id: string;
}

export interface BrowserDriver {
  getCurrentUrl(): Promise<string>;
  navigate(url: string): Promise<void>;
  find(strategies: LocatorStrategy[]): Promise<LocatedElement>;
  click(element: LocatedElement): Promise<void>;
  fill(element: LocatedElement, value: string): Promise<void>;
  press(key: string): Promise<void>;
  waitForElement(element: LocatedElement, timeoutMs?: number): Promise<void>;
  extract(element: LocatedElement): Promise<unknown>;
}
