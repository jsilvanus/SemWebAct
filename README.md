# SemWebAct

**Semantic actions for the Web.**

SemWebAct turns websites into safe semantic actions for AI agents, using native WebMCP when available and YAML adapters otherwise.

## Monorepo structure

- `apps/server`: MCP gateway, auth/session management, adapter registry hooks, web UI config
- `apps/browser-worker`: isolated browser execution layer
- `apps/studio`: SemWebAct Adapter Studio recorder/editor foundations
- `packages/semantic-actions`: implementation-agnostic semantic action model + registry
- `packages/adapter-schema`: formal JSON Schema + validation for YAML adapters
- `packages/adapter-runtime`: restricted YAML adapter executor (no arbitrary JS)
- `packages/webmcp`: WebMCP discovery/selection bridge
- `packages/recorder-protocol`: deterministic recording package model
- `adapters/example`: example adapter and semantic test specs

## Safety defaults

- AI receives semantic tools only.
- Adapter YAML is treated as untrusted configuration.
- Adapter execution is domain-restricted.
- No arbitrary JS execution, no AI-provided selectors.
- Native WebMCP is preferred over adapter actions unless explicitly overridden.
