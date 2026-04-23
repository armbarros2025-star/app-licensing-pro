# Quickstart: Skill Input Schema Alignment

**Feature**: 002-dynamic-skill-schema
**Estimated Implementation Time**: < 1 hour

## Overview

Rename the MCP skill tool's input parameter from `name` to `command` and update its description to match the target schema format.

## What's Changing

**Parameter Rename**: `name` → `command`

**Before (v1.x)**:
```json
{
  "name": "mcp-builder"
}
```

**After (v2.x)**:
```json
{
  "command": "mcp-builder"
}
```

**Description Update**:
- Old: "Name of the skill to load (case-insensitive)"
- New: "The skill name (no arguments). E.g., \"pdf\" or \"xlsx\""

## Implementation Steps

### Step 1: Update Zod Schema

**File**: `src/schemas.ts` (lines 10-17)

```typescript
// BEFORE
export const SkillToolInputSchema = z
  .object({
    name: z
      .string()
      .min(1, "Skill name cannot be empty")
      .describe("Name of the skill to load (case-insensitive)"),
  })
  .strict();

// AFTER
export const SkillToolInputSchema = z
  .object({
    command: z
      .string()
      .min(1, "Skill name cannot be empty")
      .describe("The skill name (no arguments). E.g., \"pdf\" or \"xlsx\""),
  })
  .strict();
```

**Changes**:
- Line 12: `name:` → `command:`
- Line 15: Update description

### Step 2: Update Tool Registration

**File**: `src/index.ts` (lines 96-104)

```typescript
// BEFORE
{
  name: "skill",
  description: generateToolDescription(),
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name of the skill to load (case-insensitive)",
      },
    },
    required: ["name"],
  },
}

// AFTER
{
  name: "skill",
  description: generateToolDescription(),
  inputSchema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "The skill name (no arguments). E.g., \"pdf\" or \"xlsx\"",
      },
    },
    required: ["command"],
  },
}
```

**Changes**:
- Line 98: `name:` → `command:`
- Line 100: Update description
- Line 103: `["name"]` → `["command"]`

### Step 3: Update Variable Destructuring

**File**: `src/index.ts` (line 121)

```typescript
// BEFORE
const { name } = validationResult.data;
const skill = skillCache.get(name);

// AFTER
const { command } = validationResult.data;
const skill = skillCache.get(command);
```

**Changes**:
- Line 121: `{ name }` → `{ command }`
- Line 124: `skillCache.get(name)` → `skillCache.get(command)`

### Step 4: Update Tool Description Examples

**File**: `src/index.ts` (lines 50-52)

```typescript
// BEFORE
- Examples:
  - name: "pdf" - invoke the pdf skill
  - name: "xlsx" - invoke the xlsx skill
  - name: "ms-office-suite:pdf" - invoke using fully qualified name

// AFTER
- Examples:
  - command: "pdf" - invoke the pdf skill
  - command: "xlsx" - invoke the xlsx skill
  - command: "ms-office-suite:pdf" - invoke using fully qualified name
```

**Changes**:
- Line 50: `name:` → `command:` (3 occurrences)

### Step 5: Update README.md

**File**: `README.md`

1. Find all examples using `{"name": "..."}` format
2. Replace with `{"command": "..."}`
3. Update any explanatory text referencing the "name" parameter
4. Add note about breaking change in v2.0.0

**Example Section to Update**:
```markdown
## Usage

Invoke a skill using the MCP tool:

<!-- BEFORE -->
{
  "name": "mcp-builder"
}

<!-- AFTER -->
{
  "command": "mcp-builder"
}
```

### Step 6: Create CHANGELOG.md

**File**: `CHANGELOG.md` (create if doesn't exist)

```markdown
# Changelog

All notable changes to this project will be documented in this file.

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

## [1.0.0] - [Previous Date]

[Previous changelog entries...]
```

### Step 7: Update package.json Version

**File**: `package.json` (line 3)

```json
// BEFORE
{
  "version": "1.0.0",
  ...
}

// AFTER
{
  "version": "2.0.0",
  ...
}
```

## Testing Checklist

### Build & Type Check

```bash
npm run build
```

✅ Should compile without errors

### Manual Testing with MCP Inspector

1. Start the MCP server:
   ```bash
   npm start
   ```

2. Connect MCP inspector to the server

3. Inspect the "skill" tool schema:
   - ✅ Verify parameter named `command` (not `name`)
   - ✅ Verify description: "The skill name (no arguments). E.g., \"pdf\" or \"xlsx\""
   - ✅ Verify required array includes `["command"]`

4. Test with new parameter:
   ```json
   { "command": "test" }
   ```
   - ✅ Should succeed (if "test" skill exists) or show skill not found

5. Test with old parameter:
   ```json
   { "name": "test" }
   ```
   - ✅ Should fail with: "Unrecognized key(s) in object: 'name'"

6. Test with extra properties:
   ```json
   { "command": "test", "extra": "value" }
   ```
   - ✅ Should fail with: "Unrecognized key(s) in object: 'extra'"

### Verification

- ✅ All TypeScript compilation errors resolved
- ✅ Tool schema matches target format
- ✅ Old parameter rejected with clear error
- ✅ New parameter works correctly
- ✅ README.md updated
- ✅ CHANGELOG.md created/updated
- ✅ package.json version bumped to 2.0.0

## Common Issues

### Issue 1: Forgot to Update Tool Description Examples

**Symptom**: Tool description still shows `name:` in examples

**Fix**: Update lines 50-52 in `src/index.ts`

### Issue 2: TypeScript Errors After Change

**Symptom**: `Property 'name' does not exist on type...`

**Fix**: Check all locations where the parameter is used:
- Schema definition (schemas.ts)
- Tool registration (index.ts)
- Variable destructuring (index.ts)
- Type definitions (if any manual types exist)

### Issue 3: Validation Still Accepts Old Parameter

**Symptom**: `{"name": "..."}` doesn't fail

**Fix**: Verify Zod schema has `.strict()` and uses `command` not `name`

## Rollback Plan

If issues arise after deployment:

1. Revert the commit containing these changes
2. Publish v1.0.1 (patch version)
3. Investigate issues before re-attempting v2.0.0

## Next Steps

After implementation:

1. Run `/speckit.tasks` to generate detailed task breakdown
2. Execute tasks in order
3. Test thoroughly with MCP inspector
4. Commit changes with message: "feat!: rename skill tool parameter from name to command"
5. Tag release: `git tag v2.0.0`
6. Push to remote: `git push && git push --tags`
7. Publish to npm: `npm publish`
