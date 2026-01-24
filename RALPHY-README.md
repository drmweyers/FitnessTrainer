# BMAD + Ralphy + Ralph Loop TDD - Complete Setup Guide

## Summary

I've created a complete BMAD + Ralphy + Ralph Loop TDD workflow for EvoFit Trainer. This includes:

### ✅ What Was Created

#### 1. Ralphy Configuration Files

| File | Purpose |
|------|---------|
| `.ralphy/config.yaml` | Project rules, quality gates, parallel groups |
| `.ralphy/tasks.yaml` | 16 tasks organized in 5 parallel groups |

#### 2. New Claude Skills

| Skill | Location | Purpose |
|-------|----------|---------|
| `bmad-ralph-loop-tdd` | `~/.claude/skills/` | TDD methodology (RED-GREEN-REFACTOR) |
| `bmad-parallel-orchestrator` | `~/.claude/skills/` | Parallel agent coordination |

#### 3. New Subagents

| Agent | Location | Purpose |
|-------|----------|---------|
| `bmad-tdd-developer` | `~/.claude/agents/` | Test-driven development specialist |
| `bmad-quality-gate` | `~/.claude/agents/` | Quality gate enforcement |

#### 4. Documentation

| File | Purpose |
|------|---------|
| `RALPHY-SETUP.md` | Complete Ralphy setup guide |
| `RALPHY-TERMINAL-PROMPT.md` | Cut-and-paste terminal commands |

---

## How to Use Ralphy

### Do You Need to Clone Ralphy?

**NO** - Use NPM instead (recommended for Windows):

```bash
npm install -g ralphy-cli
```

The cloned version requires `jq`, `yq`, and `bc` which are Unix tools. The NPM version is cross-platform and has no dependencies.

### Quick Start

1. **Install Ralphy** (if not already installed):
```bash
npm install -g ralphy-cli
```

2. **Navigate to project**:
```bash
cd C:\Users\drmwe\claude_Code_Workspace\EvoFitTrainer
```

3. **Cut and paste** the commands from `RALPHY-TERMINAL-PROMPT.md` into a new terminal

---

## Cut-and-Paste Terminal Prompt

Open `RALPHY-TERMINAL-PROMPT.md` and copy the commands into a new terminal window.

**Quick version**:
```bash
cd "C:\Users\drmwe\claude_Code_Workspace\EvoFitTrainer"
ralphy --yaml .ralphy/tasks.yaml --parallel --max-parallel 5 --verbose
```

---

## What Ralphy Will Do

### Parallel Task Execution

```
┌─────────────────────────────────────────────────────────────┐
│                    PARALLEL GROUP 1                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Agent 1   │  │   Agent 2   │  │   Agent 3   │         │
│  │ Fix Toast   │  │ Fix Sidebar │  │ Fix Header  │         │
│  │   props     │  │   props     │  │   props     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    PARALLEL GROUP 2                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Agent 1   │  │   Agent 2   │  │   Agent 3   │         │
│  │ProgramBuild │  │  Dashboard  │  │  Exercise   │         │
│  │    Types    │  │    Types    │  │Library Types│         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    PARALLEL GROUP 3                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Agent 1   │  │   Agent 2   │  │   Agent 3   │         │
│  │WorkoutBuild │  │ EmailService│  │ TypeScript  │         │
│  │    Tests    │  │    Tests    │  │Compilation  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   QUALITY GATES (Sequential)                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Type Check → Lint → Tests → E2E → Coverage → Build│   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   DOCUMENTATION (Sequential)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Bug Tracking → QA Report → Coverage Roadmap        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Ralph Loop TDD Cycle

Each agent follows the RED-GREEN-REFACTOR cycle:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│     RED      │     │    GREEN     │     │   REFACTOR   │
│              │     │              │     │              │
│ Write failing│────▶│ Implement    │────▶│ Clean up     │
│ tests first  │     │ minimal code │     │ code structure│
│              │     │ to pass      │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       ▼                    ▼                    ▼
   Tests fail          Tests pass           Tests still pass
```

---

## Task Breakdown

### Group 1: Critical Sequential Fixes (Must Run First)
1. Fix Toast component props in analytics page
2. Fix Sidebar component props across all pages
3. Fix Header component props

