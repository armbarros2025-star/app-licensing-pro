# Feature Specification: MCP Skills Server

**Feature Branch**: `001-mcp-skills-server`
**Created**: 2025-11-02
**Status**: Draft
**Input**: User description: "I want to build an mcp server. It should not require any auth and be available via stdio protocol. It's goal should be to search the following folders for skills."

## Clarifications

### Session 2025-11-02

- Q: When should skills be discovered/refreshed? → A: Skills are cached at startup but periodically refreshed every 30 seconds
- Q: Should skill name matching be case-sensitive or case-insensitive? → A: Case-insensitive matching (skill "Git" = "git" = "GIT")
- Q: How should extremely large skill files (>10MB) be handled? → A: Not a concern - skill files are text-based and won't be extremely large in practice
- Q: What characters are allowed in skill names? → A: Any characters allowed in markdown text (no restrictions on special characters or spaces)
- Q: What happens when frontmatter is missing required `name` or `description` fields? → A: Reject/skip any skill missing either `name` or `description` field

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Discover and Load Available Skills (Priority: P1)

An AI assistant needs to discover what specialized skills are available in the current environment so it can determine which capabilities it has access to for helping users complete tasks.

**Why this priority**: This is the foundational capability - without skill discovery, the assistant cannot know what skills exist or how to use them. This enables the entire skills system.

**Independent Test**: Can be fully tested by starting the MCP server, invoking the skill tool with a known skill name, and verifying the skill's markdown content is returned with the correct base directory path.

**Acceptance Scenarios**:

1. **Given** skills exist in multiple priority directories, **When** the assistant requests a skill by name, **Then** the skill from the highest priority directory is loaded and its full markdown content is returned
2. **Given** a skill exists in a global directory but not project directory, **When** the assistant requests that skill, **Then** the skill is found and loaded successfully from the global location
3. **Given** multiple skills with different names exist across directories, **When** the assistant requests the list of available skills, **Then** all unique skills are shown with their names and descriptions from the frontmatter

---

### User Story 2 - Handle Missing or Invalid Skills (Priority: P2)

An AI assistant attempts to load a skill that doesn't exist or has invalid formatting, and needs clear feedback about what went wrong to guide the user toward a solution.

**Why this priority**: Error handling is critical for usability but secondary to the core discovery functionality. Good error messages help users understand and fix issues.

**Independent Test**: Can be tested by requesting a non-existent skill name and verifying a helpful error message is returned that suggests checking the skill name or available skills list.

**Acceptance Scenarios**:

1. **Given** no skill exists with the requested name, **When** the assistant invokes the skill tool, **Then** an error message is returned explaining the skill wasn't found and suggesting checking available skills
2. **Given** a skill file exists but has malformed frontmatter, **When** the assistant attempts to load it, **Then** an error message explains the parsing issue with the file location
3. **Given** a skill directory exists but contains no SKILL.md file, **When** the system scans for skills, **Then** that directory is skipped without causing failures
4. **Given** a SKILL.md file exists but is missing the required `name` or `description` field in frontmatter, **When** the system scans for skills, **Then** that skill is skipped and does not appear in the available skills list

---

### User Story 3 - Work with Project and Global Skills (Priority: P3)

A user working on a specific project wants to use both project-specific skills (only available in this project) and global skills (available across all projects), with project skills taking precedence when names conflict.

**Why this priority**: This enables flexibility and proper skill organization, but the basic discovery works even with only one directory level.

**Independent Test**: Can be tested by creating skills with the same name in both project and global directories, then verifying the project skill is loaded (priority order respected).

**Acceptance Scenarios**:

1. **Given** a skill named "deploy" exists in both project (./.agent/skills/) and global (~/.agent/skills/) directories, **When** the assistant loads the "deploy" skill, **Then** the project version is loaded
2. **Given** a user switches between different projects, **When** the assistant scans for skills, **Then** each project's specific skills are discovered correctly
3. **Given** a skill is removed from the project directory but still exists globally, **When** the 30-second refresh occurs, **Then** the global version becomes available
4. **Given** a new skill is added to any skill directory, **When** the next 30-second refresh cycle completes, **Then** the new skill appears in the available skills list

