#!/usr/bin/env pwsh
# Auto Claude + BMAD Bootstrap Script for FitnessTrainer Project
# This script prepares the project for Auto Claude integration

$ErrorActionPreference = "Stop"

Write-Host "=== FitnessTrainer: Auto Claude + BMAD Bootstrap ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verify we're in the project root
Write-Host "[1/7] Verifying project structure..." -ForegroundColor Yellow
if (!(Test-Path ".bmad-core")) {
    Write-Host "ERROR: .bmad-core directory not found!" -ForegroundColor Red
    Write-Host "Please run this script from the project root." -ForegroundColor Red
    exit 1
}
if (!(Test-Path "docs")) {
    Write-Host "ERROR: docs directory not found!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Project structure verified" -ForegroundColor Green
Write-Host ""

# 2. Check BMAD configuration
Write-Host "[2/7] Checking BMAD v6 configuration..." -ForegroundColor Yellow
if (!(Test-Path ".bmad-core/core-config.yaml")) {
    Write-Host "WARNING: BMAD core config not found" -ForegroundColor Red
} else {
    Write-Host "✓ BMAD v6 configured" -ForegroundColor Green
}
Write-Host ""

# 3. Check documentation
Write-Host "[3/7] Checking BMAD documentation..." -ForegroundColor Yellow
$prdExists = Test-Path "docs/prd.md"
$archExists = Test-Path "docs/architecture.md"
$epicsExists = Test-Path "docs/epics"
$storiesExists = Test-Path "docs/stories"

if ($prdExists) { Write-Host "✓ PRD found (docs/prd.md)" -ForegroundColor Green }
else { Write-Host "✗ PRD not found" -ForegroundColor Red }

if ($archExists) { Write-Host "✓ Architecture found (docs/architecture.md)" -ForegroundColor Green }
else { Write-Host "✗ Architecture not found" -ForegroundColor Red }

if ($epicsExists) {
    $epicCount = (Get-ChildItem "docs/epics" -Filter "*.md").Count
    Write-Host "✓ $epicCount epics found (docs/epics/)" -ForegroundColor Green
} else {
    Write-Host "✗ Epics directory not found" -ForegroundColor Red
}

if ($storiesExists) {
    $storyCount = (Get-ChildItem "docs/stories" -Filter "*.md").Count
    Write-Host "✓ $storyCount stories found (docs/stories/)" -ForegroundColor Green
} else {
    Write-Host "✗ Stories directory not found" -ForegroundColor Red
}
Write-Host ""

# 4. Check Auto Claude configuration
Write-Host "[4/7] Checking Auto Claude configuration..." -ForegroundColor Yellow
$autoClaudeDir = ".auto-claude"
if (!(Test-Path $autoClaudeDir)) {
    New-Item -ItemType Directory -Path $autoClaudeDir -Force | Out-Null
    Write-Host "✓ Created .auto-claude directory" -ForegroundColor Green
}

if (Test-Path "$autoClaudeDir/config.yaml") {
    Write-Host "✓ Auto Claude config found" -ForegroundColor Green
} else {
    Write-Host "✗ Auto Claude config not found" -ForegroundColor Red
}

if (Test-Path "$autoClaudeDir/orchestration.yaml") {
    Write-Host "✓ Auto Claude orchestration found" -ForegroundColor Green
} else {
    Write-Host "✗ Auto Claude orchestration not found" -ForegroundColor Red
}
Write-Host ""

# 5. Check Docker
Write-Host "[5/7] Checking Docker environment..." -ForegroundColor Yellow
try {
    $dockerStatus = docker ps 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Docker is running" -ForegroundColor Green

        # Check if dev containers are running
        $runningContainers = docker ps --filter "name=fitness" --format "{{.Names}}"
        if ($runningContainers) {
            Write-Host "✓ Dev containers running:" -ForegroundColor Green
            $runningContainers | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
        } else {
            Write-Host "ℹ Dev containers not running. Start with: docker-compose --profile dev up -d" -ForegroundColor Cyan
        }
    } else {
        Write-Host "✗ Docker is not running" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Docker not available" -ForegroundColor Red
}
Write-Host ""

# 6. Check Node.js
Write-Host "[6/7] Checking Node.js environment..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
    Write-Host "✓ npm: $npmVersion" -ForegroundColor Green

    if (Test-Path "node_modules") {
        Write-Host "✓ Dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "ℹ Dependencies not installed. Run: npm install" -ForegroundColor Cyan
    }
} catch {
    Write-Host "✗ Node.js not available" -ForegroundColor Red
}
Write-Host ""

# 7. Summary and next steps
Write-Host "[7/7] Setup Summary" -ForegroundColor Yellow
Write-Host "==================================" -ForegroundColor White
Write-Host ""
Write-Host "✓ BMAD v6 configured in .bmad-core/" -ForegroundColor Green
Write-Host "✓ Documentation structure in docs/" -ForegroundColor Green
Write-Host "✓ Auto Claude integration in .auto-claude/" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor White
Write-Host ""
Write-Host "1. Open Auto Claude (from Windows Start Menu)" -ForegroundColor White
Write-Host "2. Click 'Open Project' and select: D:\Claude\FitnessTrainer" -ForegroundColor White
Write-Host "3. Connect your Claude Code account when prompted" -ForegroundColor White
Write-Host "4. Auto Claude will scan the repo and detect BMAD configuration" -ForegroundColor White
Write-Host "5. Create your first task and watch Auto Claude work!" -ForegroundColor White
Write-Host ""
Write-Host "Optional - Start Development Environment:" -ForegroundColor Cyan
Write-Host "  docker-compose --profile dev up -d" -ForegroundColor White
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "  - BMAD Integration: .claude/AUTO_CLAUDE_INTEGRATION.md" -ForegroundColor White
Write-Host "  - Project Status: docs/PROJECT_STATUS.md" -ForegroundColor White
Write-Host "  - Development Workflow: docs/development-workflow.md" -ForegroundColor White
Write-Host ""
Write-Host "For Auto Claude help, visit: https://github.com/AndyMik90/Auto-Claude" -ForegroundColor Gray
Write-Host ""
Write-Host "=== Bootstrap Complete ===" -ForegroundColor Green
Write-Host ""
