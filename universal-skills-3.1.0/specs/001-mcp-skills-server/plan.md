# Implementation Plan: MCP Skills Server

**Branch**: `001-mcp-skills-server` | **Date**: 2025-11-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-mcp-skills-server/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a TypeScript MCP server that discovers and loads skill markdown files from a prioritized directory structure. The server exposes a single `skill` tool via stdio protocol, scanning four directories (`./.agent/skills/`, `~/.agent/skills/`, `./.claude/skills/`, `~/.claude/skills/`) with priority-based resolution. Skills are cached and refreshed every 30 seconds, supporting case-insensitive name matching and requiring both `name` and `description` fields in YAML frontmatter.

## Technical Context

**Language/Version**: TypeScript 5.7.2 with Node.js 18+ (ES2022 target)
**Primary Dependencies**:
- `@modelcontextprotocol/sdk` ^1.6.1 (MCP TypeScript SDK)
- `zod` ^3.23.8 (Runtime schema validation)
- `gray-matter` ^4.0.3 (YAML frontmatter parsing)
- `axios` ^1.7.9 (Future HTTP requests if needed)

**Storage**: Filesystem-based (markdown files in skill directories)
**Testing**: No tests required (per constitution - test-optional)
**Target Platform**: Node.js 18+ on macOS/Linux/Windows
**Project Type**: Single npm package (MCP server)
**Performance Goals**:
- <1s for skill discovery/refresh across all directories
- <100ms for individual skill load
- 30-second background refresh cycle

**Constraints**:
- Stdio protocol only (no HTTP/network)
- No authentication required
- Must resolve home directory (`~`) reliably
- Must handle missing directories gracefully

**Scale/Scope**:
- Support 10-100 skills across all directories
- Skill files typically <100KB each
- Single AI agent client per server instance

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. MCP Server Architecture ✅ PASS

- ✅ Packaged as npm package with clear dependencies in package.json
- ✅ Standalone, self-contained MCP server
- ✅ Exposes functionality via MCP server protocol (single `skill` tool)
- ✅ Clear tool interface following MCP specification
- ✅ No circular dependencies (single package)

**Compliance**: Fully aligned with MCP Server Architecture principle.

### II. Stdio Protocol Compliance ✅ PASS

- ✅ Exclusive stdio communication (stdin for JSON-RPC input, stdout for responses)
- ✅ Diagnostic messages via stderr
- ✅ No network ports or HTTP servers
- ✅ MCP protocol handshake and capability negotiation support
- ✅ JSON-RPC specification conformance

**Compliance**: Fully aligned with Stdio Protocol Compliance principle.

### III. Documentation-First ✅ PASS

- ✅ README.md will include purpose, installation, and usage examples
- ✅ MCP tool definition with clear description and parameter schema
- ✅ Example interactions showing input/output patterns
- ✅ Version history in package.json
- ✅ Dependencies explicitly listed in package.json

**Compliance**: Fully aligned with Documentation-First principle.

### Quality Standards

**Semantic Versioning**: ✅ PASS
- Will follow MAJOR.MINOR.PATCH format in package.json
- MAJOR: Breaking changes to `skill` tool interface
- MINOR: New features (e.g., additional skill metadata)
- PATCH: Bug fixes and non-functional improvements

**Code Quality**: ✅ PASS
- TypeScript with ESM modules
- ESLint configured
- Error handling with appropriate JSON-RPC error responses
- Stderr for diagnostic output (never stdout)

**GATE STATUS**: ✅ ALL CHECKS PASS - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
universal-skills/           # Repository root
├── package.json            # npm package configuration
├── tsconfig.json           # TypeScript configuration
├── .eslintrc.json          # ESLint configuration
├── README.md               # Project documentation
├── CHANGELOG.md            # Version history
├── src/
│   ├── index.ts            # Main entry point, MCP server initialization
│   ├── types.ts            # TypeScript interfaces and types
│   ├── constants.ts        # Shared constants (SKILL_DIRS, REFRESH_INTERVAL)
│   ├── schemas.ts          # Zod validation schemas
│   ├── skill-scanner.ts    # Skill discovery and caching logic
│   ├── skill-loader.ts     # Individual skill loading and parsing
│   └── utils.ts            # Utility functions (path resolution, error handling)
└── dist/                   # Compiled JavaScript output (git-ignored)
    └── index.js            # Built entry point
```

**Structure Decision**: Single project structure selected. This is an npm package providing a single MCP server executable. No tests directory needed as testing is optional per constitution. All source code in `src/`, compiled output in `dist/`. The server will be invoked via `node dist/index.js` after building with `tsc`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations - this section is not applicable.