---

### Edge Cases

- What happens when a skill directory doesn't exist (e.g., user hasn't created ~/.agent/skills/ yet)?
- What happens when a SKILL.md file is empty or only contains frontmatter with no body content?
- What happens when the same skill name appears in multiple priority directories?
- What happens when the user's home directory cannot be resolved or accessed?
- What happens when a skill file has permission issues (not readable)?
- What happens when the current project directory cannot be determined?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST scan exactly four directories in this priority order: `./.agent/skills/`, `~/.agent/skills/`, `./.claude/skills/`, `~/.claude/skills/`
- **FR-002**: System MUST communicate via stdio protocol (stdin for input, stdout for output, stderr for diagnostic messages)
- **FR-003**: System MUST NOT require any authentication or authorization to operate
- **FR-004**: System MUST expose exactly one tool named "skill" that accepts a skill name as input
- **FR-005**: System MUST know the current project directory to resolve project-specific skill paths (`./.agent/skills/` and `./.claude/skills/`)
- **FR-006**: System MUST receive the invoked skill name as a parameter to the skill tool to load the correct skill
- **FR-006a**: System MUST perform case-insensitive matching when looking up skills by name (e.g., "Git", "git", and "GIT" all match the same skill)
- **FR-007**: System MUST parse skill frontmatter (YAML between `---` markers) to extract name and description fields
- **FR-007a**: System MUST accept skill names containing any valid markdown text characters (including special characters, spaces, and unicode)
- **FR-007b**: System MUST skip/reject any skill file missing either the `name` or `description` field in its frontmatter
- **FR-008**: System MUST return the complete markdown content of the requested skill when invoked
- **FR-009**: System MUST include the base directory path for the skill in the response (e.g., "Base directory: /path/to/.claude/skills/my-skill")
- **FR-010**: System MUST prioritize skills from directories earlier in the priority list when duplicate names exist
- **FR-011**: System MUST handle missing directories gracefully (skip them without errors)
- **FR-012**: System MUST provide a list of all available skills with their names and descriptions in the tool description
- **FR-013**: System MUST scan for skills at server initialization and refresh the skill list every 30 seconds to detect additions, modifications, or deletions
- **FR-014**: System MUST treat each skill as a directory containing a SKILL.md file (e.g., `skills/git/SKILL.md`)
- **FR-015**: System MUST return clear error messages when a requested skill is not found
- **FR-016**: System MUST handle malformed skill files gracefully with descriptive error messages

### Key Entities

- **Skill**: A markdown file with YAML frontmatter containing metadata (name, description) and body content with instructions. Each skill resides in its own directory with a SKILL.md file.
- **Skill Directory**: One of four locations where skills can be stored, searched in priority order (project universal, global universal, project Claude-specific, global Claude-specific).
- **Tool Response**: The output returned when a skill is invoked, containing the base directory path and the full SKILL.md content.
- **Project Directory**: The current working directory where the MCP server is invoked, used to resolve project-specific skill paths.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: AI assistants can discover and list all available skills across all four directories in under 1 second during server initialization
- **SC-002**: AI assistants can load any valid skill's content in under 100ms
- **SC-003**: When duplicate skill names exist, the correct priority skill is loaded 100% of the time
- **SC-004**: System successfully handles missing directories without failures or user-visible errors
- **SC-005**: Error messages for missing or malformed skills provide actionable guidance that allows users to resolve the issue without external documentation

### Assumptions

- Skills are structured as directories containing a SKILL.md file (not standalone markdown files)
- The YAML frontmatter format uses standard YAML syntax with `name` and `description` fields
- Users have read access to the directories where skills are stored
- The home directory path (`~`) can be reliably resolved on the target operating system
- Skills are relatively small (typically < 100KB) markdown files
- The MCP server process has filesystem access to read files from the specified directories
- The current project directory can be determined from the process working directory or MCP initialization context
