# Data Model: Skill Input Schema Alignment

**Feature**: 002-dynamic-skill-schema
**Date**: 2025-11-03

## Overview

This feature modifies only the input validation schema for the skill tool. No changes to the underlying data structures or entities.

## Schema Changes

### SkillToolInput (Modified)

**Location**: `src/schemas.ts`

**Current Definition**:
```typescript
export const SkillToolInputSchema = z
  .object({
    name: z
      .string()
      .min(1, "Skill name cannot be empty")
      .describe("Name of the skill to load (case-insensitive)"),
  })
  .strict();

export type SkillToolInput = z.infer<typeof SkillToolInputSchema>;
```

**Updated Definition**:
```typescript
export const SkillToolInputSchema = z
  .object({
    command: z
      .string()
      .min(1, "Skill name cannot be empty")
      .describe("The skill name (no arguments). E.g., \"pdf\" or \"xlsx\""),
  })
  .strict();

export type SkillToolInput = z.infer<typeof SkillToolInputSchema>;
```

**Changes**:
- Property name: `name` → `command`
- Description: Updated to match target schema format with examples

**Validation Rules** (unchanged):
- Type: string
- Min length: 1 character
- Additional properties: Not allowed (`.strict()`)
- Case sensitivity: Case-insensitive matching (handled in lookup logic, not schema)

**TypeScript Type** (auto-updated):
```typescript
// Before
type SkillToolInput = {
  name: string;
}

// After
type SkillToolInput = {
  command: string;
}
```

## MCP Tool Schema

**Location**: `src/index.ts` (tool registration)

**Current JSON Schema**:
```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Name of the skill to load (case-insensitive)"
    }
  },
  "required": ["name"]
}
```

**Updated JSON Schema**:
```json
{
  "type": "object",
  "properties": {
    "command": {
      "type": "string",
      "description": "The skill name (no arguments). E.g., \"pdf\" or \"xlsx\""
    }
  },
  "required": ["command"]
}
```

**Changes**:
- Property name: `name` → `command`
- Description: Updated with examples
- Required array: `["name"]` → `["command"]`

## Unchanged Entities

The following data structures are **NOT modified** by this feature:

### Skill

**Location**: `src/types.ts`

```typescript
export interface Skill {
  name: string;
  description: string;
  content: string;
  location: SkillLocation;
  baseDirectory: string;
  filePath: string;
}
```

**Unchanged**: Skill entity remains identical

### SkillLocation

**Location**: `src/types.ts`

```typescript
export type SkillLocation = "project" | "global" | "user";
```

**Unchanged**: Location types remain identical

### SkillCache

**Location**: `src/skill-scanner.ts`

```typescript
export class SkillCache {
  private skills: Map<string, Skill>;

  get(name: string): Skill | undefined { ... }
  getAllSkills(): Skill[] { ... }
  // ... other methods
}
```

**Unchanged**: Cache implementation and methods remain identical. The `get()` method still accepts a skill name string (now passed as `command` instead of `name`).

## Data Flow

### Before (v1.x)

```
User/LLM Input
  { "name": "mcp-builder" }
       ↓
  Zod Validation (SkillToolInputSchema)
       ↓
  Extract: const { name } = validationResult.data
       ↓
  Lookup: skillCache.get(name)
       ↓
  Return: Skill content or error
```

### After (v2.x)

```
User/LLM Input
  { "command": "mcp-builder" }
       ↓
  Zod Validation (SkillToolInputSchema)
       ↓
  Extract: const { command } = validationResult.data
       ↓
  Lookup: skillCache.get(command)
       ↓
  Return: Skill content or error
```

**Key Difference**: Only the parameter name changes; the data flow and logic remain identical.

## Validation Error Messages

### Current Errors

1. **Missing Parameter**: `Required`
2. **Empty String**: `Skill name cannot be empty`
3. **Extra Properties**: `Unrecognized key(s) in object: 'extra'`
4. **Wrong Type**: `Expected string, received number`

### Updated Errors

1. **Missing Parameter**: `Required` (unchanged)
2. **Empty String**: `Skill name cannot be empty` (unchanged)
3. **Extra Properties**: `Unrecognized key(s) in object: 'extra'` (unchanged)
4. **Wrong Type**: `Expected string, received number` (unchanged)
5. **Old Parameter Used**: `Unrecognized key(s) in object: 'name'` (NEW - will trigger when old parameter is used)

## Migration Impact

### Code Changes Required

Only internal code in this repository needs updates:

1. `src/schemas.ts` - Update schema definition
2. `src/index.ts` - Update tool registration and variable destructuring
3. `src/index.ts` - Update examples in tool description

### Consumer Impact

External consumers using the skill tool must update their invocations:

**Before**:
```typescript
// MCP client code
await callTool("skill", { name: "mcp-builder" });
```

**After**:
```typescript
// MCP client code
await callTool("skill", { command: "mcp-builder" });
```

## Summary

This is a **schema-only change** with no impact to data structures, business logic, or storage. The implementation is a straightforward parameter rename with updated description text. All validation rules and error handling remain identical.
