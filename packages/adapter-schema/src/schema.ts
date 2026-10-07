export const adapterJsonSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  additionalProperties: false,
  required: ["id", "name", "version", "site", "objects", "actions"],
  properties: {
    id: { type: "string", minLength: 1 },
    name: { type: "string", minLength: 1 },
    version: { type: "string", pattern: "^[0-9]+\\.[0-9]+\\.[0-9]+$" },
    author: { type: "string" },
    license: { type: "string" },
    permissions: {
      type: "array",
      items: { enum: ["read", "write", "sensitive", "destructive"] }
    },
    risk: { enum: ["read", "write", "sensitive", "destructive"] },
    approval: { enum: ["required", "none"] },
    site: {
      type: "object",
      additionalProperties: false,
      required: ["domains"],
      properties: {
        domains: {
          type: "array",
          minItems: 1,
          items: { type: "string", minLength: 1 }
        }
      }
    },
    objects: {
      type: "object",
      minProperties: 1,
      additionalProperties: {
        type: "object",
        additionalProperties: false,
        required: ["locator"],
        properties: {
          locator: {
            type: "object",
            additionalProperties: false,
            required: ["strategies"],
            properties: {
              strategies: {
                type: "array",
                minItems: 1,
                items: {
                  type: "object",
                  minProperties: 1,
                  additionalProperties: false,
                  properties: {
                    role: {
                      type: "object",
                      additionalProperties: false,
                      required: ["role"],
                      properties: {
                        role: { type: "string" },
                        name: { type: "string" }
                      }
                    },
                    label: { type: "string" },
                    placeholder: { type: "string" },
                    text: { type: "string" },
                    semantic: { type: "string" },
                    css: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    actions: {
      type: "object",
      minProperties: 1,
      additionalProperties: {
        type: "object",
        additionalProperties: false,
        required: ["description", "steps", "input"],
        properties: {
          description: { type: "string" },
          input: { type: "object" },
          output: { type: "object" },
          steps: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              minProperties: 1,
              maxProperties: 1,
              additionalProperties: false,
              properties: {
                navigate: {
                  type: "object",
                  additionalProperties: false,
                  required: ["url"],
                  properties: {
                    url: { type: "string", minLength: 1 }
                  }
                },
                find: { type: "string" },
                click: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    object: { type: "string" }
                  }
                },
                fill: {
                  type: "object",
                  additionalProperties: false,
                  required: ["value"],
                  properties: {
                    value: { type: "string" }
                  }
                },
                press: {
                  type: "object",
                  additionalProperties: false,
                  required: ["key"],
                  properties: {
                    key: { type: "string" }
                  }
                },
                wait: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    for: { type: "string" },
                    timeoutMs: { type: "number", minimum: 1 }
                  }
                },
                extract: {
                  type: "object",
                  additionalProperties: false,
                  required: ["object", "as"],
                  properties: {
                    object: { type: "string" },
                    as: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
} as const;

export type AdapterDefinition = {
  id: string;
  name: string;
  version: string;
  author?: string;
  license?: string;
  permissions?: Array<"read" | "write" | "sensitive" | "destructive">;
  risk?: "read" | "write" | "sensitive" | "destructive";
  approval?: "required" | "none";
  site: { domains: string[] };
  objects: Record<
    string,
    {
      locator: {
        strategies: Array<{
          role?: { role: string; name?: string };
          label?: string;
          placeholder?: string;
          text?: string;
          semantic?: string;
          css?: string;
        }>;
      };
    }
  >;
  actions: Record<
    string,
    {
      description: string;
      input: Record<string, unknown>;
      output?: Record<string, unknown>;
      steps: Array<
        | { navigate: { url: string } }
        | { find: string }
        | { click: { object?: string } }
        | { fill: { value: string } }
        | { press: { key: string } }
        | { wait: { for?: string; timeoutMs?: number } }
        | { extract: { object: string; as: string } }
      >;
    }
  >;
};
