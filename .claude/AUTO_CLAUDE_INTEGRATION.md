# Auto Claude + BMAD Integration for FitnessTrainer

## Project Overview

**FitnessTrainer** is a comprehensive platform for personal trainers to manage clients, create workout programs, and track progress.

**Tech Stack:**
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + Radix UI
- **Backend**: Node.js + Express + TypeScript + Prisma + PostgreSQL
- **Mobile**: React Native (planned)
- **Testing**: Jest + Playwright
- **Development**: Docker Compose

## BMAD Method Configuration

This project uses **BMAD v6.0.0** for structured, AI-driven development.

### BMAD Directory Structure

```
.bmad-core/
├── core-config.yaml              # Main BMAD configuration
├── install-manifest.yaml         # Installation manifest
├── data/                         # BMAD knowledge base
│   ├── bmad-kb.md               # BMAD knowledge base
│   └── technical-preferences.md # Technical preferences
├── workflows/                    # BMAD workflow templates
├── agents/                       # BMAD agent definitions
└── tasks/                        # BMAD task templates
```

### BMAD Documentation Structure

```
docs/
├── prd.md                        # Product Requirements Document
├── architecture.md               # Technical Architecture
├── epics/                        # Sharded epic files (12 epics)
│   ├── epic-001-user-profiles.md
│   ├── epic-002-authentication.md
│   └── ...
├── stories/                      # Sharded story files (90+ stories)
│   ├── story-001-01-create-initial-profile.md
│   ├── story-002-01-user-registration.md
│   └── ...
└── architecture/                 # Sharded architecture documents
    ├── coding-standards.md
    ├── tech-stack.md
    └── source-tree.md
```

### BMAD Configuration File

```yaml
markdownExploder: true
qa:
  qaLocation: docs/qa
prd:
  prdFile: docs/prd.md
  prdVersion: v6
  prdSharded: true
  prdShardedLocation: docs/prd
  epicFilePattern: epic-{n}*.md
architecture:
  architectureFile: docs/architecture.md
  architectureVersion: v6
  architectureSharded: true
  architectureShardedLocation: docs/architecture
devLoadAlwaysFiles:
  - docs/architecture/coding-standards.md
  - docs/architecture/tech-stack.md
  - docs/architecture/source-tree.md
devStoryLocation: docs/stories
slashPrefix: BMad
```

## Auto Claude Integration

### Auto Claude Configuration

Auto Claude is configured to work with the existing BMAD v6 setup:

**Configuration Files:**
- `.auto-claude/config.yaml` - Main Auto Claude configuration
- `.auto-claude/orchestration.yaml` - Orchestration and workflow settings

### How Auto Claude Uses BMAD

1. **Planning Phase:**
   - Loads PRD from `docs/prd.md`
   - References sharded epics from `docs/epics/`
   - Uses architecture from `docs/architecture.md`
   - Generates tasks aligned with BMAD epics and stories

2. **Execution Phase:**
   - Works on stories from `docs/stories/`
   - Follows BMAD coding standards from `docs/architecture/coding-standards.md`
   - Implements according to BMAD tech stack from `docs/architecture/tech-stack.md`
   - Uses BMAD workflow templates from `.bmad-core/workflows/`

3. **Validation Phase:**
   - Validates against BMAD PRD requirements
   - Checks architecture compliance
   - Ensures test coverage meets BMAD standards
   - Runs BMAD quality gates

## Development Workflow

### Starting Development

```bash
# 1. Start Docker development environment
docker-compose --profile dev up -d

# 2. Check container status
docker ps

# 3. View logs
docker logs -f fitness-frontend fitness-backend
```

### Running Tests

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

### Linting and Type Checking

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run type-check
```

## Working with Auto Claude

### Task Creation

When creating tasks in Auto Claude:

1. **Reference BMAD Artifacts:**
   - Always reference the specific epic or story being implemented
   - Include shard file paths in task descriptions
   - Example: "Implement story-002-01-user-registration.md (docs/stories/story-002-01-user-registration.md)"

2. **Use BMAD Terminology:**
   - "Discovery" for research and planning
   - "Planning" for architecture and design
   - "Implementation" for coding
   - "Validation" for testing and QA

3. **Follow BMAD Workflows:**
   - Use brownfield workflows for existing code
   - Use greenfield workflows for new features
   - Always run quality gates before completion

### Context Loading

Auto Claude automatically loads these files in order:

1. `.bmad-core/core-config.yaml` - BMAD configuration
2. `docs/prd.md` - Product requirements
3. `docs/architecture.md` - Technical architecture
4. `docs/epics/` - Sharded epic files
5. `docs/stories/` - Sharded story files
6. `docs/architecture/coding-standards.md` - Coding standards
7. `docs/architecture/tech-stack.md` - Technology stack

### Commit Messages

Auto Claude generates commits following BMAD conventions:

```
type(scope): brief description

References:
- Epic: docs/epics/epic-XXX-name.md
- Story: docs/stories/story-XXX-YY-name.md
- Architecture: docs/architecture/section.md

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Quick Reference

### BMAD Commands

```bash
# Initialize BMAD (already done)
npx bmad-method install

# Create PRD (already exists)
npx bmad prd:init

# Create architecture (already exists)
npx bmad arch:init

# Shard documents (already done)
npx bmad shard-doc docs/prd.md
npx bmad shard-doc docs/architecture.md
```

### Auto Claude Commands

Auto Claude is a desktop application. To use it:

1. **Open Auto Claude** from Windows Start Menu
2. **Open Project** - Select `D:\Claude\FitnessTrainer`
3. **Connect** - Sign in with Claude Code account
4. **Create Task** - Describe what you want to build
5. **Watch it Work** - Agents plan, code, and validate

### Project Status

**Completed:**
- ✅ BMAD v6.0.0 installed and configured
- ✅ PRD created (docs/prd.md)
- ✅ Architecture created (docs/architecture.md)
- ✅ 12 Epics sharded (docs/epics/)
- ✅ 90+ Stories sharded (docs/stories/)
- ✅ Auto Claude integration configured

**In Progress:**
- 🚧 Epic 002: Authentication system

**Next Steps:**
- Continue with remaining epics
- Add more comprehensive tests
- Deploy to production

## BMAD Expansion Packs

This project has BMAD expansion packs installed:
- `bmad-2d-phaser-game-dev`
- `bmad-2d-unity-game-dev`
- `bmad-creative-writing`
- `bmad-infrastructure-devops`

These provide additional agents and workflows for specialized development tasks.

## Tips for Success

1. **Always reference BMAD artifacts** in task descriptions
2. **Follow BMAD terminology** for consistency
3. **Run Docker environment** for all development
4. **Validate against PRD** before marking tasks complete
5. **Keep documentation updated** as you build
6. **Use quality gates** to ensure code quality

## Support

- **BMAD Documentation**: `.bmad-core/user-guide.md`
- **Auto Claude Documentation**: https://github.com/AndyMik90/Auto-Claude
- **Project Status**: `docs/PROJECT_STATUS.md`
- **Development Workflow**: `docs/development-workflow.md`

---

**Last Updated**: 2026-01-08
**BMAD Version**: 6.0.0
**Auto Claude Version**: 2.7.2
