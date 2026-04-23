/**
 * Core type definitions for the MCP Skills Server
 */

/**
 * Enum indicating which directory a skill was loaded from
 */
export enum SkillSource {
  PROJECT_UNIVERSAL = "./.agent/skills",
  GLOBAL_UNIVERSAL = "~/.agent/skills",
  PROJECT_CLAUDE = "./.claude/skills",
  GLOBAL_CLAUDE = "~/.claude/skills",
  CUSTOM = "custom",
}

/**
 * Location type for skill origin (project or global)
 */
export type SkillLocation = "project" | "global";

/**
 * Parsed YAML frontmatter from a SKILL.md file
 */
export interface SkillFrontmatter {
  name: string; // Required field
  description: string; // Required field
  [key: string]: unknown; // Allow additional fields (ignored for now)
}

/**
 * Represents a discovered and parsed skill from the filesystem
 */
export interface Skill {
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
  location: SkillLocation; // project or global
}
