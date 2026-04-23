# MCP Tool Contract: skill

**Tool Name**: `skill`
**Protocol**: MCP (Model Context Protocol)
**Transport**: stdio
**Version**: 1.0.0

## Overview

The `skill` tool loads and executes specialized skill markdown files from prioritized directory locations. It provides AI assistants access to domain-specific knowledge and workflows.

---

## Tool Definition

### Tool Metadata

```typescript
{
  name: "skill",
  title: "Load Skill",
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
}
```

### Input Schema (Zod)

```typescript
const SkillToolInputSchema = z.object({
  name: z.string()
    .min(1, "Skill name cannot be empty")
    .describe("Name of the skill to load (case-insensitive)")
}).strict();
```

### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Name of the skill to load (case-insensitive matching) |

**Validation Rules**:
- `name` must be non-empty string
- Case-insensitive matching (e.g., "Git" matches "git")
- Any characters allowed (spaces, special chars, unicode)

### Tool Description

The tool description is **dynamically generated** to include the list of available skills.

**Template**:
```
Execute a skill within the main conversation

<skills_instructions>
When users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively. Skills provide specialized capabilities and domain knowledge.

How to use skills:
- Invoke skills using this tool with the skill name only (no arguments)
- When you invoke a skill, you will see <command-message>The "{name}" skill is loading</command-message>
- The skill's prompt will expand and provide detailed instructions on how to complete the task
- Examples:
  - `command: "pdf"` - invoke the pdf skill
  - `command: "xlsx"` - invoke the xlsx skill
  - `command: "ms-office-suite:pdf"` - invoke using fully qualified name

Important:
- Only use skills listed in <available_skills> below
- Do not invoke a skill that is already running
- Do not use this tool for built-in CLI commands (like /help, /clear, etc.)
</skills_instructions>

<available_skills>
${dynamicSkillsList}
</available_skills>
```

**Dynamic Skills List Format**:
```xml
<skill>
<name>skill-name</name>
<description>skill description from frontmatter</description>
<location>project|global</location>
</skill>
```

---

## Response Format

### Success Response

When a skill is found and loaded successfully:

```typescript
{
  content: [{
    type: "text",
    text: `Loading: ${skillName}
Base directory: ${skillBaseDirectory}

${skillMarkdownContent}`
  }]
}
```

**Example**:
```
Loading: git
Base directory: /Users/nico/git/universal-skills/.claude/skills/git

---
name: git
description: Git deployment workflow skill
---

# Git Deployment GitOps

## Overview

Manage commits and merge requests...
```

### Error Response

When a skill is not found:

```typescript
{
  content: [{
    type: "text",
    text: `Skill '${requestedName}' not found.

Available skills:
- git: Git deployment workflow skill
- mcp-builder: MCP server development guide
- postgres: PostgreSQL database operations

Use the exact skill name (case-insensitive) to load a skill.`
  }]
}
```

---

## Behavior Specifications

### 1. Skill Discovery

**Priority Order** (first match wins):
1. `./.agent/skills/` (project universal)
2. `~/.agent/skills/` (global universal)
3. `./.claude/skills/` (project Claude-specific)
4. `~/.claude/skills/` (global Claude-specific)

**Directory Structure**:
```
.agent/skills/
├── git/
│   └── SKILL.md
└── mcp-builder/
    └── SKILL.md
```

### 2. Case-Insensitive Matching

- "Git" matches "git"
- "MCP-Builder" matches "mcp-builder"
- "POSTGRES" matches "postgres"

**Implementation**: Normalize to lowercase for lookup

### 3. Required Frontmatter Fields

Skills MUST have both fields in YAML frontmatter:
- `name`: Skill identifier
- `description`: Brief description

**Skip Behavior**:
- Skills missing either field are skipped during scanning
- Logged to stderr but don't cause errors

### 4. Refresh Cycle

- Skills are scanned at server startup
- Automatically refreshed every 30 seconds
- New skills appear after next refresh cycle
- Deleted skills removed after next refresh cycle

### 5. Error Handling

**Missing Skill**:
- Return error message with list of available skills
- Suggest checking skill name spelling

**Malformed Frontmatter**:
- Skip skill during scanning
- Log warning to stderr
- Don't break server

**Missing Directory**:
- Skip directory silently
- Continue scanning remaining directories

**Permission Errors**:
- Skip inaccessible files/directories
- Log error to stderr

---

## Examples

### Example 1: Load git skill

**Request**:
```json
{
  "name": "skill",
  "arguments": {
    "name": "git"
  }
}
```

**Response**:
```json
{
  "content": [{
    "type": "text",
    "text": "Loading: git\nBase directory: /Users/nico/.claude/skills/git\n\n---\nname: git\n...\n"
  }]
}
```

### Example 2: Case-insensitive lookup

**Request**:
```json
{
  "name": "skill",
  "arguments": {
    "name": "MCP-Builder"
  }
}
```

**Response**: ✅ Successfully loads "mcp-builder" skill

### Example 3: Skill not found

**Request**:
```json
{
  "name": "skill",
  "arguments": {
    "name": "nonexistent"
  }
}
```

**Response**:
```json
{
  "content": [{
    "type": "text",
    "text": "Skill 'nonexistent' not found.\n\nAvailable skills:\n- git: Git workflow\n- mcp-builder: MCP development\n..."
  }]
}
```

---

## Performance Guarantees

- **Lookup Time**: <100ms per tool invocation
- **Discovery Time**: <1 second for initial scan
- **Refresh Time**: <1 second for 30s refresh cycle
- **Memory**: <10MB for typical skill count (<100 skills)

---

## Protocol Compliance

### MCP JSON-RPC Format

**Tool Invocation Request**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "skill",
    "arguments": {
      "name": "git"
    }
  }
}
```

**Tool Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [{
      "type": "text",
      "text": "Loading: git\n..."
    }]
  }
}
```

---

## Security Considerations

### Input Validation

- ✅ Validate `name` parameter is non-empty string
- ✅ Sanitize file paths to prevent directory traversal
- ✅ Restrict access to predefined skill directories only

### No Authentication

- ❌ No authentication required (per specification)
- ❌ No authorization checks
- ✅ Read-only operations only (safe)

### Path Traversal Prevention

```typescript
// Disallow:
name: "../../../etc/passwd"
name: ".ssh/id_rsa"

// Implementation:
// Only search in predefined directories
// Don't accept path separators in skill names
```

---

## Testing Scenarios

1. **Load existing skill**: ✅ Returns skill content
2. **Case-insensitive match**: ✅ "Git" finds "git"
3. **Skill not found**: ✅ Returns error with available skills
4. **Empty name**: ❌ Validation error
5. **Priority resolution**: ✅ Project skill overrides global
6. **Refresh detection**: ✅ New skill appears after 30s
7. **Missing directory**: ✅ Continues without error
8. **Malformed frontmatter**: ✅ Skips skill, logs warning
9. **Missing required field**: ✅ Skips skill
10. **Permission denied**: ✅ Skips skill, logs error

---

## Changelog

### Version 1.0.0 (2025-11-02)
- Initial tool specification
- Single `skill` tool with name parameter
- 30-second refresh cycle
- Case-insensitive matching
- Priority-based directory scanning
