# Data Model: MCP Skills Server

**Date**: 2025-11-02
**Feature**: 001-mcp-skills-server

## Overview

This document defines the data structures and entities for the MCP Skills Server.

---

## Core Entities

### 1. Skill

Represents a discovered and parsed skill from the filesystem.

**TypeScript Interface**:

```typescript
interface Skill {
  // Metadata from frontmatter
  name: string; // Required: Skill name from frontmatter
  description: string; // Required: Skill description from frontmatter

  // File system info
  baseDirectory: string; // Absolute path to skill directory (e.g., "/path/to/.agent/skills/git")
  filePath: string; // Absolute path to SKILL.md file

  // Content
  content: string; // Full markdown content (including frontmatter)

  // Cache metadata
  lastLoaded: Date; // Timestamp when skill was last loaded
  source: SkillSource; // Which directory this skill came from
}
```

**Validation Rules**:

- `name`: Must be non-empty string (any characters allowed per clarification)
- `description`: Must be non-empty string
- Both `name` and `description` are required (skip skill if missing)
- `content`: Full file content as UTF-8 string
- `baseDirectory`: Must be absolute path
- `lastLoaded`: Set during scanning/refresh

**State Transitions**:

1. **Discovered** → Skill directory found during scan
2. **Loaded** → SKILL.md read and frontmatter parsed
3. **Validated** → Required fields (`name`, `description`) confirmed
4. **Cached** → Added to in-memory cache with normalized key
5. **Refreshed** → Updated during 30s refresh cycle
6. **Removed** → Deleted from cache if no longer on filesystem

---

### 2. SkillSource

Enum indicating which directory a skill was loaded from.

**TypeScript Enum**:

```typescript
enum SkillSource {
  PROJECT_UNIVERSAL = "./.agent/skills",
  GLOBAL_UNIVERSAL = "~/.agent/skills",
  PROJECT_CLAUDE = "./.claude/skills",
  GLOBAL_CLAUDE = "~/.claude/skills",
}
```

**Purpose**:

- Debugging: Know which directory provided the skill
- Priority tracking: Understand resolution order
- Logging: Include source in diagnostic messages

---

### 3. SkillFrontmatter

Represents the parsed YAML frontmatter from a SKILL.md file.

**TypeScript Interface**:

```typescript
interface SkillFrontmatter {
  name: string; // Required field
  description: string; // Required field
  [key: string]: unknown; // Allow additional fields (ignored for now)
}
```

**Parsing**:

- Uses `gray-matter` library
- Extract from markdown between `---` markers
- Validate required fields exist
- Additional fields are preserved but not used

---

### 4. SkillCache

In-memory cache storing all discovered skills.

**Data Structure**:

```typescript
class SkillCache {
  private cache: Map<string, Skill>; // key = skill.name.toLowerCase()

  set(skill: Skill): void;
  get(name: string): Skill | undefined; // Case-insensitive lookup
  has(name: string): boolean;
  delete(name: string): void;
  clear(): void;
  getAllSkills(): Skill[];
  size(): number;
}
```

**Key Operations**:

- **set(skill)**: Add/update skill with normalized key
- **get(name)**: Retrieve skill by name (case-insensitive)
- **has(name)**: Check if skill exists
- **getAllSkills()**: Return all cached skills (for listing)
- **clear()**: Remove all skills (before refresh)

**Key Normalization**:

```typescript
function normalizeSkillName(name: string): string {
  return name.toLowerCase().trim();
}
```

---

### 5. SkillToolInput

Zod schema for the `skill` tool input parameter.

**Zod Schema**:

```typescript
const SkillToolInputSchema = z
  .object({
    name: z
      .string()
      .min(1, "Skill name cannot be empty")
      .describe("Name of the skill to load (case-insensitive)"),
  })
  .strict();

type SkillToolInput = z.infer<typeof SkillToolInputSchema>;
```

**Validation**:

- `name` must be non-empty string
- `.strict()` prevents additional fields
- Runtime validation via Zod

