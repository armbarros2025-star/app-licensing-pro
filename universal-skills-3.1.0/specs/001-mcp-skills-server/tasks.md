# Tasks: MCP Skills Server

**Input**: Design documents from `/specs/001-mcp-skills-server/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are NOT required per constitution (test-optional).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `dist/` at repository root
- Paths assume single npm package structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Initialize npm package with package.json
- [X] T002 Create tsconfig.json with strict TypeScript configuration (ES2022 target, Node16 modules)
- [X] T003 [P] Create .eslintrc.json with ESLint configuration
- [X] T004 [P] Create .gitignore to exclude node_modules and dist/
- [X] T005 Install production dependencies (@modelcontextprotocol/sdk@^1.6.1, zod@^3.23.8, gray-matter@^4.0.3)
- [X] T006 Install dev dependencies (typescript@^5.7.2, @types/node@^22.10.0, tsx@^4.19.2, eslint@^8.57.0)
- [X] T007 Create src/ directory structure (index.ts, types.ts, constants.ts, schemas.ts, skill-scanner.ts, skill-loader.ts, utils.ts)
- [X] T008 Add build and start scripts to package.json (build: tsc, start: node dist/index.js, dev: tsx watch src/index.ts)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T009 Define TypeScript interfaces in src/types.ts (Skill, SkillSource, SkillFrontmatter, SkillCache)
- [X] T010 [P] Define constants in src/constants.ts (SKILL_DIRS array, REFRESH_INTERVAL_MS=30000)
- [X] T011 [P] Create Zod schemas in src/schemas.ts (SkillToolInputSchema with strict validation)
- [X] T012 [P] Implement path resolution utilities in src/utils.ts (resolveHomePath, normalizeSkillName functions)
- [X] T013 [P] Implement error handling utilities in src/utils.ts (handleApiError, formatErrorMessage functions)
- [X] T014 Initialize McpServer instance in src/index.ts with server name and version
- [X] T015 Set up StdioServerTransport in src/index.ts for stdio protocol
- [X] T016 Implement server startup and connection logic in src/index.ts with error handling

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Discover and Load Available Skills (Priority: P1) 🎯 MVP

**Goal**: Enable AI assistants to discover and load skills from prioritized directories with full markdown content

**Independent Test**: Start the MCP server, invoke the skill tool with a known skill name (e.g., "git"), and verify the skill's markdown content is returned with the correct base directory path

### Implementation for User Story 1

- [X] T017 [P] [US1] Implement SkillCache class in src/skill-scanner.ts (Map-based cache with normalized keys)
- [X] T018 [P] [US1] Implement skill directory scanning function in src/skill-scanner.ts (scanSkillDirectory)
- [X] T019 [US1] Implement skill discovery from all 4 directories in src/skill-scanner.ts (scanAllDirectories with priority order)
- [X] T020 [US1] Implement frontmatter parsing in src/skill-loader.ts (parseSkillFrontmatter using gray-matter)
- [X] T021 [US1] Implement skill file loading in src/skill-loader.ts (loadSkillFile with validation)
- [X] T022 [US1] Implement case-insensitive skill lookup in src/skill-scanner.ts (getSkill method)
- [X] T023 [US1] Register "skill" tool with McpServer in src/index.ts (tool definition with Zod schema)
- [X] T024 [US1] Implement skill tool handler in src/index.ts (load skill by name, return content with base directory)
- [X] T025 [US1] Generate dynamic tool description in src/index.ts (list all available skills in XML format)
- [X] T026 [US1] Implement initial skill scan on server startup in src/index.ts
- [X] T027 [US1] Add diagnostic logging to stderr for skill discovery in src/skill-scanner.ts

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. The server can discover and load skills from all 4 directories.

---

## Phase 4: User Story 2 - Handle Missing or Invalid Skills (Priority: P2)

**Goal**: Provide clear, actionable error messages when skills are not found or have invalid formatting

**Independent Test**: Request a non-existent skill name and verify a helpful error message is returned that lists available skills

### Implementation for User Story 2

- [X] T028 [P] [US2] Implement error response for skill not found in src/index.ts (format with available skills list)
- [X] T029 [P] [US2] Implement malformed frontmatter handling in src/skill-loader.ts (skip skill, log to stderr)
- [X] T030 [P] [US2] Implement missing SKILL.md file handling in src/skill-scanner.ts (skip directory without error)
- [X] T031 [P] [US2] Implement missing required fields validation in src/skill-loader.ts (skip if name or description missing)
- [X] T032 [US2] Add detailed error logging to stderr for all error cases in src/skill-loader.ts
- [X] T033 [US2] Implement helpful error messages with suggestions in src/utils.ts (formatSkillNotFoundError)

**Checkpoint**: At this point, User Stories 1 AND 2 both work independently. Error handling is robust and helpful.

---

## Phase 5: User Story 3 - Work with Project and Global Skills (Priority: P3)

**Goal**: Support both project-specific and global skills with proper priority resolution and automatic refresh

**Independent Test**: Create skills with the same name in both project (./.agent/skills/) and global (~/.agent/skills/) directories, then verify the project skill is loaded (priority order respected)

### Implementation for User Story 3

- [X] T034 [P] [US3] Implement 30-second refresh interval in src/index.ts (setInterval calling scanAllDirectories)
- [X] T035 [P] [US3] Implement cache invalidation on refresh in src/skill-scanner.ts (clear and repopulate cache)
- [X] T036 [P] [US3] Implement priority-based resolution in src/skill-scanner.ts (first-match wins from SKILL_DIRS order)
- [X] T037 [US3] Add refresh success/error logging to stderr in src/index.ts
- [X] T038 [US3] Implement graceful handling of missing directories in src/skill-scanner.ts (skip with no error)
- [X] T039 [US3] Update tool description dynamically after each refresh in src/index.ts (if MCP supports notifications)

**Checkpoint**: All user stories should now be independently functional. The server supports project/global skills with automatic refresh.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and project completion

- [X] T040 [P] Create README.md with installation instructions, usage examples, and MCP tool documentation
- [X] T041 [P] Create CHANGELOG.md with version 1.0.0 and initial release notes
- [X] T042 [P] Add shebang line to src/index.ts for direct execution (#!/usr/bin/env node)
- [X] T043 Build TypeScript project (npm run build) and verify dist/index.js is created
- [X] T044 [P] Add stderr logging for server startup confirmation
- [X] T045 [P] Implement permission error handling in src/skill-loader.ts (skip unreadable files)
- [X] T046 [P] Add home directory resolution error handling in src/utils.ts
- [X] T047 Verify tool annotations in src/index.ts (readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false)
- [X] T048 Test server startup and verify skills are discovered from all 4 directories
- [X] T049 Manually test skill loading with case-insensitive names
- [X] T050 Verify 30-second refresh cycle works correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Foundational (Phase 2) - No dependencies on other stories
  - User Story 2 (P2): Can start after Foundational (Phase 2) - No dependencies on other stories (enhances US1 but independently testable)
  - User Story 3 (P3): Can start after Foundational (Phase 2) - No dependencies on other stories (enhances US1 but independently testable)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Enhances US1 with error handling but is independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Enhances US1 with refresh and priority but is independently testable

### Within Each User Story

- User Story 1: Types/interfaces → Scanner/Loader → Tool registration → Startup scan
- User Story 2: Error formatters → Validation logic → Error responses
- User Story 3: Refresh timer → Cache invalidation → Priority resolution

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T003, T004 after T001-T002)
- All Foundational tasks marked [P] can run in parallel (T010, T011, T012, T013 after T009)
- All user stories can start in parallel after Foundational phase completes (if team capacity allows)
- Within User Story 1: T017, T018 can run in parallel; T020, T021 can run in parallel
- Within User Story 2: All tasks marked [P] (T028, T029, T030, T031) can run in parallel
- Within User Story 3: T034, T035, T036, T038 can run in parallel
- Polish phase: All tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# After Foundational phase completes, launch these together:
Task: "Implement SkillCache class in src/skill-scanner.ts"
Task: "Implement skill directory scanning in src/skill-scanner.ts"

# Then together:
Task: "Implement frontmatter parsing in src/skill-loader.ts"
Task: "Implement skill file loading in src/skill-loader.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Discover and Load Skills)
4. **STOP and VALIDATE**: Test User Story 1 independently
   - Start server: `npm start`
   - Create test skill in `.claude/skills/test/SKILL.md`
   - Verify skill appears in tool description
   - Invoke skill tool with name="test"
   - Verify markdown content is returned
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → **Deploy/Demo (MVP!)**
   - Server discovers and loads skills
   - Basic functionality complete
3. Add User Story 2 → Test independently → Deploy/Demo
   - Error handling improved
   - Better user experience
4. Add User Story 3 → Test independently → Deploy/Demo
   - Refresh and priority features
   - Full feature set complete
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Core functionality)
   - Developer B: User Story 2 (Error handling) - can work independently
   - Developer C: User Story 3 (Refresh & priority) - can work independently
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- No tests required (per constitution - test-optional)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Build TypeScript before testing: `npm run build`
- Use `npm run dev` for development with auto-reload

---

## Task Execution Checklist

Before starting implementation, verify:
- [ ] All design documents reviewed (plan.md, spec.md, data-model.md, contracts/)
- [ ] Development environment ready (Node.js 18+, npm, TypeScript)
- [ ] Feature branch checked out (001-mcp-skills-server)

During implementation:
- [ ] Follow task order within each phase
- [ ] Mark tasks complete as you finish them
- [ ] Run `npm run build` after TypeScript changes
- [ ] Test at each checkpoint
- [ ] Commit frequently with clear messages

After completion:
- [ ] All tasks marked complete
- [ ] `npm run build` succeeds without errors
- [ ] Server starts and logs to stderr
- [ ] All 3 user stories independently tested
- [ ] README.md and CHANGELOG.md complete
- [ ] Ready for `/speckit.implement` or manual implementation
