import { validateAdapter } from "../../adapter-schema/src/validate.js";
import type { BrowserDriver, LocatedElement } from "./types.js";

function hostnameOf(urlValue: string): string {
  return new URL(urlValue).hostname.replace(/^www\./, "").toLowerCase();
}

function isAllowedDomain(urlValue: string, domains: string[]): boolean {
  const host = hostnameOf(urlValue);
  return domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function interpolate(template: string, input: Record<string, unknown>): string {
  return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_m, key: string) => String(input[key] ?? ""));
}

function validateRequiredInputs(inputSchema: Record<string, unknown>, input: Record<string, unknown>): void {
  for (const [name, definition] of Object.entries(inputSchema)) {
    if (typeof definition !== "object" || definition === null) {
      continue;
    }

    const isRequired = Boolean((definition as { required?: unknown }).required);
    if (isRequired && input[name] === undefined) {
      throw new Error(`Missing required action input: ${name}`);
    }
  }
}

export class AdapterExecutor {
  constructor(
    private readonly rawAdapter: unknown,
    private readonly browser: BrowserDriver,
  ) {}

  async execute(actionName: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
    const adapter = validateAdapter(this.rawAdapter);
    const action = adapter.actions[actionName];
    if (!action) {
      throw new Error(`Unknown action: ${actionName}`);
    }

    validateRequiredInputs(action.input, input);

    const output: Record<string, unknown> = {};
    let currentElement: LocatedElement | undefined;

    for (const step of action.steps) {
      if ("navigate" in step) {
        const target = interpolate(step.navigate.url, input);
        if (!isAllowedDomain(target, adapter.site.domains)) {
          throw new Error(`Navigation blocked by domain policy: ${target}`);
        }
        await this.browser.navigate(target);
        continue;
      }

      if ("find" in step) {
        const definition = adapter.objects[step.find];
        if (!definition) {
          throw new Error(`Unknown object: ${step.find}`);
        }
        currentElement = await this.browser.find(definition.locator.strategies);
        continue;
      }

      if ("click" in step) {
        if (step.click.object) {
          const definition = adapter.objects[step.click.object];
          if (!definition) {
            throw new Error(`Unknown click object: ${step.click.object}`);
          }
          const target = await this.browser.find(definition.locator.strategies);
          await this.browser.click(target);
          currentElement = target;
          continue;
        }

        if (!currentElement) throw new Error("click requires a previous find step or an explicit object");
        await this.browser.click(currentElement);
        continue;
      }

      if ("fill" in step) {
        if (!currentElement) throw new Error("fill requires a previous find step");
        await this.browser.fill(currentElement, interpolate(step.fill.value, input));
        continue;
      }

      if ("press" in step) {
        await this.browser.press(step.press.key);
        continue;
      }

      if ("wait" in step) {
        if (step.wait.for) {
          const definition = adapter.objects[step.wait.for];
          if (!definition) {
            throw new Error(`Unknown wait target object: ${step.wait.for}`);
          }
          const waitedElement = await this.browser.find(definition.locator.strategies);
          await this.browser.waitForElement(waitedElement, step.wait.timeoutMs);
          currentElement = waitedElement;
          continue;
        }

        if (!currentElement) {
          throw new Error("wait requires a previous find step or a 'for' target object");
        }

        await this.browser.waitForElement(currentElement, step.wait.timeoutMs);
        continue;
      }

      if ("extract" in step) {
        const definition = adapter.objects[step.extract.object];
        if (!definition) {
          throw new Error(`Unknown extract object: ${step.extract.object}`);
        }
        const element = await this.browser.find(definition.locator.strategies);
        output[step.extract.as] = await this.browser.extract(element);
      }
    }

    const currentUrl = await this.browser.getCurrentUrl();
    if (!isAllowedDomain(currentUrl, adapter.site.domains)) {
      throw new Error(`Execution ended on blocked domain: ${currentUrl}`);
    }

    return output;
  }
}
