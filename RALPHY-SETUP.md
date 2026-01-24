# Ralphy Setup Guide for EvoFit Trainer

## What is Ralphy?

**Ralphy** is an autonomous AI coding loop that runs Claude Code (or other AI engines) iteratively until tasks are complete. It's perfect for BMAD methodology because:

- ✅ Runs parallel agents via git worktrees
- ✅ Auto-creates branches and PRs
- ✅ Follows task lists until complete
- ✅ Integrates with Ralph Loop TDD methodology

---

## Installation

### Option A: NPM (Recommended) - Cross-Platform

```bash
npm install -g ralphy-cli
```

### Option B: Clone (Requires jq, yq, bc on macOS/Linux)

```bash
git clone https://github.com/michaelshimeles/ralphy.git
cd ralphy && chmod +x ralphy.sh
```

**Windows users**: Use NPM option (Option A) - it's cross-platform and has no dependencies.

---

## Verification

After installation, verify:

```bash
ralphy --version
# Should show version 4.2.0 or higher
```

---

## Project Initialization

Ralphy has already been configured for EvoFit Trainer:

```bash
cd C:\Users\drmwe\claude_Code_Workspace\EvoFitTrainer

# View configuration
ralphy --config

# Configuration already exists at:
# .ralphy/config.yaml  - Project rules and quality gates
# .ralphy/tasks.yaml   - BMAD task list with parallel groups
```

---

## Running Ralphy

### 1. Single Task Mode

```bash
# Fix a specific issue
ralphy "Fix the Toast component props in analytics page"

# With browser automation
ralphy "Test the login flow" --browser
```

### 2. Task List Mode (BMAD Workflow)

```bash
# Run all tasks from .ralphy/tasks.yaml
ralphy

# Specify custom task file
ralphy --yaml .ralphy/tasks.yaml

# Use PRD.md as task source
ralphy --prd PRD.md
```

### 3. Parallel Execution (Recommended for EvoFit)

```bash
# Run 3 parallel agents (default)
ralphy --parallel

# Run 5 parallel agents (EvoFit has 5 parallel groups)
ralphy --parallel --max-parallel 5

# Parallel with PR creation
ralphy --parallel --create-pr --draft-pr
```

---

## Parallel Execution with Git Worktrees

When using `--parallel`, Ralphy creates isolated worktrees:

```
Agent 1 → /tmp/xxx/agent-1 → branch: ralphy/agent-1-fix-toast-props
Agent 2 → /tmp/xxx/agent-2 → branch: ralphy/agent-2-fix-sidebar-props
Agent 3 → /tmp/xxx/agent-3 → branch: ralphy/agent-3-fix-programbuilder-types
Agent 4 → /tmp/xxx/agent-4 → branch: ralphy/agent-4-fix-dashboard-types
Agent 5 → /tmp/xxx/agent-5 → branch: ralphy/agent-5-fix-workoutbuilder-tests
```

**Without `--create-pr`**: Auto-merges branches back, AI resolves conflicts
**With `--create-pr`**: Keeps branches, creates PRs for review

---

## Branch Workflow

```bash
# Create branch per task
ralphy --branch-per-task

# Create PRs for each task
ralphy --branch-per-task --create-pr

# Create draft PRs
ralphy --branch-per-task --draft-pr

# Specify base branch
ralphy --branch-per-task --base-branch main
```

---

## Quality Gates

Ralphy will automatically run quality gates before commits:

```yaml
# From .ralphy/config.yaml
quality_gates:
  before_commit:
    - "npm run type-check"  # Zero TypeScript errors
    - "npm run lint"        # Zero ESLint errors
    - "npm test"            # All unit tests pass
    - "npm run test:e2e"    # All E2E tests pass
```

To skip quality gates (not recommended):

```bash
ralphy --fast  # Skips tests and lint
ralphy --no-tests
ralphy --no-lint
```

---

## Browser Automation

Ralphy can automate browser interactions for E2E testing:

