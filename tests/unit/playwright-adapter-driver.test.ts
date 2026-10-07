import test from "node:test";
import assert from "node:assert/strict";
import { PlaywrightAdapterDriver } from "../../apps/browser-worker/src/playwright/adapter-driver.js";

class FakeLocator {
  constructor(
    private readonly id: string,
    private readonly shouldAttach = true,
    private readonly texts: string[] = ["text"],
  ) {}

  async click(): Promise<void> {}
  async fill(): Promise<void> {}
  async waitFor(): Promise<void> {
    if (!this.shouldAttach) throw new Error(`not found: ${this.id}`);
  }
  async allTextContents(): Promise<string[]> {
    return this.texts;
  }
}

class FakePage {
  public readonly calls: string[] = [];
  public keyboard = {
    press: async (key: string) => {
      this.calls.push(`press:${key}`);
    },
  };

  private currentUrl = "https://example.com";

  url(): string {
    return this.currentUrl;
  }

  async goto(url: string): Promise<void> {
    this.currentUrl = url;
  }

  getByRole(role: string): FakeLocator {
    this.calls.push(`role:${role}`);
    return new FakeLocator("role", false);
  }

  getByLabel(label: string): FakeLocator {
    this.calls.push(`label:${label}`);
    return new FakeLocator("label", true, [" a ", "", "b"]);
  }

  getByPlaceholder(placeholder: string): FakeLocator {
    this.calls.push(`placeholder:${placeholder}`);
    return new FakeLocator("placeholder", false);
  }

  getByText(text: string): FakeLocator {
    this.calls.push(`text:${text}`);
    return new FakeLocator("text", false);
  }

  locator(selector: string): FakeLocator {
    this.calls.push(`css:${selector}`);
    return new FakeLocator("css", false);
  }
}

test("playwright adapter driver uses fallback locator order and extracts text", async () => {
  const page = new FakePage();
  const driver = new PlaywrightAdapterDriver(page);

  const element = await driver.find([
    { css: ".late" },
    { label: "Search" },
    { role: { role: "textbox", name: "Search" } },
  ]);

  await driver.click(element);
  await driver.fill(element, "hello");
  await driver.press("Enter");
  await driver.waitForElement(element, 1000);
  const extracted = await driver.extract(element);

  assert.deepEqual(extracted, ["a", "b"]);
  assert.deepEqual(page.calls.slice(0, 2), ["role:textbox", "label:Search"]);
});
