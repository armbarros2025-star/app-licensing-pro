# Quickstart: MCP Skills Server

**Last Updated**: 2025-11-02
**Feature**: 001-mcp-skills-server

## Overview

This quickstart guide shows how to build, run, and use the MCP Skills Server.

---

## Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher
- **TypeScript**: 5.7.2 (installed as dev dependency)
- **Operating System**: macOS, Linux, or Windows

Check your versions:
```bash
node --version  # Should be >= v18.0.0
npm --version   # Should be >= 8.0.0
```

---

## Installation

### 1. Initialize npm Package

```bash
cd /Users/nico/git/universal-skills
npm init -y
```

### 2. Install Dependencies

```bash
# Production dependencies
npm install @modelcontextprotocol/sdk@^1.6.1 \
            zod@^3.23.8 \
            gray-matter@^4.0.3

# Development dependencies
npm install --save-dev typescript@^5.7.2 \
                       @types/node@^22.10.0 \
                       tsx@^4.19.2 \
                       eslint@^8.57.0
```

### 3. Create TypeScript Configuration

Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 4. Update package.json

Add these fields to `package.json`:
```json
{
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "skills-mcp-server": "./dist/index.js"
  },
  "scripts": {
    "start": "node dist/index.js",
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "clean": "rm -rf dist"
  },
  "engines": {
    "node": ">=18"
  }
}
```

---

## Project Structure

Create the following directory structure:

```bash
mkdir -p src
touch src/index.ts
touch src/types.ts
touch src/constants.ts
touch src/schemas.ts
touch src/skill-scanner.ts
touch src/skill-loader.ts
touch src/utils.ts
```

Final structure:
```
universal-skills/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── types.ts
│   ├── constants.ts
│   ├── schemas.ts
│   ├── skill-scanner.ts
│   ├── skill-loader.ts
│   └── utils.ts
└── dist/          # Created after build
```

---

## Build

### Compile TypeScript

```bash
npm run build
```

Expected output:
```
> universal-skills@1.0.0 build
> tsc

# No errors means success
```

Verify `dist/` directory was created:
```bash
ls dist/
# Should show: index.js, types.js, etc.
```

---

## Running the Server

### Standalone (stdio mode)

```bash
npm start
```

Expected output to **stderr**:
```
Skills MCP server running via stdio
Skills discovered: 3
- git (Git deployment workflow)
- mcp-builder (MCP server development guide)
- postgres (PostgreSQL operations)
```

> **Note**: The server will appear to "hang" - this is correct! It's waiting for MCP client input via stdin.

