/**
 * Zod validation schemas for the MCP Skills Server
 */

import { z } from "zod";

/**
 * Input schema for the 'skill' tool
 */
export const SkillToolInputSchema = z
  .object({
    command: z
      .string()
      .min(1, "Skill name cannot be empty")
      .describe("The skill name (no arguments). E.g., \"pdf\" or \"xlsx\""),
  })
  .strict();

/**
 * Type inferred from SkillToolInputSchema
 */
export type SkillToolInput = z.infer<typeof SkillToolInputSchema>;