### Group 2: Parallel Feature Fixes
4. Fix ProgramBuilder TypeScript errors
5. Fix Dashboard component TypeScript errors
6. Fix other component TypeScript errors

### Group 3: Parallel Test Fixes
7. Fix WorkoutBuilder test failures
8. Fix emailService test failures
9. Fix TypeScript compilation test failures

### Group 4: Quality Gates
10. Run full test suite and generate coverage report
11. Verify zero TypeScript errors
12. Run ESLint and fix all warnings

### Group 5: Documentation
13. Update bug tracking documentation
14. Generate final QA session report
15. Update coverage roadmap

**Total**: 16 tasks, estimated 8-12 hours with 5 parallel agents

---

## File Locations

### Configuration
```
EvoFitTrainer/
├── .ralphy/
│   ├── config.yaml          # Project rules and quality gates
│   └── tasks.yaml           # 16 tasks in 5 parallel groups
├── RALPHY-SETUP.md          # Complete setup guide
└── RALPHY-TERMINAL-PROMPT.md # Cut-and-paste commands
```

### Skills (Global)
```
~/.claude/skills/
├── bmad-ralph-loop-tdd/
│   └── SKILL.md             # TDD methodology
└── bmad-parallel-orchestrator/
    └── SKILL.md             # Parallel coordination
```

### Agents (Global)
```
~/.claude/agents/
├── bmad-tdd-developer/
│   └── agent.md             # TDD developer agent
└── bmad-quality-gate/
    └── agent.md             # Quality gate agent
```

---

## Quality Gates

### Before Each Commit
```bash
npm run type-check  # Zero TypeScript errors (required)
npm run lint        # Zero ESLint errors (required)
npm test            # All unit tests pass (required)
npm run test:e2e    # All E2E tests pass (required)
```

### Before Merge
```bash
npm run build              # Build succeeds (required)
npm run test:coverage      # Coverage measured (≥20% target)
```

---

## Expected Results

### Before Running Ralphy
- 144 TypeScript errors
- 63 failing tests
- 2-10% test coverage
- Bug-004 in progress (48% reduction)

### After Running Ralphy
- **0 TypeScript errors** (target achieved)
- **0 failing tests** (target achieved)
- **~20% test coverage** (baseline for growth to 80%)
- **Bug-004 closed** (target achieved)

---

## Monitoring Progress

### Terminal 1 (Main)
Run the Ralphy command with verbose output

### Terminal 2 (Branches)
```bash
cd C:\Users\drmwe\claude_Code_Workspace\EvoFitTrainer
git branch -a | grep ralphy
```

### Terminal 3 (Worktrees)
```bash
cd C:\Users\drmwe\claude_Code_Workspace\EvoFitTrainer
git worktree list
```

### Terminal 4 (Log)
```bash
cd C:\Users\drmwe\claude_Code_Workspace\EvoFitTrainer
git log --all --graph --oneline --decorate
```

---

## Troubleshooting

### Ralphy not found
```bash
npm install -g ralphy-cli
```

### Permission issues
Ralphy uses `--dangerously-skip-permissions` for Claude Code. This is normal for autonomous operation.

### Worktree issues
```bash
git worktree prune
```

### To stop execution
Press `Ctrl+C` in the main terminal. Agents will complete their current task then stop.

---

## Next Steps

1. **Open new terminal**
2. **Copy commands from** `RALPHY-TERMINAL-PROMPT.md`
3. **Paste and execute**
4. **Monitor progress** in multiple terminals
5. **Review results** when complete

---

## Summary

You now have:
- ✅ Ralphy configured for EvoFit Trainer
- ✅ 16 tasks organized in 5 parallel groups
- ✅ 2 new Claude skills for BMAD integration
- ✅ 2 new specialized subagents
- ✅ Complete documentation and cut-and-paste terminal prompt

**No need to clone Ralphy repo** - just use `npm install -g ralphy-cli`

**Open `RALPHY-TERMINAL-PROMPT.md`** to get started!

---

**Created**: 2025-01-20
**Project**: EvoFit Trainer
**Methodology**: BMAD + Ralphy + Ralph Loop TDD