### With Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "skills": {
      "command": "node",
      "args": ["/Users/nico/git/universal-skills/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop. The `skill` tool will appear in the available tools list.

---

## Creating Your First Skill

### 1. Create Skill Directory

```bash
mkdir -p .claude/skills/hello
```

### 2. Create SKILL.md

Create `.claude/skills/hello/SKILL.md`:

```markdown
---
name: hello
description: A simple hello world skill for testing
---

# Hello World Skill

## Overview

This is a test skill to verify the MCP Skills Server is working correctly.

## Usage

When this skill is invoked, it confirms the skill system is operational.

## Example

User: "Load the hello skill"
Assistant: *Invokes skill tool with name="hello"*
System: Returns this content
```

### 3. Wait for Refresh

The skill will appear within 30 seconds (or restart the server for immediate detection).

### 4. Invoke the Skill

Via Claude Desktop:
```
User: "Load the hello skill"
```

Expected response:
```
Loading: hello
Base directory: /Users/nico/git/universal-skills/.claude/skills/hello

---
name: hello
description: A simple hello world skill for testing
---

# Hello World Skill
...
```

---

## Testing the Server

### Test 1: List Available Skills

The skills are listed in the tool description. In Claude Desktop, check the `skill` tool to see available skills.

### Test 2: Load a Skill (Case-Insensitive)

```
User: "Load the HELLO skill"  # Note: all caps
```

Should work due to case-insensitive matching.

### Test 3: Skill Not Found

```
User: "Load the nonexistent skill"
```

Expected response:
```
Skill 'nonexistent' not found.

Available skills:
- hello: A simple hello world skill for testing
...
```

### Test 4: Priority Resolution

Create the same skill in multiple locations:

```bash
mkdir -p ./.agent/skills/test
mkdir -p ~/.agent/skills/test

echo "---\nname: test\ndescription: Project version\n---\nProject" > ./.agent/skills/test/SKILL.md
echo "---\nname: test\ndescription: Global version\n---\nGlobal" > ~/.agent/skills/test/SKILL.md
```

Load the skill:
```
User: "Load the test skill"
```

Should load the **project** version (`./.agent/skills/` has higher priority).

### Test 5: Refresh Cycle

1. Create a new skill while server is running
2. Wait 30 seconds
3. The new skill should appear in the available skills list

---

## Debugging

### Check Server Logs

Server logs go to **stderr**:

```bash
npm start 2> server.log &
tail -f server.log
```

### Common Issues

**Issue**: `Cannot find module '@modelcontextprotocol/sdk'`
**Solution**: Run `npm install`

**Issue**: `dist/index.js not found`
**Solution**: Run `npm run build`

**Issue**: Skills not appearing
**Solution**:
- Check directory structure (`skills/{name}/SKILL.md`)
- Verify frontmatter has `name` and `description`
- Check server logs for errors
- Wait for 30s refresh cycle

**Issue**: "Permission denied" errors
**Solution**: Verify file read permissions on skill directories

---

## Development Workflow

### 1. Development Mode (with auto-reload)

```bash
npm run dev
```

This watches for file changes and automatically recompiles.

### 2. Make Changes

Edit files in `src/`

### 3. Test Changes

The `tsx watch` process will auto-reload. Test via Claude Desktop or stdio.

### 4. Build for Production

```bash
npm run clean
npm run build
```

---

## Verification Checklist

Before considering implementation complete:

- [ ] `npm install` completes without errors
- [ ] `npm run build` succeeds
- [ ] `dist/index.js` exists and is executable
- [ ] Server starts with `npm start`
- [ ] Server logs "Skills MCP server running" to stderr
- [ ] Server discovers skills from all 4 directories
- [ ] Case-insensitive matching works
- [ ] Priority order is correct (./.agent/skills first)
- [ ] Refresh cycle works (30s)
- [ ] Missing directories don't cause errors
- [ ] Malformed frontmatter is skipped gracefully
- [ ] Skills without required fields are skipped
- [ ] Tool returns correct error for non-existent skills
- [ ] Tool returns skill content for valid skills

---

## Next Steps

1. **Add More Skills**: Create skills in your preferred directories
2. **Configure Claude Desktop**: Add server to Claude's config
3. **Use Skills**: Invoke skills via Claude's chat interface
4. **Monitor Performance**: Check that refresh stays under 1 second
5. **Review Logs**: Monitor stderr for warnings/errors

---

## Troubleshooting

### Server won't start

```bash
# Check Node version
node --version

# Check for syntax errors
npm run build

# Check for missing dependencies
npm install

# View detailed errors
npm start 2>&1 | tee error.log
```

### Skills not discovered

```bash
# Check directory structure
ls -la ./.agent/skills/
ls -la ~/.agent/skills/

# Check SKILL.md files
cat ./.agent/skills/*/SKILL.md

# Verify frontmatter
head -n 5 ./.agent/skills/*/SKILL.md
```

### Performance issues

```bash
# Check number of skills
find ./.agent/skills ~/.agent/skills ./.claude/skills ~/.claude/skills -name "SKILL.md" 2>/dev/null | wc -l

# Monitor refresh time (should be <1s)
# Check server logs for timing info
```

---

## Additional Resources

- MCP Protocol Documentation: https://modelcontextprotocol.io
- TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk
- Zod Documentation: https://zod.dev
- gray-matter: https://github.com/jonschlinkert/gray-matter

---

## Quick Reference Commands

```bash
# Install dependencies
npm install

# Build
npm run build

# Run
npm start

# Development mode
npm run dev

# Clean
npm run clean

# Full rebuild
npm run clean && npm run build

# Check build output
ls -lh dist/

# View server logs
npm start 2>&1 | tee server.log
```
