<!--
SYNC IMPACT REPORT - 2025-11-02

VERSION CHANGE: None → 1.0.0 (Initial constitution)

RATIONALE: MINOR version bump - Initial constitution establishing core governance framework

MODIFIED PRINCIPLES:
- [NEW] I. MCP Server Architecture
- [NEW] II. Stdio Protocol Compliance
- [NEW] III. Documentation-First

ADDED SECTIONS:
- Core Principles (3 principles)
- Quality Standards
- Governance

REMOVED SECTIONS: None

TEMPLATES STATUS:
✅ plan-template.md - Reviewed, constitution check section compatible
✅ spec-template.md - Reviewed, requirements alignment compatible
✅ tasks-template.md - Reviewed, task structure compatible
✅ checklist-template.md - Reviewed, compatible
✅ agent-file-template.md - Reviewed, compatible

FOLLOW-UP TODOS: None
-->

# Universal Skills Constitution

## Core Principles

### I. MCP Server Architecture

Every skill MUST be packaged as an npm package that bundles an MCP (Model Context Protocol) server.

- Each skill is a standalone, independently installable npm package
- Skills expose functionality via MCP server protocol
- Skills MUST be self-contained with clear dependencies declared in package.json
- Skills MUST define clear tool interfaces following MCP specification
- No circular dependencies between skills

**Rationale**: MCP server architecture ensures skills are portable, composable, and can be used across different AI assistants and platforms. The npm packaging model provides established dependency management and versioning.

### II. Stdio Protocol Compliance

All MCP servers MUST communicate exclusively via stdio (standard input/output).

- Input: JSON-RPC messages via stdin
- Output: JSON-RPC responses via stdout
- Errors: Diagnostic messages via stderr
- No network ports, HTTP servers, or alternative protocols
- Support for MCP protocol handshake and capability negotiation
- Messages MUST conform to MCP JSON-RPC specification

**Rationale**: Stdio provides a universal, secure, and simple inter-process communication mechanism. It eliminates port conflicts, simplifies deployment, enables local-first operation, and ensures compatibility with Claude Code and other MCP clients.

### III. Documentation-First

Every skill MUST include comprehensive documentation before implementation begins.

- README.md with purpose, installation, and usage examples
- MCP tool definitions with clear descriptions and parameter schemas
- Example interactions showing input/output patterns
- Version history and breaking changes documented
- Dependencies and system requirements explicitly listed

**Rationale**: Documentation-first ensures skills are understandable, maintainable, and usable. Clear documentation reduces integration friction and enables others to adopt skills confidently.

## Quality Standards

### Semantic Versioning

- Version format: MAJOR.MINOR.PATCH
- MAJOR: Breaking changes to MCP tool interfaces or protocol compliance
- MINOR: New tools added, backward-compatible enhancements
- PATCH: Bug fixes, documentation updates, non-functional improvements
- Version MUST be updated in package.json for every release
- Breaking changes MUST include migration guide in CHANGELOG.md

### Code Quality

- TypeScript or JavaScript (ESM modules preferred)
- Linting configured (ESLint recommended)
- Error handling: All MCP tools MUST handle errors gracefully and return appropriate JSON-RPC error responses
- Logging: Use stderr for diagnostic output, never pollute stdout

## Governance

### Amendment Process

1. Proposed changes to this constitution MUST be documented in a GitHub issue or PR
2. Changes require clear rationale and impact analysis
3. Version bump following semantic versioning rules
4. Update `LAST_AMENDED_DATE` to current date
5. All dependent templates reviewed for consistency

### Compliance

- All specifications (spec.md) MUST verify alignment with constitution principles
- All implementation plans (plan.md) MUST include Constitution Check section
- Complexity or principle violations MUST be explicitly justified in plan.md
- Code reviews MUST verify MCP protocol compliance and stdio adherence

### Versioning

This constitution follows semantic versioning. Changes trigger template updates to maintain consistency across the `.specify/` framework.

**Version**: 1.0.0 | **Ratified**: 2025-11-02 | **Last Amended**: 2025-11-02
