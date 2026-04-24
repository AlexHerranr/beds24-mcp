# Security Policy

## Reporting a Vulnerability

Report security issues privately by email: **administrador@tealquilamos.com**.

Do not open a public GitHub issue for security reports.

Include: description, reproduction steps, affected version or commit, relevant logs (scrub any tokens).

You can expect an acknowledgement within 72 hours and a status update within 7 days.

## Scope

In scope:

- Leakage of Beds24 tokens through logs, errors, or tool outputs.
- Tool-arg injection that lets the LLM perform operations outside its intended scope.
- Bypass of the `destructiveHint` guardrail on write tools.
- IPC or transport misuse.

Out of scope:

- Vulnerabilities in Beds24's own API — report to Beds24.
- Vulnerabilities in the MCP SDK — report to Anthropic upstream.

## Supported Versions

Only the latest minor version receives security fixes during the `0.x` phase. After `1.0`, the two latest minor versions will be supported.

## Token handling

This project never logs raw token values. Refresh tokens live in memory during the server's lifetime and are read from environment variables, never persisted to disk by this code.
