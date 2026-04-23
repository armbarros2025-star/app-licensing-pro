/**
 * Skill file loading and parsing
 */

import fs from "fs/promises";
import matter from "gray-matter";
import { Skill, SkillFrontmatter, SkillSource, SkillLocation } from "./types.js";

/**
 * Parses frontmatter from a SKILL.md file
 * @param content - Raw markdown content
 * @returns Parsed frontmatter or null if malformed
 */
export function parseSkillFrontmatter(content: string): SkillFrontmatter | null {
  try {
    const { data } = matter(content);

    // Validate required fields
    if (!data.name || !data.description) {
      return null;
    }

    // Ensure fields are strings
    if (typeof data.name !== "string" || typeof data.description !== "string") {
      return null;
    }

    return {
      name: data.name,
      description: data.description,
      ...data,
    };
  } catch (error) {
    console.error("Error parsing frontmatter:", error);
    return null;
  }
}

/**
 * Loads a skill file from disk
 * @param filePath - Absolute path to SKILL.md file
 * @param baseDirectory - Base directory for the skill
 * @param source - Source directory type
 * @param location - Project or global location
 * @returns Skill object or null if invalid
 */
export async function loadSkillFile(
  filePath: string,
  baseDirectory: string,
  source: SkillSource,
  location: SkillLocation
): Promise<Skill | null> {
  try {
    // Check read permissions
    await fs.access(filePath, fs.constants.R_OK);

    // Read file content
    const content = await fs.readFile(filePath, "utf-8");

    // Parse frontmatter
    const frontmatter = parseSkillFrontmatter(content);
    if (!frontmatter) {
      console.error(`Skill at ${filePath} has malformed frontmatter or missing required fields (name, description)`);
      return null;
    }

    // Create Skill object
    const skill: Skill = {
      name: frontmatter.name,
      description: frontmatter.description,
      baseDirectory,
      filePath,
      content,
      lastLoaded: new Date(),
      source,
      location,
    };

    return skill;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EACCES") {
      console.error(`Permission denied reading skill file: ${filePath}`);
    } else if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      // File doesn't exist - skip silently
      return null;
    } else {
      console.error(`Error loading skill file ${filePath}:`, error);
    }
    return null;
  }
}
