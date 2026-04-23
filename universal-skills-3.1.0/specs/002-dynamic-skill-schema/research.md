# Research: Skill Input Schema Alignment

**Feature**: 002-dynamic-skill-schema
**Date**: 2025-11-03
**Status**: Complete

## Decision Summary

**Core Change**: Rename input parameter from `name` to `command` and update description.

**Out of Scope**: Additional JSON Schema properties (`additionalProperties: false`, `$schema`) were removed from requirements to simplify implementation.

## Research Findings

### 1. Parameter Rename Approach

**Decision**: Straightforward property rename in two locations

**Rationale**:
- Zod schema in `src/schemas.ts` defines the validation
- MCP tool registration in `src/index.ts` declares the JSON Schema
- Both locations must be updated in sync
- TypeScript compiler will catch any missed references

**Implementation**:
- Update Zod schema: `name:` → `command:`
- Update tool inputSchema: `name:` → `command:`
- Update destructuring: `{ name }` → `{ command }`
- Update examples in tool description

### 2. Description Format

**Decision**: Use exact text from target schema

**Target Description**: "The skill name (no arguments). E.g., \"pdf\" or \"xlsx\""

**Current Description**: "Name of the skill to load (case-insensitive)"

**Changes Required**:
- More concise language
- Add examples (pdf, xlsx)
- Emphasize "no arguments" aspect
- Remove "case-insensitive" note (implementation detail)

**Rationale**: Matches the established pattern from the target schema and provides clear examples.

### 3. Validation Behavior

**Decision**: Keep existing Zod `.strict()` validation

**Current Approach**:
```typescript
export const SkillToolInputSchema = z
  .object({
    name: z.string().min(1, "Skill name cannot be empty")
  })
  .strict();
```

**Updated Approach**:
```typescript
export const SkillToolInputSchema = z
  .object({
    command: z.string().min(1, "Skill name cannot be empty")
  })
  .strict();
```

**Rationale**:
- `.strict()` already rejects additional properties
- Zod provides clear error messages
- No need to add `additionalProperties: false` manually to JSON Schema output
- Keeps validation logic in one place

### 4. Breaking Change Communication

**Decision**: Use semantic versioning and clear documentation

**Version Bump**: 1.0.0 → 2.0.0 (MAJOR)

**Documentation Updates**:
1. **README.md**: Update all examples to use `command` parameter
2. **CHANGELOG.md**: Add entry under "Breaking Changes" section
3. **Migration Guide**: Include in CHANGELOG with before/after examples

**Example Migration Guide**:
```markdown
## Breaking Changes in v2.0.0

### Parameter Rename: `name` → `command`

The skill tool input parameter has been renamed from `name` to `command`.

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

**Error Message**: If you use the old parameter, you'll see: "Unrecognized key(s) in object: 'name'"
```

**Rationale**: Semantic versioning clearly signals breaking change; migration guide reduces friction for consumers.

### 5. Testing Strategy

**Decision**: Focus on manual testing with MCP inspector

**Rationale**:
- No existing test infrastructure in codebase
- Adding test framework is out of scope for this change
- MCP inspector provides visual verification of schema
- TypeScript compiler catches type mismatches

**Testing Checklist**:
1. Build project: `npm run build`
2. Start server: `npm start`
3. Use MCP inspector to verify tool schema shows `command` parameter
4. Invoke tool with `{"command": "test"}` - should succeed
5. Invoke tool with `{"name": "test"}` - should fail with Zod error
6. Verify description text matches target exactly

## Alternatives Considered

### Alternative 1: Support Both Parameters

**Rejected Because**:
- Adds complexity to validation
- Delays inevitable migration
- Breaking change is acceptable for v2.0.0
- Clean cut is clearer than gradual deprecation

### Alternative 2: Add additionalProperties and $schema

**Rejected Because**:
- Unclear if MCP SDK supports these properties in inputSchema
- Zod `.strict()` already provides validation
- Adds complexity without clear user benefit
- Can be added later if needed

### Alternative 3: Keep Current Parameter Name

**Rejected Because**:
- User specifically requested alignment with target schema
- `command` is more semantically accurate (it's a command to load a skill)
- Matches established patterns in similar tools

## Implementation Notes

### Key Insights

1. **Simple Change**: Despite being a breaking change, the implementation is straightforward - just rename properties in 3-4 locations
2. **Type Safety**: TypeScript will catch any missed references during compilation
3. **Clear Errors**: Zod provides helpful error messages when validation fails
4. **Documentation Critical**: Clear migration guide is more important than code complexity

### Potential Issues

1. **Old Clients**: Existing code using `name` will break - acceptable for major version bump
2. **Documentation Sync**: Must update all examples in README consistently
3. **Tool Description Examples**: Don't forget to update the examples in the tool's description text (lines 50-52 in index.ts)

## Conclusion

Research phase complete. No blockers identified. Implementation is straightforward:

1. Update Zod schema (1 line)
2. Update tool registration (3 lines)
3. Update variable destructuring (1 line)
4. Update tool description examples (3 lines)
5. Update README.md (multiple locations)
6. Create CHANGELOG.md

Estimated effort: < 1 hour
