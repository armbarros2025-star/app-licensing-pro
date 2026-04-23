/**
 * MCP command - starts the MCP server
 */

import { startServer } from "../index.js";

interface McpOptions {
  skillDir?: string[];
}

export async function mcpCommand(options: McpOptions) {
  // Get skill directories from options (already an array thanks to collect function)
  const additionalDirs: string[] = options.skillDir || [];

  // Start the MCP server with additional directories
  await startServer(additionalDirs);
}
