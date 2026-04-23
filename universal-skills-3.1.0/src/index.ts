#!/usr/bin/env node

/**
 * MCP Skills Server
 *
 * Discovers and loads skill markdown files from prioritized directories
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { SkillCache, scanAllDirectories } from "./skill-scanner.js";
import { SkillToolInputSchema } from "./schemas.js";
import { formatSkillNotFoundError } from "./utils.js";
import { SERVER_NAME, SERVER_VERSION, REFRESH_INTERVAL_MS, addSkillDirectories } from "./constants.js";

// Global skill cache
const skillCache = new SkillCache();

/**
 * Generates the dynamic tool description with available skills
 * @returns Tool description string
 */
function generateToolDescription(): string {
  const skills = skillCache.getAllSkills();

  const skillsList = skills
    .map(
      (skill) => `<skill>
<name>${skill.name}</name>
<description>${skill.description}</description>
<location>${skill.location}</location>
</skill>`
    )
    .join("\n");

  return `Execute a skill within the main conversation

<skills_instructions>
When users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively. Skills provide specialized capabilities and domain knowledge.

How to use skills:
- Invoke skills using this tool with the skill name only (no arguments)
- When you invoke a skill, you will see <command-message>The "{name}" skill is loading</command-message>
- The skill's prompt will expand and provide detailed instructions on how to complete the task
- Examples:
  - command: "pdf" - invoke the pdf skill
  - command: "xlsx" - invoke the xlsx skill
  - command: "ms-office-suite:pdf" - invoke using fully qualified name

Important:
- Only use skills listed in <available_skills> below
- Do not invoke a skill that is already running
- Do not use this tool for built-in CLI commands (like /help, /clear, etc.)
</skills_instructions>

<available_skills>
${skillsList}
</available_skills>`;
}

/**
 * Main server initialization
 * @param additionalDirs - Optional array of additional directories to search for skills
 */
export async function startServer(additionalDirs: string[] = []) {
  console.error(`${SERVER_NAME} v${SERVER_VERSION} starting...`);

  // Process additional skill directories if provided
  let useRecursiveScan = false;
  
  if (additionalDirs.length > 0) {
    console.error(`Adding ${additionalDirs.length} additional skill director${additionalDirs.length === 1 ? 'y' : 'ies'}...`);
    additionalDirs.forEach(dir => console.error(`  - ${dir}`));
    addSkillDirectories(additionalDirs);
    useRecursiveScan = true;
  }

  // Initial skill scan
  await scanAllDirectories(skillCache, useRecursiveScan);
  console.error(`Skills MCP server running via stdio`);

  // Create MCP server
  const server = new Server(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Set up request handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "skill",
          description: generateToolDescription(),
          inputSchema: {
            type: "object",
            properties: {
              command: {
                type: "string",
                description: "The skill name (no arguments). E.g., \"pdf\" or \"xlsx\"",
              },
            },
            required: ["command"],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name !== "skill") {
      throw new Error(`Unknown tool: ${request.params.name}`);
    }

    // Validate input
    const validationResult = SkillToolInputSchema.safeParse(request.params.arguments);
    if (!validationResult.success) {
      throw new Error(`Invalid input: ${validationResult.error.message}`);
    }

    const { command } = validationResult.data;

    // Look up skill in cache (case-insensitive)
    const skill = skillCache.get(command);

    if (!skill) {
      // Skill not found - return error with available skills
      const availableSkills = skillCache.getAllSkills().map((s) => ({
        name: s.name,
        description: s.description,
      }));
      const errorMessage = formatSkillNotFoundError(command, availableSkills);

      return {
        content: [
          {
            type: "text",
            text: errorMessage,
          },
        ],
      };
    }

    // Return skill content
    const response = `Loading: ${skill.name}
Base directory: ${skill.baseDirectory}

${skill.content}`;

    return {
      content: [
        {
          type: "text",
          text: response,
        },
      ],
    };
  });

  // Set up refresh interval
  setInterval(async () => {
    try {
      console.error("Refreshing skills...");
      await scanAllDirectories(skillCache, useRecursiveScan);
      console.error("Skills refreshed successfully");
    } catch (error) {
      console.error("Error refreshing skills:", error);
    }
  }, REFRESH_INTERVAL_MS);

  // Connect to transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Server connected and ready");
}
