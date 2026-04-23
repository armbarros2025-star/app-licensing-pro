/**
 * Skill discovery and caching logic
 */

import fs from "fs/promises";
import path from "path";
import { Skill, SkillSource, SkillLocation } from "./types.js";
import { loadSkillFile } from "./skill-loader.js";
import { resolveHomePath, normalizeSkillName } from "./utils.js";
import { SKILL_DIRS, SKILL_FILENAME } from "./constants.js";

/**
 * In-memory cache for discovered skills
 */
export class SkillCache {
  private cache: Map<string, Skill> = new Map();

  /**
   * Adds or updates a skill in the cache
   * @param skill - Skill to cache
   */
  set(skill: Skill): void {
    const key = normalizeSkillName(skill.name);
    this.cache.set(key, skill);
  }

  /**
   * Retrieves a skill by name (case-insensitive)
   * @param name - Skill name to lookup
   * @returns Skill or undefined if not found
   */
  get(name: string): Skill | undefined {
    const key = normalizeSkillName(name);
    return this.cache.get(key);
  }

  /**
   * Checks if a skill exists in the cache
   * @param name - Skill name to check
   * @returns True if skill exists
   */
  has(name: string): boolean {
    const key = normalizeSkillName(name);
    return this.cache.has(key);
  }

  /**
   * Removes a skill from the cache
   * @param name - Skill name to remove
   */
  delete(name: string): void {
    const key = normalizeSkillName(name);
    this.cache.delete(key);
  }

  /**
   * Clears all skills from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Returns all cached skills
   * @returns Array of all skills
   */
  getAllSkills(): Skill[] {
    return Array.from(this.cache.values());
  }

  /**
   * Returns the number of cached skills
   * @returns Cache size
   */
  size(): number {
    return this.cache.size;
  }
}

/**
 * Recursively scans a directory tree for SKILL.md files at any depth
 * @param directoryPath - Absolute path to scan
 * @param source - Source directory type
 * @param location - Project or global location
 * @returns Array of discovered skills
 */
export async function scanSkillDirectoryRecursive(
  directoryPath: string,
  source: SkillSource,
  location: SkillLocation
): Promise<Skill[]> {
  const skills: Skill[] = [];

  async function scanRecursively(currentPath: string): Promise<void> {
    try {
      // Check if directory exists
      await fs.access(currentPath);

      // Read directory contents
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      // Check if current directory contains SKILL.md
      const hasSkillFile = entries.some(
        (entry) => entry.isFile() && entry.name === SKILL_FILENAME
      );

      if (hasSkillFile) {
        const skillFilePath = path.join(currentPath, SKILL_FILENAME);
        const skill = await loadSkillFile(skillFilePath, currentPath, source, location);
        if (skill) {
          skills.push(skill);
          console.error(`  Found skill: ${skill.name} (${source})`);
        }
      }

      // Recursively scan subdirectories
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const subdirPath = path.join(currentPath, entry.name);
          await scanRecursively(subdirPath);
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        // Directory doesn't exist - skip silently
        return;
      }
      if ((error as NodeJS.ErrnoException).code === "EACCES") {
        // Permission denied - skip silently
        return;
      }
      console.error(`Error scanning directory ${currentPath}:`, error);
    }
  }

  await scanRecursively(directoryPath);
  return skills;
}

/**
 * Scans a single skill directory for SKILL.md files (non-recursive, one level deep)
 * @param directoryPath - Absolute path to scan
 * @param source - Source directory type
 * @param location - Project or global location
 * @returns Array of discovered skills
 */
export async function scanSkillDirectory(
  directoryPath: string,
  source: SkillSource,
  location: SkillLocation
): Promise<Skill[]> {
  const skills: Skill[] = [];

  try {
    // Check if directory exists
    await fs.access(directoryPath);

    // Read directory contents
    const entries = await fs.readdir(directoryPath, { withFileTypes: true });

    // Scan each subdirectory for SKILL.md
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillDirPath = path.join(directoryPath, entry.name);
        const skillFilePath = path.join(skillDirPath, SKILL_FILENAME);

        // Try to load the skill file
        const skill = await loadSkillFile(skillFilePath, skillDirPath, source, location);
        if (skill) {
          skills.push(skill);
          console.error(`  Found skill: ${skill.name} (${source})`);
        }
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      // Directory doesn't exist - skip silently
      return skills;
    }
    console.error(`Error scanning directory ${directoryPath}:`, error);
  }

  return skills;
}

/**
 * Scans all skill directories in priority order
 * @param cache - SkillCache to populate
 * @param useRecursiveScan - Whether to use recursive scanning for custom directories
 * @returns Number of skills discovered
 */
export async function scanAllDirectories(cache: SkillCache, useRecursiveScan: boolean = false): Promise<number> {
  // Clear existing cache
  cache.clear();

  console.error("Scanning skill directories...");

  // Scan all directories in priority order
  for (const { path: dirPath, source, location } of SKILL_DIRS) {
    const resolvedPath = resolveHomePath(dirPath);
    const absolutePath = path.resolve(resolvedPath);

    console.error(`Scanning ${dirPath} (${absolutePath})...`);
    
    // Use recursive scan for custom directories, regular scan for default directories
    const skills = (source === SkillSource.CUSTOM && useRecursiveScan)
      ? await scanSkillDirectoryRecursive(absolutePath, source, location)
      : await scanSkillDirectory(absolutePath, source, location);

    // Add skills to cache (priority: first match wins)
    for (const skill of skills) {
      if (!cache.has(skill.name)) {
        cache.set(skill);
      } else {
        console.error(`  Skipping duplicate skill '${skill.name}' from ${source} (already loaded from higher priority)`);
      }
    }
  }

  const totalSkills = cache.size();
  console.error(`Skills discovered: ${totalSkills}`);

  return totalSkills;
}
