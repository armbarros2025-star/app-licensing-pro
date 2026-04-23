# Feature Specification: Skill Input Schema Alignment

**Feature Branch**: `002-dynamic-skill-schema`
**Created**: 2025-11-03
**Status**: Draft
**Input**: User description: "The mcp skill already works but I want the schema to be closer to this: {target schema}. The description already matches exactly. The problem is only that the input parameter is not called 'command' yet. Also the description of the command input should match. Also if possible add the additional properties false and the schema."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Rename Input Parameter to "command" (Priority: P1)

When the MCP skill tool is invoked, users provide the skill name using a parameter called `command` instead of `name`, matching the exact schema format from the target specification. This ensures API compatibility and consistency.

**Why this priority**: This is the core change requested - renaming the input parameter is essential for matching the target schema. Without this, the tool doesn't conform to the expected interface.

**Independent Test**: Can be fully tested by invoking the skill tool with `{"command": "test"}` and verifying the skill executes successfully. Attempting to use `{"name": "test"}` should fail validation.

**Acceptance Scenarios**:

1. **Given** a skill named "test" exists, **When** the tool is invoked with `{"command": "test"}`, **Then** the system loads and executes the skill successfully
2. **Given** the tool schema is registered, **When** the schema is inspected, **Then** the required property is named "command" not "name"
3. **Given** the tool is invoked with the old parameter name, **When** the tool receives `{"name": "test"}`, **Then** validation fails with an appropriate error message

---

### User Story 2 - Update Parameter Description (Priority: P2)

The `command` parameter includes a description that matches the target: "The skill name (no arguments). E.g., \"pdf\" or \"xlsx\"". This provides clear guidance to users and LLMs about how to invoke skills.

**Why this priority**: Clear documentation in the schema helps users understand the expected format. This improves usability and reduces errors.

**Independent Test**: Can be tested by inspecting the tool schema and verifying the `command` property description matches the target text exactly.

**Acceptance Scenarios**:

1. **Given** the tool schema is registered, **When** the schema is inspected, **Then** the `command` property description is "The skill name (no arguments). E.g., \"pdf\" or \"xlsx\""
2. **Given** an LLM reads the tool documentation, **When** it needs to invoke a skill, **Then** the examples in the description clarify the expected format

---

### User Story 3 - Add Schema Validation Properties (Priority: P3)

The input schema includes `"additionalProperties": false` and `"$schema": "http://json-schema.org/draft-07/schema#"` to enforce strict validation and declare the JSON Schema version being used.

**Why this priority**: These properties improve schema robustness by preventing unexpected parameters and declaring the validation standard. While valuable, they're lower priority than the parameter rename.

**Independent Test**: Can be tested by inspecting the registered tool schema and verifying both properties are present with correct values. Additionally, test that providing extra parameters (e.g., `{"command": "test", "extra": "value"}`) fails validation.

**Acceptance Scenarios**:

1. **Given** the tool schema is registered, **When** the schema is inspected, **Then** it includes `"additionalProperties": false`
2. **Given** the tool schema is registered, **When** the schema is inspected, **Then** it includes `"$schema": "http://json-schema.org/draft-07/schema#"`
3. **Given** the tool is invoked with extra parameters, **When** the tool receives `{"command": "test", "extra": "value"}`, **Then** validation fails because additional properties are not allowed

---

### Edge Cases

- What happens when code still uses the old `name` parameter? Validation should fail with a clear error indicating the parameter should be `command`.
- What happens if the MCP client doesn't support `additionalProperties: false`? The schema should still work, just without strict validation.
- What happens when the parameter description needs to be updated in the future? The description should be easily configurable in the tool registration code.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The tool input schema MUST define a required parameter named `command` (not `name`)
- **FR-002**: The `command` parameter MUST have type `string`
- **FR-003**: The `command` parameter description MUST be: "The skill name (no arguments). E.g., \"pdf\" or \"xlsx\""
- **FR-004**: The input schema MUST include `"additionalProperties": false` to prevent unexpected parameters
- **FR-005**: The input schema MUST include `"$schema": "http://json-schema.org/draft-07/schema#"` to declare the JSON Schema version
- **FR-006**: The `command` parameter MUST remain the only required property in the schema
- **FR-007**: All existing skill invocation logic MUST work with the new parameter name without functional changes
- **FR-008**: The tool MUST reject requests that use the old `name` parameter
- **FR-009**: The tool MUST reject requests that include additional properties beyond `command`

### Key Entities

- **Input Schema**: JSON Schema definition that specifies the `command` parameter with its type, description, and validation rules
- **Command Parameter**: String property that accepts skill names in simple format (`"pdf"`) or fully qualified format (`"project:test"`)
- **Schema Metadata**: Properties like `additionalProperties` and `$schema` that control validation behavior and declare the schema version

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The registered tool schema exactly matches the target schema structure with parameter named `command`
- **SC-002**: The `command` parameter description matches the target text character-for-character
- **SC-003**: Requests using `{"command": "skill-name"}` execute successfully 100% of the time for valid skills
- **SC-004**: Requests using the old `{"name": "skill-name"}` format fail validation with clear error messages
- **SC-005**: Requests with additional properties beyond `command` fail validation when `additionalProperties: false` is set
- **SC-006**: All existing skill functionality works identically after the parameter rename

## Scope

### In Scope

- Renaming the input parameter from `name` to `command`
- Updating the parameter description to match target schema
- Adding `additionalProperties: false` to the schema
- Adding `$schema` property to declare JSON Schema draft-07
- Updating any internal code that references the parameter name
- Testing to ensure existing skill invocation works with new parameter

### Out of Scope

- Changes to the tool description (already matches target)
- Changes to skill discovery logic
- Changes to skill loading or execution logic
- Support for both old and new parameter names (breaking change is acceptable)
- Migration scripts for existing code using old parameter name

## Assumptions

- The existing skill tool already has the correct description matching the target schema
- The MCP framework supports registering schemas with `additionalProperties: false` and `$schema` properties
- Breaking the old `name` parameter is acceptable (no backward compatibility required)
- The skill invocation logic can be updated to reference `command` instead of `name` with minimal changes
- Consumers of the MCP skill tool can adapt to the parameter name change

## Dependencies

- MCP SDK or framework for tool registration and schema validation
- JSON Schema draft-07 specification for validation rules
- Existing skill discovery and loading infrastructure

## Risks

- **Risk**: Code that references the old `name` parameter will break
  - **Mitigation**: Update all references in the codebase before deployment; this is a controlled breaking change

- **Risk**: Some MCP clients may not enforce `additionalProperties: false`
  - **Mitigation**: This is acceptable - the property improves validation where supported but doesn't break compatibility

- **Risk**: TypeScript types or interfaces may need updates to reflect parameter rename
  - **Mitigation**: Update type definitions alongside schema changes; use compiler to catch all references
