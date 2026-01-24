# 🚀 BMAD + Ralphy + Ralph Loop TDD - Terminal Prompt

## Cut and Paste This Into a New Terminal Window

```bash
# =============================================================================
# EvoFit Trainer - BMAD + Ralphy + Ralph Loop TDD
# Autonomous Parallel Development Workflow
# =============================================================================

# STEP 1: Navigate to project directory
cd "C:\Users\drmwe\claude_Code_Workspace\EvoFitTrainer"

# STEP 2: Verify Ralphy is installed
ralphy --version
# If not installed, run: npm install -g ralphy-cli

# STEP 3: Verify configuration
ralphy --config

# STEP 4: Preview what will happen (Dry Run)
ralphy --yaml .ralphy/tasks.yaml --dry-run --verbose

# STEP 5: Run parallel autonomous agents (when ready)
# Uncomment ONE of the following options:

# Option A: Parallel execution with 5 agents (RECOMMENDED)
# ralphy --yaml .ralphy/tasks.yaml --parallel --max-parallel 5 --verbose

# Option B: Parallel with PR creation
# ralphy --yaml .ralphy/tasks.yaml --parallel --max-parallel 5 --branch-per-task --create-pr --verbose

# Option C: Sequential execution (safer, slower)
# ralphy --yaml .ralphy/tasks.yaml --verbose

# Option D: Single task for testing
# ralphy "Fix Toast component props in analytics page following TDD"

# =============================================================================
# MONITORING COMMANDS (Run in separate terminals)
# =============================================================================

# Terminal 2: Monitor branches
# cd "C:\Users\drmwe\claude_Code_Workspace\EvoFitTrainer"
# watch -n 5 'git branch -a | grep ralphy'

# Terminal 3: Monitor worktrees
# cd "C:\Users\drmwe\claude_Code_Workspace\EvoFitTrainer"
# watch -n 5 'git worktree list'

# Terminal 4: Monitor git log
# cd "C:\Users\drmwe\claude_Code_Workspace\EvoFitTrainer"
# git log --all --graph --oneline --decorate --all

# =============================================================================
# QUALITY GATE COMMANDS (Run manually if needed)
# =============================================================================

# Run quality gates manually
# npm run type-check
# npm run lint
# npm test
# npm run test:e2e
# npm run test:coverage
# npm run build

# =============================================================================
# CLEANUP COMMANDS (If needed)
# =============================================================================

# Prune stale worktrees
# git worktree prune

# Remove all ralphy branches (use with caution)
# git branch | grep ralphy | xargs git branch -D

# =============================================================================
# For more information, see:
# - RALPHY-SETUP.md - Complete setup guide
# - .ralphy/config.yaml - Project configuration
# - .ralphy/tasks.yaml - Task list with parallel groups
# =============================================================================
```

## Quick Start (Minimal)

If you just want to start quickly:

```bash
cd "C:\Users\drmwe\claude_Code_Workspace\EvoFitTrainer"
ralphy --yaml .ralphy/tasks.yaml --parallel --max-parallel 5 --verbose
```

## Installation Check

If Ralphy is not installed:

```bash
npm install -g ralphy-cli
```

## What Happens When You Run This

1. **Agent 1** fixes Toast component props in analytics page
2. **Agent 2** fixes Sidebar component props across all pages
3. **Agent 3** fixes Header component props
4. **Agent 4** fixes ProgramBuilder TypeScript errors
5. **Agent 5** fixes WorkoutBuilder test failures

Each agent:
- Works in isolated git worktree
- Follows Ralph Loop TDD (RED-GREEN-REFACTOR)
- Runs quality gates before committing
- Creates branch with fix
- Auto-merges or creates PR

## Expected Output

```
[Ralphy] Starting parallel execution with 5 agents...
[Agent 1] Working on: Fix Toast component props in analytics page
[Agent 2] Working on: Fix Sidebar component props across all pages
[Agent 3] Working on: Fix Header component props
[Agent 4] Working on: Fix ProgramBuilder TypeScript errors
[Agent 5] Working on: Fix WorkoutBuilder test failures

[Agent 1] RED: Writing failing tests...
[Agent 1] GREEN: Implementing fix...
[Agent 1] REFACTOR: Cleaning up code...
[Agent 1] QUALITY GATE: Running checks...
[Agent 1] ✅ TypeScript: 0 errors
[Agent 1] ✅ ESLint: 0 errors
[Agent 1] ✅ Tests: 108/108 passing
[Agent 1] ✅ Committed to: ralphy/agent-1-fix-toast-props

[Agent 2] RED: Writing failing tests...
... (similar output for each agent)

[Ralphy] All agents complete!
[Ralphy] Merging branches to main...
[Ralphy] ✅ SUCCESS - 5/5 tasks completed
```

## Monitoring Progress

Open separate terminals to monitor:

### Terminal 1 (Main)
```bash
cd "C:\Users\drmwe\claude_Code_Workspace\EvoFitTrainer"
ralphy --yaml .ralphy/tasks.yaml --parallel --max-parallel 5 --verbose
```

### Terminal 2 (Branches)
```bash
cd "C:\Users\drmwe\claude_Code_Workspace\EvoFitTrainer"
git branch -a | grep ralphy
```

### Terminal 3 (Worktrees)
```bash
cd "C:\Users\drmwe\claude_Code_Workspace\EvoFitTrainer"
git worktree list
```

### Terminal 4 (Log)
```bash
cd "C:\Users\drmwe\claude_Code_Workspace\EvoFitTrainer"
git log --all --graph --oneline --decorate
```

## Troubleshooting

### Ralphy not found
```bash
npm install -g ralphy-cli
```

### Permission issues
```bash
# Ralphy uses --dangerously-skip-permissions for Claude
# This is normal for autonomous operation
```

### Worktree issues
```bash
git worktree prune
```

### To stop execution
```bash
# Press Ctrl+C in main terminal
# Agents will complete current task then stop
```

## Next Steps After Completion

1. **Review commits**: Check git log for all changes
2. **Review PRs** (if --create-pr used): Check GitHub for PRs
3. **Run tests**: Verify all tests pass
4. **Check coverage**: Review coverage report
5. **Update docs**: Close bug-004 and update status

## Questions?

- **Setup guide**: See `RALPHY-SETUP.md`
- **Configuration**: See `.ralphy/config.yaml`
- **Task list**: See `.ralphy/tasks.yaml`
- **BMAD guide**: See `docs/bmad-method-guide.md`

---

**Last Updated**: 2025-01-20
**EvoFit Trainer**: BMAD + Ralphy + Ralph Loop TDD