```bash
# Auto-detect (default)
ralphy "test the workout creation flow"

# Force enable
ralphy "verify dashboard deployment" --browser

# Force disable
ralphy "fix backend service" --no-browser
```

When enabled, agents get browser commands:
- `agent-browser open <url>`
- `agent-browser snapshot`
- `agent-browser click @e1`
- `agent-browser type @e1 "text"`
- `agent-browser screenshot <file>`

---

## Parallel Groups

The EvoFit tasks are organized into parallel groups:

```yaml
# Group 1: Critical sequential fixes (must run first)
parallel_group: 1
- Fix Toast component props
- Fix Sidebar component props
- Fix Header component props

# Group 2: Parallel feature fixes (can run simultaneously)
parallel_group: 2
- Fix ProgramBuilder TypeScript errors
- Fix Dashboard component TypeScript errors
- Fix other component TypeScript errors

# Group 3: Parallel test fixes (can run simultaneously)
parallel_group: 3
- Fix WorkoutBuilder test failures
- Fix emailService test failures
- Fix TypeScript compilation test failures

# Group 4: Quality gates (sequential)
parallel_group: 4
- Run full test suite
- Verify zero TypeScript errors
- Run ESLint

# Group 5: Documentation (sequential)
parallel_group: 5
- Update bug tracking
- Generate final report
- Update coverage roadmap
```

---

## Options Reference

| Flag | Description |
|------|-------------|
| `--prd FILE` | Task file (default: PRD.md) |
| `--yaml FILE` | YAML task file |
| `--parallel` | Run parallel agents |
| `--max-parallel N` | Max agents (default: 3) |
| `--branch-per-task` | Branch per task |
| `--create-pr` | Create PRs |
| `--draft-pr` | Draft PRs |
| `--no-tests` | Skip tests |
| `--no-lint` | Skip lint |
| `--fast` | Skip tests + lint |
| `--max-iterations N` | Stop after N tasks |
| `--max-retries N` | Retries per task (default: 3) |
| `--dry-run` | Preview only |
| `--browser` | Enable browser automation |
| `--init` | Setup .ralphy/ config |
| `--config` | Show config |
| `-v, --verbose` | Debug output |

---

## Claude Code Integration

Ralphy uses Claude Code by default. It passes:

```bash
claude --dangerously-skip-permissions
```

This allows fully autonomous operation without permission prompts.

---

## Troubleshooting

### Ralphy not found

```bash
# Check npm global location
npm config get prefix

# Add to PATH (Windows)
# Add: C:\Users\YOUR_USERNAME\AppData\Roaming\npm to PATH

# Verify
ralphy --version
```

### Git worktree issues

```bash
# Clean up stale worktrees
git worktree prune

# List worktrees
git worktree list
```

### Permission issues

```bash
# Ralphy uses --dangerously-skip-permissions for Claude
# If you want manual approval, edit ralphy.sh and remove the flag
```

---

## Next Steps

1. **Verify installation**: `ralphy --version`
2. **Review config**: `ralphy --config`
3. **Review tasks**: Check `.ralphy/tasks.yaml`
4. **Run parallel agents**: See cut-and-paste prompt below
5. **Monitor progress**: Check branches and PRs

---

## Best Practices

1. **Start with `--dry-run`** to preview what will happen
2. **Use `--parallel` for independent tasks** (like our Group 2 and 3)
3. **Use `--branch-per-task --create-pr`** for code review
4. **Monitor agent progress** in separate terminals
5. **Let agents run autonomously** - they'll retry on failures
6. **Review PRs** before merging to main

---

## Support

- Ralphy GitHub: https://github.com/michaelshimeles/ralphy
- Discord: https://discord.gg/ralphy
- EvoFit Project: See `.ralphy/` directory for configuration

---

**Last Updated**: 2025-01-20
**EvoFit Trainer**: BMAD + Ralph Loop TDD + Ralphy Integration
