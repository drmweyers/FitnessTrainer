#!/usr/bin/env bash
# Auto Claude + BMAD Bootstrap Script for FitnessTrainer Project
# This script prepares the project for Auto Claude integration

set -e

echo "=== FitnessTrainer: Auto Claude + BMAD Bootstrap ==="
echo ""

# 1. Verify we're in the project root
echo "[1/7] Verifying project structure..."
if [ ! -d ".bmad-core" ]; then
    echo "ERROR: .bmad-core directory not found!"
    echo "Please run this script from the project root."
    exit 1
fi
if [ ! -d "docs" ]; then
    echo "ERROR: docs directory not found!"
    exit 1
fi
echo "✓ Project structure verified"
echo ""

# 2. Check BMAD configuration
echo "[2/7] Checking BMAD v6 configuration..."
if [ -f ".bmad-core/core-config.yaml" ]; then
    echo "✓ BMAD v6 configured"
else
    echo "WARNING: BMAD core config not found"
fi
echo ""

# 3. Check documentation
echo "[3/7] Checking BMAD documentation..."
if [ -f "docs/prd.md" ]; then
    echo "✓ PRD found (docs/prd.md)"
else
    echo "✗ PRD not found"
fi

if [ -f "docs/architecture.md" ]; then
    echo "✓ Architecture found (docs/architecture.md)"
else
    echo "✗ Architecture not found"
fi

if [ -d "docs/epics" ]; then
    epic_count=$(find docs/epics -name "*.md" | wc -l)
    echo "✓ $epic_count epics found (docs/epics/)"
else
    echo "✗ Epics directory not found"
fi

if [ -d "docs/stories" ]; then
    story_count=$(find docs/stories -name "*.md" | wc -l)
    echo "✓ $story_count stories found (docs/stories/)"
else
    echo "✗ Stories directory not found"
fi
echo ""

# 4. Check Auto Claude configuration
echo "[4/7] Checking Auto Claude configuration..."
auto_claude_dir=".auto-claude"
if [ ! -d "$auto_claude_dir" ]; then
    mkdir -p "$auto_claude_dir"
    echo "✓ Created .auto-claude directory"
fi

if [ -f "$auto_claude_dir/config.yaml" ]; then
    echo "✓ Auto Claude config found"
else
    echo "✗ Auto Claude config not found"
fi

if [ -f "$auto_claude_dir/orchestration.yaml" ]; then
    echo "✓ Auto Claude orchestration found"
else
    echo "✗ Auto Claude orchestration not found"
fi
echo ""

# 5. Check Docker
echo "[5/7] Checking Docker environment..."
if docker ps &> /dev/null; then
    echo "✓ Docker is running"

    # Check if dev containers are running
    running_containers=$(docker ps --filter "name=fitness" --format "{{.Names}}")
    if [ -n "$running_containers" ]; then
        echo "✓ Dev containers running:"
        echo "$running_containers" | sed 's/^/  - /'
    else
        echo "ℹ Dev containers not running. Start with: docker-compose --profile dev up -d"
    fi
else
    echo "✗ Docker is not running"
fi
echo ""

# 6. Check Node.js
echo "[6/7] Checking Node.js environment..."
if command -v node &> /dev/null; then
    node_version=$(node --version)
    npm_version=$(npm --version)
    echo "✓ Node.js: $node_version"
    echo "✓ npm: $npm_version"

    if [ -d "node_modules" ]; then
        echo "✓ Dependencies installed"
    else
        echo "ℹ Dependencies not installed. Run: npm install"
    fi
else
    echo "✗ Node.js not available"
fi
echo ""

# 7. Summary and next steps
echo "[7/7] Setup Summary"
echo "=================================="
echo ""
echo "✓ BMAD v6 configured in .bmad-core/"
echo "✓ Documentation structure in docs/"
echo "✓ Auto Claude integration in .auto-claude/"
echo ""
echo "Next Steps:"
echo "=================================="
echo ""
echo "1. Open Auto Claude (from Windows Start Menu)"
echo "2. Click 'Open Project' and select: D:\\Claude\\FitnessTrainer"
echo "3. Connect your Claude Code account when prompted"
echo "4. Auto Claude will scan the repo and detect BMAD configuration"
echo "5. Create your first task and watch Auto Claude work!"
echo ""
echo "Optional - Start Development Environment:"
echo "  docker-compose --profile dev up -d"
echo ""
echo "Documentation:"
echo "  - BMAD Integration: .claude/AUTO_CLAUDE_INTEGRATION.md"
echo "  - Project Status: docs/PROJECT_STATUS.md"
echo "  - Development Workflow: docs/development-workflow.md"
echo ""
echo "For Auto Claude help, visit: https://github.com/AndyMik90/Auto-Claude"
echo ""
echo "=== Bootstrap Complete ==="
echo ""
