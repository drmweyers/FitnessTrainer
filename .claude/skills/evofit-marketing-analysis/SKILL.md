---
name: evofit-marketing-analysis
description: Deep-dive codebase analysis of EvoFitTrainer that produces a marketing-ready business logic document with production site screenshots. Reads all components, pages, API routes, and data models, then generates a structured document a copywriter can use directly.
---

# EvoFit Marketing Analysis

## Description

Performs a comprehensive three-phase analysis of the EvoFitTrainer codebase and production site:

1. **Phase 1 - Codebase Analysis:** Reads every Prisma model, page route, API route, feature component, and service file to extract feature capabilities and business logic.
2. **Phase 2 - Browser Screenshots:** Navigates the live production site (https://evofittrainer-six.vercel.app) and captures screenshots of every major page for marketing use.
3. **Phase 3 - Marketing Document:** Produces a structured marketing business logic document with feature deep dives, user benefits, competitive positioning, and suggested copy angles.

The output is a single deliverable that a marketing copywriter can use -- without any additional technical context -- to write all marketing materials for the platform.

## Arguments

The skill accepts one argument specifying the mode:
- `full` - Run all three phases (codebase analysis + screenshots + document generation). **Recommended.**
- `analysis` - Phase 1 only: Read the codebase and produce a summary of all features and capabilities
- `screenshots` - Phase 2 only: Navigate production site and capture screenshots of all pages
- `document` - Phase 3 only: Generate the marketing document (requires Phase 1 to have been completed)
- `update` - Re-run analysis on changed files and update the existing marketing document

## Instructions

### Setup

Ensure you have access to:
- The codebase at `C:\Users\drmwe\Claude\EvoFitTrainer`
- The full prompt specification at `C:\Users\drmwe\Claude\EvoFitTrainer\prompts\evofit-marketing-analysis.md`
- A browser automation tool (Playwright) for screenshot capture
- Internet access to reach `https://evofittrainer-six.vercel.app`

### Mode: full

This is the recommended mode. It executes all three phases in sequence.

**Step 1:** Read the master prompt file for complete instructions.

```
Read: C:\Users\drmwe\Claude\EvoFitTrainer\prompts\evofit-marketing-analysis.md
```

**Step 2:** Execute Phase 1 - Codebase Analysis.

Read all files specified in the prompt's Phase 1 section, following the chain-of-thought reasoning process for each category:

1. Read `C:\Users\drmwe\Claude\EvoFitTrainer\backend\prisma\schema.prisma` (data model)
2. Read all 41 page files listed in Step 1.2 of the prompt
3. Read all 65+ API route files listed in Step 1.3 of the prompt
4. Read all 50+ feature components listed in Step 1.4 of the prompt
5. Read all service/middleware/utility files listed in Step 1.5 of the prompt
6. Read navigation and layout components from Step 1.6
7. Read existing documentation from Step 1.7

For each file category, build understanding using the chain-of-thought questions specified in the prompt.

**Step 3:** Execute Phase 2 - Browser Screenshots.

Use Playwright (via the `playwright-bowser` skill or direct Playwright scripting) to capture screenshots of all 36 planned pages:

```bash
cd C:\Users\drmwe\Claude\EvoFitTrainer

# Ensure Playwright is installed
npx playwright install chromium

# Create screenshot output directories
mkdir -p docs/marketing/screenshots/public
mkdir -p docs/marketing/screenshots/trainer
mkdir -p docs/marketing/screenshots/admin
mkdir -p docs/marketing/screenshots/client
```

Navigate and screenshot each page following the screenshot capture plan in Phase 2 of the prompt. Save screenshots to `C:\Users\drmwe\Claude\EvoFitTrainer\docs\marketing\screenshots\`.

Authentication credentials for the demo trainer account:
- Email: `coach.sarah@evofittrainer.com`
- Password: `Demo1234!`

**Step 4:** Execute Phase 3 - Marketing Document Generation.

Write the complete marketing business logic document following the exact structure specified in Phase 3 of the prompt. Output to:

```
C:\Users\drmwe\Claude\EvoFitTrainer\docs\marketing\evofit-marketing-business-logic.md
```

Also generate the screenshot inventory:

```
C:\Users\drmwe\Claude\EvoFitTrainer\docs\marketing\screenshot-inventory.md
```

**Step 5:** Quality verification.

Run through the quality checklist at the end of the prompt to verify:
- All 12 feature areas documented
- All screenshots captured
- All user flows documented
- Platform statistics accurate
- No unexplained technical jargon

### Mode: analysis

Execute only Phase 1 (Codebase Analysis) from the master prompt. Output a summary to:

```
C:\Users\drmwe\Claude\EvoFitTrainer\docs\marketing\codebase-analysis-summary.md
```

This summary should list:
- Every feature discovered with a brief description
- All data models and their marketing-relevant fields
- All API capabilities
- All UI components and their user-facing functionality
- Key numbers and statistics extracted from the codebase

### Mode: screenshots

Execute only Phase 2 (Browser Screenshots) from the master prompt.

```bash
cd C:\Users\drmwe\Claude\EvoFitTrainer
```

1. Authenticate as trainer on the production site
2. Navigate to each of the 36 pages listed in the prompt
3. Capture desktop (1440x900) and mobile (390x844) screenshots where specified
4. Save all screenshots to `docs/marketing/screenshots/`
5. Generate `docs/marketing/screenshot-inventory.md` with a table of all captured screenshots

### Mode: document

Execute only Phase 3 (Marketing Document Generation) from the master prompt. This mode assumes Phase 1 has already been completed and the analyst has sufficient context about the codebase.

Generate:
- `C:\Users\drmwe\Claude\EvoFitTrainer\docs\marketing\evofit-marketing-business-logic.md`

### Mode: update

Re-analyze recently changed files and update the existing marketing document:

1. Check `git log --oneline -20` for recent changes
2. Identify which feature areas were modified
3. Re-read the modified files
4. Update the corresponding sections in `docs/marketing/evofit-marketing-business-logic.md`
5. Re-capture screenshots for modified pages

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| BASE_URL | https://evofittrainer-six.vercel.app | Production URL for screenshots |
| TRAINER_EMAIL | coach.sarah@evofittrainer.com | Trainer login for authenticated pages |
| TRAINER_PASSWORD | Demo1234! | Trainer password |
| CODEBASE_PATH | C:\Users\drmwe\Claude\EvoFitTrainer | Absolute path to project |
| OUTPUT_DIR | docs/marketing | Output directory for generated files |
| SCREENSHOT_DIR | docs/marketing/screenshots | Screenshot output directory |
| DESKTOP_VIEWPORT | 1440x900 | Desktop screenshot dimensions |
| MOBILE_VIEWPORT | 390x844 | Mobile screenshot dimensions |

## Prerequisites

- Node.js 18+ (for Playwright)
- Playwright installed (`npx playwright install chromium`)
- Working internet connection to reach production site
- Valid demo account credentials (see Configuration)
- At least 2-3 hours for full mode execution

## Key Files

| File | Purpose |
|------|---------|
| `prompts/evofit-marketing-analysis.md` | Master prompt with complete instructions for all phases |
| `docs/marketing/evofit-marketing-business-logic.md` | Output: Main marketing document |
| `docs/marketing/screenshots/` | Output: Captured page screenshots |
| `docs/marketing/screenshot-inventory.md` | Output: Screenshot index with descriptions |
| `docs/marketing/codebase-analysis-summary.md` | Output: Phase 1 analysis summary (analysis mode) |
| `backend/prisma/schema.prisma` | Input: Data model (40+ models) |
| `docs/prd.md` | Input: Product Requirements Document |
| `docs/businesslogic.md` | Input: Existing business logic guide |
| `docs/epics/*.md` | Input: Epic specifications (12 files) |

## Output Quality Standards

The generated marketing document must meet these criteria:

1. **Completeness:** All 12 feature areas documented with the full template (one-line pitch, description, capabilities, benefits, data points, differentiator, copy angles, screenshots, technical notes)
2. **Accuracy:** Every claim traceable to the codebase; no invented features
3. **Accessibility:** Written for non-technical copywriters; no unexplained jargon
4. **Actionability:** Suggested copy angles and headlines that a copywriter can use directly
5. **Specificity:** Concrete numbers, not vague claims (e.g., "1,344 exercises" not "large library")
6. **Honesty:** "Coming soon" features clearly labeled; no misrepresentation of capabilities

## Integration with Other Skills

This skill works well in combination with:
- `evofit-demo-simulator` - Seed demo data before capturing screenshots (ensures pages have content)
- `test-credentials-helper` - Get valid auth credentials for screenshot capture
- `playwright-bowser` - Browser automation for screenshot capture
- `@content-marketer` agent - Take the output document and produce actual marketing copy
- `@brand-guardian` agent - Review output for brand consistency
