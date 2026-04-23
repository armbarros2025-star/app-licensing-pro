# Research: MCP Skills Server

**Date**: 2025-11-02
**Feature**: 001-mcp-skills-server

## Overview

This document captures research findings and technical decisions for implementing the MCP Skills Server in TypeScript.

---

## 1. MCP Protocol & TypeScript SDK

### Decision: Use @modelcontextprotocol/sdk v1.6.1+

**Rationale**:
- Official TypeScript SDK provides McpServer class and StdioServerTransport
- Built-in support for tool registration with `registerTool` method
- Type-safe integration with Zod schemas for input validation
- Handles JSON-RPC protocol compliance automatically
- Active maintenance and documentation

**Key Implementation Patterns**:
```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "skills-mcp-server",
  version: "1.0.0"
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

**Alternatives Considered**:
- Custom JSON-RPC implementation: Rejected due to protocol complexity and maintenance burden
- Python FastMCP: Rejected as TypeScript selected per user requirement

---

## 2. YAML Frontmatter Parsing

### Decision: Use gray-matter v4.0.3

**Rationale**:
- Industry-standard library for parsing YAML frontmatter from markdown
- Robust handling of edge cases (missing frontmatter, malformed YAML)
- Simple API: `matter(fileContent)` returns `{ data, content }`
- Type-safe with TypeScript
- Minimal dependencies

**Implementation Pattern**:
```typescript
import matter from "gray-matter";

const fileContent = await fs.readFile(skillPath, "utf-8");
const { data, content } = matter(fileContent);

// Validate required fields
if (!data.name || !data.description) {
  // Skip this skill
}
```

**Alternatives Considered**:
- js-yaml + manual parsing: Rejected due to increased complexity
- Custom regex parser: Rejected due to fragility and edge case handling

---

## 3. File System Operations

### Decision: Use Node.js fs/promises API

**Rationale**:
- Native Node.js API (no external dependencies)
- Modern async/await support via `fs/promises`
- Cross-platform compatibility (Windows, macOS, Linux)
- Efficient for our use case (<100 skills, small files)

**Key Operations**:
- `fs.readdir()`: List skill directories
- `fs.readFile()`: Load SKILL.md content
- `fs.stat()`: Check if path exists
- `fs.access()`: Verify read permissions

**Home Directory Resolution**:
```typescript
import os from "os";
import path from "path";

const homeDir = os.homedir();
const globalSkillsPath = path.join(homeDir, ".agent", "skills");
```

**Alternatives Considered**:
- chokidar (file watching): Rejected in favor of 30s polling (simpler, meets requirements)
- glob patterns: Rejected as we need specific directory structure

---

## 4. Background Refresh Strategy

### Decision: setInterval with 30-second polling

**Rationale**:
- Simpler than file system watching
- Meets 30-second refresh requirement from clarifications
- Lower resource usage for occasional changes
- Cross-platform compatibility
- Easy error handling and recovery

**Implementation Pattern**:
```typescript
const REFRESH_INTERVAL_MS = 30_000; // 30 seconds

setInterval(async () => {
  try {
    await scanAndCacheSkills();
    console.error("Skills refreshed successfully");
  } catch (error) {
    console.error("Error refreshing skills:", error);
  }
}, REFRESH_INTERVAL_MS);
```

**Alternatives Considered**:
- chokidar file watching: Rejected due to complexity, platform-specific quirks
- On-demand refresh: Rejected as it doesn't meet 30s automatic refresh requirement

---

## 5. Caching Strategy

### Decision: In-memory Map with periodic refresh

**Rationale**:
- Fast lookups: O(1) access by skill name
- Simple implementation
- Automatically handles additions/removals during refresh
- No persistence needed (ephemeral cache)
- Case-insensitive lookup via normalized keys

**Data Structure**:
```typescript
interface Skill {
  name: string;              // Original name from frontmatter
  description: string;       // From frontmatter
  baseDirectory: string;     // Full path to skill directory
  content: string;           // Full markdown content
  lastLoaded: Date;          // Timestamp for debugging
}

