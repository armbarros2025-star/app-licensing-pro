/**
 * Utility functions for the MCP Skills Server
 */

import os from "os";
import path from "path";

/**
 * Resolves home directory (~) in a path
 * @param filePath - Path that may contain ~
 * @returns Absolute path with ~ expanded
 */
export function resolveHomePath(filePath: string): string {
  if (filePath.startsWith("~/") || filePath === "~") {
    return path.join(os.homedir(), filePath.slice(1));
  }
  return filePath;
}

/**
 * Normalizes a skill name for case-insensitive lookup
 * @param name - Skill name to normalize
 * @returns Lowercase, trimmed skill name
 */
export function normalizeSkillName(name: string): string {
  return name.toLowerCase().trim();
}

/**
 * Formats an error message for API responses
 * @param message - Error message
 * @returns Formatted error message
 */
export function formatErrorMessage(message: string): string {
  return message;
}

/**
 * Handles API errors and returns formatted error responses
 * @param error - Error object
 * @returns Error message string
 */
export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Formats a "skill not found" error with available skills list
 * @param requestedName - Name of the skill that was requested
 * @param availableSkills - Array of available skill objects
 * @returns Formatted error message
 */
export function formatSkillNotFoundError(
  requestedName: string,
  availableSkills: Array<{ name: string; description: string }>
): string {
  const skillsList = availableSkills
    .map((skill) => `- ${skill.name}: ${skill.description}`)
    .join("\n");

  return `Skill '${requestedName}' not found.

Available skills:
${skillsList}

Use the exact skill name (case-insensitive) to load a skill.`;
}
