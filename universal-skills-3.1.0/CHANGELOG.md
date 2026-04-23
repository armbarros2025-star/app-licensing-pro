# Changelog

All notable changes to the Universal Skills MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-11-03

### Breaking Changes

#### Skill Tool Parameter Renamed

The skill tool input parameter has been renamed from `name` to `command` to align with target schema format.

**Migration Required**:

```typescript
// Before (v1.x) - will no longer work
await callTool("skill", { name: "mcp-builder" });

// After (v2.x) - required format
await callTool("skill", { command: "mcp-builder" });
```

**Error Message**: If you use the old `name` parameter, you'll receive:
```
Unrecognized key(s) in object: 'name'
```

### Changed

- Updated skill tool parameter from `name` to `command`
- Updated parameter description to: "The skill name (no arguments). E.g., \"pdf\" or \"xlsx\""
- Updated tool description examples to use `command` instead of `name`

## [1.0.0] - 2025-11-02

### Added

- Initial release of Universal Skills MCP Server
- MCP `skill` tool for loading skill markdown files
- Automatic skill discovery from four prioritized directories:
  - `./.agent/skills/` (project universal)
  - `~/.agent/skills/` (global universal)
  - `./.claude/skills/` (project Claude-specific)
  - `~/.claude/skills/` (global Claude-specific)
- Case-insensitive skill name matching
- Priority-based skill resolution (project overrides global)
- 30-second automatic refresh cycle
- In-memory skill caching with `SkillCache` class
- Graceful error handling for:
  - Missing directories
  - Malformed YAML frontmatter
  - Missing required fields (name, description)
  - Permission errors
- Comprehensive logging to stderr
- TypeScript implementation with strict type checking
- Zod schema validation for tool inputs
- Stdio protocol compliance for MCP
- Tool annotations (readOnlyHint, idempotentHint, etc.)
- Dynamic tool description with available skills list
- Home directory resolution (`~`) support
- Detailed error messages with available skills list

### Technical Details

- **Language**: TypeScript 5.7.2
- **Runtime**: Node.js 18+
- **Protocol**: MCP via stdio
- **Dependencies**:
  - `@modelcontextprotocol/sdk` ^1.6.1
  - `zod` ^3.23.8
  - `gray-matter` ^4.0.3
- **Architecture**: Single npm package with modular TypeScript structure

### Performance

- Skill lookup: <100ms
- Initial scan: <1 second
- Refresh cycle: 30 seconds
- Memory usage: <10MB (for <100 skills)

### Documentation

- Comprehensive README with installation and usage instructions
- Inline TypeScript documentation
- Example skill structure
- Troubleshooting guide

### Testing

- Project follows constitution (test-optional)
- Manual testing scenarios documented in quickstart.md

---

## Versioning Strategy

- **MAJOR**: Breaking changes to `skill` tool interface or MCP protocol
- **MINOR**: New features (e.g., additional metadata, new tools)
- **PATCH**: Bug fixes, performance improvements, documentation updates