const skillCache = new Map<string, Skill>(); // key = name.toLowerCase()
```

**Cache Invalidation**:
- Full rescan every 30 seconds
- Replaces entire cache with fresh scan
- Handles additions, updates, and deletions automatically

**Alternatives Considered**:
- LRU cache: Rejected as unnecessary for <100 skills
- File-based cache: Rejected as skills change infrequently
- Incremental updates: Rejected for simplicity (full rescan is fast enough)

---

## 6. Error Handling Strategy

### Decision: Graceful degradation with clear error messages

**Rationale**:
- Missing directories: Skip silently, log to stderr
- Malformed frontmatter: Skip skill, log warning
- Missing required fields: Skip skill, log warning
- Read permission errors: Skip skill, log error
- Tool invocation errors: Return helpful error to client

**Error Message Format** (per MCP best practices):
```typescript
// Missing skill
"Skill '{name}' not found. Available skills: {list}"

// Malformed frontmatter
"Skill at {path} has malformed YAML frontmatter"

// Missing required field
"Skill at {path} missing required field: {field}"
```

**Alternatives Considered**:
- Strict error propagation: Rejected as it would break server on single bad skill
- Silent failures: Rejected as it provides no debugging information

---

## 7. Tool Design

### Decision: Single "skill" tool with name parameter

**Rationale**:
- Simplest interface for AI agents
- Matches user requirement exactly
- Tool description dynamically updated with available skills
- Case-insensitive name matching for better UX

**Tool Definition**:
```typescript
const SkillInputSchema = z.object({
  name: z.string()
    .min(1, "Skill name cannot be empty")
    .describe("Name of the skill to load (case-insensitive)")
}).strict();

server.registerTool(
  "skill",
  {
    title: "Load Skill",
    description: `Execute a skill within the main conversation...

Available skills:
${availableSkillsList}`,
    inputSchema: SkillInputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  async (params) => {
    // Load and return skill content
  }
);
```

**Alternatives Considered**:
- Multiple tools (one per skill): Rejected due to dynamic skill addition/removal
- List + Load pattern: Rejected as single tool is simpler

---

## 8. TypeScript Configuration

### Decision: Strict TypeScript with ES2022 target

**Rationale**:
- Strict mode catches more errors at compile time
- ES2022 provides modern JavaScript features
- Node16 module resolution for proper ESM support
- Matches MCP SDK requirements

**Key tsconfig.json settings**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

**Alternatives Considered**:
- Loose TypeScript: Rejected due to quality standards
- CommonJS: Rejected in favor of ESM (modern standard)

---

## 9. Skill Directory Structure

### Decision: Each skill is a directory with SKILL.md file

**Rationale**:
- Matches user's example structure
- Allows for future expansion (additional files per skill)
- Clear namespace per skill
- Base directory path is meaningful to return

**Directory Pattern**:
```
.agent/skills/
├── git/
│   └── SKILL.md
├── mcp-builder/
│   └── SKILL.md
└── postgres/
    └── SKILL.md
```

**Alternatives Considered**:
- Flat markdown files: Rejected as it doesn't match user's example
- Nested subdirectories: Rejected for simplicity

---

## 10. Priority Resolution

### Decision: First-match wins from priority list

**Rationale**:
- Clear, predictable behavior
- Matches user's priority specification
- Simple to implement and explain
- Fast lookup (stop at first match)

**Priority Order**:
1. `./.agent/skills/` (project universal)
2. `~/.agent/skills/` (global universal)
3. `./.claude/skills/` (project Claude-specific)
4. `~/.claude/skills/` (global Claude-specific)

**Implementation**:
```typescript
const SKILL_DIRS = [
  "./.agent/skills",
  "~/.agent/skills",
  "./.claude/skills",
  "~/.claude/skills"
];

// Scan in order, first match wins
for (const dir of SKILL_DIRS) {
  const skillPath = path.join(dir, skillName, "SKILL.md");
  if (await exists(skillPath)) {
    return await loadSkill(skillPath);
  }
}
```

**Alternatives Considered**:
- Merge conflicts: Rejected as spec clearly states priority wins
- Load all and present options: Rejected for simplicity

---

## Summary

All technical decisions align with:
- MCP best practices (stdio, tool annotations, error handling)
- TypeScript MCP SDK patterns
- Constitution requirements (npm package, stdio protocol, documentation)
- Specification requirements (30s refresh, case-insensitive, priority order)

No unresolved technical questions remain. Ready to proceed to Phase 1 (Design & Contracts).
