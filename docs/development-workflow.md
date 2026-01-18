# Development Workflow Guide

## Development Guidelines Overview

### Development Server Setup
- **ALWAYS start the development server using Docker**: Run `docker-compose --profile dev up -d` to ensure consistent development environment
- **Check Docker status first**: Run `docker ps` to verify Docker is running before starting development
- **Access points**: Configure based on project (common: Frontend at http://localhost:4000, Backend API at http://localhost:4000/api)

## Docker Environment Management

### Common Docker Commands
```bash
# Check Docker is running
docker ps

# Start development environment
docker-compose --profile dev up -d

# Stop development environment  
docker-compose --profile dev down

# View container logs
docker logs <container-name> -f

# Restart containers
docker-compose --profile dev restart

# Rebuild after dependencies change
docker-compose --profile dev up -d --build
```

### Development Environment Guidelines
- **⚠️ CRITICAL REQUIREMENT**: ALWAYS use Docker for ALL development work - NO EXCEPTIONS
- **NEVER run services locally** via npm/node directly - ALWAYS use Docker containers
- **Start development**: `docker-compose --profile dev up -d`
- **Stop development**: `docker-compose --profile dev down`
- **View logs**: `docker logs <container-name> -f`
- **Restart after changes**: `docker-compose --profile dev restart <service-name>`
- **Database**: PostgreSQL runs in Docker, Redis runs in Docker, MailHog runs in Docker
- **Backend API**: Runs in Docker container, NOT via `npm run dev` locally

## Git Workflow and Branch Management

### Development Workflow Guidelines

**Before Starting Any Development Task:**
1. **ALWAYS** ensure you're on the correct primary branch (commonly `main` or `develop`)
2. **⚠️ MANDATORY**: Start Docker development environment first: `docker-compose --profile dev up -d`
3. Check git status: `git status`
4. Pull latest changes: `git pull origin <primary-branch>`
5. Create feature branch: `git checkout -b feature/<description>`

### Branch Management Strategy
```bash
# Always start from primary branch
git checkout main  # or primary development branch
git pull origin main

# For feature work
git checkout -b feature/your-feature-name
# ... do work ...
git add .
git commit -m "type(scope): descriptive message"
git push origin feature/your-feature-name

# Merge back when ready
git checkout main
git merge feature/your-feature-name
git push origin main
```

### Branch Synchronization Process (CTO Guidance)
When projects have multiple active branches (e.g., main/production and develop/staging):

```bash
# Step 1: Ensure you're on primary with latest changes
git checkout main
git pull origin main

# Step 2: Switch to development branch  
git checkout develop
git status  # Must be clean

# Step 3: Merge primary into development to sync branches
git merge main --no-edit

# Step 4: Push synchronized development branch
git push origin develop

# Step 5: Return to primary branch
git checkout main
```

**CTO Instructions - When to guide User through branch sync:**
- ✅ After new features are committed to primary branch
- ✅ Before starting development on secondary branches
- ✅ After production hotfixes
- ✅ Weekly as part of regular maintenance

## Version Control & GitHub Operations

### Commit Strategy & Checkpointing
- **Frequency**: Commit after every significant change or completed task
- **CTO Communication**: "I'm committing these changes to create a checkpoint. This allows us to roll back if needed."
- **Message Format**: 
  ```
  type(scope): brief description
  
  - Detailed change 1
  - Detailed change 2
  ```
- **Types**: feat (new feature), fix (bug fix), docs (documentation), style (formatting), refactor (code restructuring), test (testing), chore (maintenance)

### Branch Management
- **Creation**: `git checkout -b feature/descriptive-name`
- **CTO Explanation**: "Creating a new feature branch to isolate these changes and keep our main branch stable"
- **Naming Convention**: feature/, bugfix/, hotfix/, chore/
- **Parallel Development**: Use Git worktrees for multiple agents working simultaneously

### Pre-Push Quality Checks
The CTO automatically performs:
1. Run tests: `npm test` or language-appropriate test command
2. Lint code: `npm run lint` or appropriate linter
3. Type checking: `npm run typecheck` (for TypeScript projects)
4. Review changes: `git diff --staged`
5. Security scan: Check for exposed secrets or API keys

### Pull Request Creation
- **CTO Process Explanation**: "I'm creating a pull request to merge our changes. Let me explain what's included..."
- **PR Template**:
  ```bash
  gh pr create --title "Type: Brief Description" \
               --body "## Summary
  [What changes were made and why]
  
  ## Testing
  - [ ] Unit tests passing
  - [ ] Integration tests passing
  - [ ] Manual testing completed
  
  ## Checklist
  - [ ] Code follows project style
  - [ ] Documentation updated
  - [ ] No secrets exposed"
  ```

### GitHub Issue Integration
- Link commits to issues: `fix: resolve login bug #123`
- Close issues via PR: Include "Closes #123" in PR description
- Track progress: Update issue status as work progresses

### Rollback Procedures
If issues arise, the CTO guides:
1. Identify problem: `git log --oneline`
2. Revert commit: `git revert <commit-hash>`
3. Or reset: `git reset --hard <commit-hash>`
4. Force push carefully: `git push --force-with-lease`

## Development Task Execution

### During Development
1. Use TodoWrite tool to track all tasks
2. Test changes in appropriate environment (Docker/local)
3. Run linting before commits: `npm run lint` (or equivalent)
4. Ensure type checking passes: `npm run typecheck` (if applicable)

### After Task Completion
1. Test all changes thoroughly
2. Commit with descriptive messages using conventional commits
3. Update documentation if needed
4. Mark todos as completed

## Testing Guidelines

### Testing Best Practices
1. **Always test in appropriate environment first** (Docker/local)
2. Use project-provided test scripts for specific features
3. Check browser console for errors (web applications)
4. Test all user roles and permissions
5. Verify responsive design on different screen sizes (web applications)

## Security Considerations
- Never commit `.env` files or sensitive configuration
- Use environment variables for sensitive data
- Validate all user inputs
- Implement proper authentication checks
- Sanitize data before processing (especially for PDF generation, database queries, etc.)

## Common Issues & Solutions
- **Import errors**: Check module resolution and alias configuration
- **Database connection**: Ensure database container/service is running
- **Build failures**: Check dependencies and build scripts
- **Port conflicts**: Verify port configuration and availability

## Advanced Multi-Agent Support

### Tooling for Parallel Development & Execution
- **Git Worktrees**: Utilize Git worktrees to allow multiple agents (or multiple Claude Code instances) to work on different features or branches in parallel within isolated environments, preventing conflicts.
  - **Custom Command (/create_worktree)**: Create a custom slash command that automates the creation of a Git worktree and a new Claude Code instance within it, pre-configured for a specific sub-agent's task.
- **MCP Servers (.mcp.json)**:
  - **GitHub CLI/MCP**: For managing Git operations, issues, pull requests, and code reviews.
    • **Installation**: `npm install -g @modelcontextprotocol/server-github`
    • **Configuration**: Add to your `.mcp.json`:
      ```json
      {
        "servers": {
          "github": {
            "command": "npx",
            "args": ["@modelcontextprotocol/server-github"],
            "env": {
              "GITHUB_TOKEN": "${GITHUB_TOKEN}"
            }
          }
        }
      }
      ```
    • **Usage**: Create issues, manage PRs, review code, manage releases
  - **Other MCPs**: Integrate specialized MCPs (e.g., ShadCN UI MCP for UI components, n8n MCP for automation workflows) as needed based on the project's requirements.

### Context Management during Execution
- **Isolated Contexts**: Each sub-agent maintains its own context window, preventing context pollution
- **Inter-agent Communication**: Agents communicate via shared markdown files (product-strategy-analysis.md, code_report.md, UI_flow_report.md)
- **Clear Context**: Regularly use `/clear` to clear conversation history, especially after a significant task or checkpoint, to reduce hallucinations and save on token costs.
- **Session Summary**: Use a custom command or explicit prompt to add a session summary to claude.md after major progress, ensuring persistent memory across sessions.
- **File Referencing**: Use `@` to link relevant files and `#` to add data to Claude's memory within prompts, ensuring Claude focuses on specific parts of the codebase.

### Advanced Workflow Guidelines
- **"Think" Modes**: Use keywords like `think`, `mega-think`, or `ultra-think` for complex reasoning (ultra-think uses ~32,000 tokens)
- **Model Selection**: Use Opus for planning, Sonnet for execution to optimize costs
- **Workflow Rules**: 
  - "Always read planning.md at the start of every new conversation"
  - "Check tasks.md before starting work and mark completed tasks immediately"
  - "Add any new discovered tasks to tasks.md"
  - "Make every task and code change as simple as possible, impacting minimal code"
  - "Provide high-level explanations of changes made at every step"
  - "Add a review section to project_plan.md with summary of changes and relevant information"

## Cost Optimization & Performance
• **Context Management**: Regularly use `/clear` command to free up context after significant tasks to reduce token usage and prevent hallucinations
• **Model Selection**: Use Kimmy K2 model for cost savings on routine tasks, Opus for complex planning, Sonnet for balanced execution
• **Token Efficiency**: Use ultra-think mode sparingly (consumes ~32,000 tokens), prefer structured thinking for complex tasks
