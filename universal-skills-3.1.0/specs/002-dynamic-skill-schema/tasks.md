# Tasks: Skill Input Schema Alignment

**Input**: Design documents from `/specs/002-dynamic-skill-schema/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are NOT requested in this feature specification, so no test tasks are included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths shown below assume single project structure per plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Verify project structure matches plan.md expectations
- [x] T002 Verify TypeScript 5.7.2 and Node.js 18+ environment

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Review current Zod schema in src/schemas.ts to understand existing validation
- [x] T004 Review current tool registration in src/index.ts to understand MCP tool setup

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Rename Input Parameter to "command" (Priority: P1) 🎯 MVP

**Goal**: The MCP skill tool accepts `{"command": "skill-name"}` instead of `{"name": "skill-name"}` for API compatibility and consistency

**Independent Test**: Invoke the skill tool with `{"command": "test"}` and verify the skill executes successfully. Attempting to use `{"name": "test"}` should fail validation.

### Implementation for User Story 1

- [x] T005 [US1] Update Zod schema parameter name from `name` to `command` in src/schemas.ts
- [x] T006 [US1] Update tool registration parameter name from `name` to `command` in src/index.ts (lines 96-104)
- [x] T007 [US1] Update required array from `["name"]` to `["command"]` in src/index.ts
- [x] T008 [US1] Update variable destructuring from `{ name }` to `{ command }` in src/index.ts (line 121)
- [x] T009 [US1] Update skillCache.get() call from `get(name)` to `get(command)` in src/index.ts
- [x] T010 [US1] Verify TypeScript compilation succeeds with no errors

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently - the tool accepts `command` parameter and rejects `name` parameter

---

## Phase 4: User Story 2 - Update Parameter Description (Priority: P2)

**Goal**: The `command` parameter includes clear documentation: "The skill name (no arguments). E.g., \"pdf\" or \"xlsx\""

**Independent Test**: Inspect the tool schema and verify the `command` property description matches the target text exactly.

### Implementation for User Story 2

- [x] T011 [US2] Update Zod schema description to "The skill name (no arguments). E.g., \"pdf\" or \"xlsx\"" in src/schemas.ts
- [x] T012 [US2] Update tool registration description to "The skill name (no arguments). E.g., \"pdf\" or \"xlsx\"" in src/index.ts
- [x] T013 [P] [US2] Update tool description examples from `name:` to `command:` in src/index.ts (lines 50-52)
- [x] T014 [US2] Verify schema inspection shows correct description text

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - parameter is named `command` with correct description

---

## Phase 5: User Story 3 - Add Schema Validation Properties (Priority: P3)

**Goal**: The input schema includes `"additionalProperties": false` and `"$schema": "http://json-schema.org/draft-07/schema#"` for strict validation

**Independent Test**: Inspect the registered tool schema and verify both properties are present. Test that providing extra parameters (e.g., `{"command": "test", "extra": "value"}`) fails validation.

**Note**: Based on research.md, this story was deprioritized. Zod's `.strict()` already provides `additionalProperties: false` behavior. This phase is OPTIONAL and can be deferred or skipped.

### Implementation for User Story 3 (OPTIONAL)

- [ ] T015 [US3] Research if MCP SDK supports explicit `additionalProperties` and `$schema` in tool registration
- [ ] T016 [US3] If supported, add `additionalProperties: false` to inputSchema in src/index.ts
- [ ] T017 [US3] If supported, add `$schema: "http://json-schema.org/draft-07/schema#"` to inputSchema in src/index.ts
- [ ] T018 [US3] Verify extra parameters are rejected with clear validation error

**Checkpoint**: All user stories should now be independently functional (if US3 implemented)

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and validation improvements that affect the overall feature

- [x] T019 [P] Update README.md examples from `{"name": "..."}` to `{"command": "..."}`
- [x] T020 [P] Update README.md explanatory text referencing the parameter
- [x] T021 [P] Create or update CHANGELOG.md with breaking change notice and migration guide
- [x] T022 Update package.json version from current version to 2.0.0 (MAJOR bump for breaking change)
- [x] T023 Run `npm run build` to verify TypeScript compilation
- [x] T024 Run `npm run lint` to verify code quality
- [ ] T025 Manual test with MCP inspector - verify tool schema shows `command` parameter
- [ ] T026 Manual test with MCP inspector - test `{"command": "test"}` succeeds (if test skill exists)
- [ ] T027 Manual test with MCP inspector - test `{"name": "test"}` fails with clear error
- [ ] T028 Manual test with MCP inspector - test `{"command": "test", "extra": "value"}` fails (validates strict mode)
- [ ] T029 Follow quickstart.md validation steps to ensure all changes work correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3, 4, 5)**: All depend on Foundational phase completion
  - User Story 1 (P1): MUST complete first (core parameter rename)
  - User Story 2 (P2): Depends on User Story 1 completion (updates description of renamed parameter)
  - User Story 3 (P3): OPTIONAL - can be skipped or deferred
- **Polish (Phase 6)**: Depends on User Story 1 and 2 completion (US3 optional)

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Depends on User Story 1 completion (must rename parameter before updating its description)
- **User Story 3 (P3)**: OPTIONAL - Independent but low priority per research.md

### Within Each User Story

- User Story 1: Tasks must run sequentially (T005 → T006 → T007 → T008 → T009 → T010)
- User Story 2: Tasks T011-T012 sequential, but T013 can be parallel with T014
- User Story 3: Tasks must run sequentially
- Polish Phase: Tasks T019-T021 marked [P] can run in parallel; testing tasks must run sequentially

### Parallel Opportunities

- Phase 1 Setup: Both tasks can run in parallel
- Phase 2 Foundational: T003 and T004 can run in parallel
- Phase 6 Polish: Documentation tasks T019, T020, T021 can run in parallel

---

## Parallel Example: User Story 2

```bash
# These tasks can run in parallel:
Task: "Update tool description examples from name: to command: in src/index.ts (lines 50-52)"
Task: "Verify schema inspection shows correct description text"

# After completing T011-T012 sequentially
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (parameter rename)
4. Complete Phase 4: User Story 2 (description update)
5. **STOP and VALIDATE**: Test with MCP inspector
6. Complete Phase 6: Polish (documentation and testing)
7. Commit and tag v2.0.0

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Core functionality works
3. Add User Story 2 → Test independently → Documentation complete
4. Skip User Story 3 (optional per research.md)
5. Add Polish phase → Final validation and documentation
6. Deploy as v2.0.0

### User Story 3 (Optional)

If later needed:
1. Research MCP SDK capabilities
2. Add schema properties if supported
3. Test validation behavior
4. Deploy as v2.1.0 (minor version)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- User Story 1 and 2 form the MVP (User Story 3 is optional)
- Verify TypeScript compilation after each user story
- Use MCP inspector for manual testing
- Breaking change requires MAJOR version bump (v2.0.0)
- Clear migration guide in CHANGELOG.md is critical for consumers
- Commit after each user story completion for clean git history