---

### 6. SkillToolResponse

Structure returned when invoking the `skill` tool.

**Success Response**:

```typescript
{
  content: [
    {
      type: "text",
      text: `Loading: ${skill.name}
Base directory: ${skill.baseDirectory}

${skill.content}`,
    },
  ];
}
```

**Error Response**:

```typescript
{
  content: [
    {
      type: "text",
      text: `Skill '${requestedName}' not found.

Available skills:
- skill1 (description1)
- skill2 (description2)
...`,
    },
  ];
}
```

---

## Data Flow

### Skill Discovery Flow

```
1. Scan directories (in priority order)
   ↓
2. For each directory:
   - Check if directory exists
   - List subdirectories
   ↓
3. For each subdirectory:
   - Check for SKILL.md file
   - Read file content
   ↓
4. Parse frontmatter
   - Extract name & description
   - Validate required fields
   ↓
5. Create Skill object
   - Set metadata
   - Set timestamps
   ↓
6. Add to cache (normalized key)
   - Skip if duplicate (first wins)
   ↓
7. Return cached skills
```

### Skill Lookup Flow

```
1. Receive skill tool invocation
   ↓
2. Extract skill name parameter
   ↓
3. Normalize name (lowercase)
   ↓
4. Check cache.has(normalizedName)
   ↓
5. If found:
   - Return skill content
   Else:
   - Return error with available skills list
```

### Refresh Flow

```
1. Timer triggers (every 30s)
   ↓
2. Clear current cache
   ↓
3. Re-run skill discovery
   ↓
4. Populate cache with fresh skills
   ↓
5. Log refresh completion to stderr
```

---

## Relationships

```
SkillCache (1) ──contains──> (N) Skill
Skill (N) ──has──> (1) SkillSource
Skill (1) ──parsed from──> (1) SkillFrontmatter
SkillToolInput ──references──> Skill (by name)
```

---

## Validation Rules Summary

| Field               | Type        | Required | Validation                               |
| ------------------- | ----------- | -------- | ---------------------------------------- |
| Skill.name          | string      | Yes      | Non-empty, any characters allowed        |
| Skill.description   | string      | Yes      | Non-empty                                |
| Skill.baseDirectory | string      | Yes      | Absolute path                            |
| Skill.filePath      | string      | Yes      | Absolute path, must end with `/SKILL.md` |
| Skill.source        | SkillSource | Yes      | One of 4 enum values                     |

---

## Example Data

**Skill Object**:

```json
{
  "name": "git",
  "description": "Git deployment workflow skill",
  "baseDirectory": "/Users/nico/git/universal-skills/.claude/skills/git",
  "filePath": "/Users/nico/git/universal-skills/.claude/skills/git/SKILL.md",
  "content": "---\nname: git\ndescription: Git deployment...\n---\n\n# Content here",
  "lastLoaded": "2025-11-02T10:30:00.000Z",
  "source": "./.claude/skills"
}
```

**Cache State**:

```typescript
Map {
  "git" => Skill { name: "git", ... },
  "mcp-builder" => Skill { name: "mcp-builder", ... },
  "postgres" => Skill { name: "postgres", ... }
}
```

---

## Performance Considerations

- **Cache Size**: Max ~100 skills × ~100KB each = ~10MB memory (acceptable)
- **Lookup Time**: O(1) hash map lookup
- **Refresh Time**: Linear scan of ~4 directories × ~25 skills = ~100 file reads (~1s max)
- **Case-Insensitive**: Normalization happens once during caching (no performance impact on lookup)

---

## Future Extensions

Potential future enhancements (not in current scope):

1. **Skill Metadata**: Additional frontmatter fields (version, author, tags)
2. **Skill Dependencies**: Skills referencing other skills
3. **Skill Validation**: JSON schema validation for frontmatter
4. **Skill Statistics**: Track invocation counts, last used
5. **Skill Caching**: Persistent cache to speed up server restart
