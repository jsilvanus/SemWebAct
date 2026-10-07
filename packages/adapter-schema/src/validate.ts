import { Ajv2020, type ErrorObject } from "ajv/dist/2020.js";
import { adapterJsonSchema, type AdapterDefinition } from "./schema.js";

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validator = ajv.compile(adapterJsonSchema);

export class AdapterValidationError extends Error {
  constructor(public readonly details: string[]) {
    super(`Adapter validation failed: ${details.join("; ")}`);
  }
}

export function validateAdapter(candidate: unknown): AdapterDefinition {
  const ok = validator(candidate);
  if (!ok) {
    const details = (validator.errors ?? []).map(
      (error: ErrorObject) => `${error.instancePath || "/"} ${error.message}`,
    );
    throw new AdapterValidationError(details);
  }
  return candidate as AdapterDefinition;
}
