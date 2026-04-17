#!/bin/bash
# =============================================================================
# FORGE QA Warfare v4 — Integrity Pipeline Runner
# =============================================================================
#
# Executes the 3-layer integrity test suite in strict order.  Each layer must
# pass before the next layer runs — early failures prevent spending time on
# tests that would be invalidated by a crashing page (Layer 1) or missing
# render (Layer 2).
#
# Layer 1 — Error Boundary Sweep
#   File:    tests/e2e/simulations/integrity/error-boundary-sweep.spec.ts
#   Purpose: Visit every route for every role; catch JS crashes and error
#            boundary screens before any data assertions run.
#
# Layer 2 — Rendered Data Assertions (RDA)
#   Files:   tests/e2e/simulations/integrity/*-data-rendering.spec.ts
#   Purpose: Confirm that the UI actually renders seeded DB records — catches
#            blank states, loading spinners stuck, and N+1 / fetch regressions.
#
# Layer 3 — Data Completeness Verification (DCV)  [optional — skipped if absent]
#   Files:   tests/e2e/simulations/integrity/*-data-completeness.spec.ts
#   Purpose: Deep assertion that every seeded record appears with all expected
#            fields; catches silent data-loss and mapping bugs.
#
# Usage:
#   ./scripts/run-integrity-pipeline.sh
#   E2E_BASE_URL=https://trainer.evofit.io ./scripts/run-integrity-pipeline.sh
#
# Exit codes:
#   0  — all layers passed (or Layer 3 was skipped because no DCV specs exist)
#   1  — Layer 1 failed (abort — no point running further layers)
#   2  — Layer 2 failed
#   3  — Layer 3 failed
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
BASE_URL="${E2E_BASE_URL:-http://localhost:3000}"
INTEGRITY_CONFIG="tests/e2e/simulations/playwright.integrity.config.ts"
INTEGRITY_DIR="tests/e2e/simulations/integrity"

# Colour helpers (disabled when not a TTY so CI logs stay clean)
if [ -t 1 ]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  CYAN='\033[0;36m'
  BOLD='\033[1m'
  RESET='\033[0m'
else
  RED='' GREEN='' YELLOW='' CYAN='' BOLD='' RESET=''
fi

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
header()  { echo -e "\n${BOLD}${CYAN}$*${RESET}"; }
success() { echo -e "${GREEN}  ✓  $*${RESET}"; }
failure() { echo -e "${RED}  ✗  $*${RESET}"; }
info()    { echo -e "${YELLOW}  →  $*${RESET}"; }

# Track layer results for the final summary table
LAYER1_STATUS="SKIP"
LAYER2_STATUS="SKIP"
LAYER3_STATUS="SKIP"
LAYER1_EXIT=0
LAYER2_EXIT=0
LAYER3_EXIT=0

# ---------------------------------------------------------------------------
# Pre-flight
# ---------------------------------------------------------------------------
header "FORGE QA Warfare v4 — Integrity Pipeline"
echo "  Target URL : ${BASE_URL}"
echo "  Config     : ${INTEGRITY_CONFIG}"
echo "  Test dir   : ${INTEGRITY_DIR}"
echo ""

# Validate that the config file and test directory exist
if [ ! -f "${INTEGRITY_CONFIG}" ]; then
  failure "Config not found: ${INTEGRITY_CONFIG}"
  exit 1
fi

if [ ! -d "${INTEGRITY_DIR}" ]; then
  failure "Integrity test directory not found: ${INTEGRITY_DIR}"
  exit 1
fi

# Ensure the output directory exists so reporters can write to it
mkdir -p test-results/integrity/html
mkdir -p test-results/integrity/artifacts

# Base Playwright invocation shared by all layers
PW_BASE="npx playwright test --config ${INTEGRITY_CONFIG}"
# Pass base URL via env so the integrity config picks it up
export E2E_BASE_URL="${BASE_URL}"

# ---------------------------------------------------------------------------
# Layer 1 — Error Boundary Sweep
# ---------------------------------------------------------------------------
header "Layer 1 — Error Boundary Sweep"
info "Visiting every route × role combination and asserting no crashes"

LAYER1_FILE="${INTEGRITY_DIR}/error-boundary-sweep.spec.ts"

if [ ! -f "${LAYER1_FILE}" ]; then
  info "Layer 1 spec not found — skipping (${LAYER1_FILE})"
  LAYER1_STATUS="SKIP"
else
  set +e
  ${PW_BASE} "${LAYER1_FILE}" 2>&1
  LAYER1_EXIT=$?
  set -e

  if [ ${LAYER1_EXIT} -eq 0 ]; then
    success "Layer 1 PASSED"
    LAYER1_STATUS="PASS"
  else
    failure "Layer 1 FAILED — aborting pipeline (exit ${LAYER1_EXIT})"
    LAYER1_STATUS="FAIL"

    # Print summary and exit — no point running render assertions when pages crash
    echo ""
    echo -e "${BOLD}Pipeline Summary${RESET}"
    echo "  Layer 1 — Error Boundary Sweep       : ${RED}FAIL${RESET}"
    echo "  Layer 2 — Rendered Data Assertions   : ${YELLOW}ABORTED${RESET}"
    echo "  Layer 3 — Data Completeness Verify   : ${YELLOW}ABORTED${RESET}"
    echo ""
    echo "HTML report : test-results/integrity/html/index.html"
    echo "JSON report : test-results/integrity/results.json"
    exit 1
  fi
fi

# ---------------------------------------------------------------------------
# Layer 2 — Rendered Data Assertions
# ---------------------------------------------------------------------------
header "Layer 2 — Rendered Data Assertions (RDA)"
info "Verifying seeded DB records render correctly in the UI"

# Collect all *-data-rendering specs
RDA_FILES=( ${INTEGRITY_DIR}/*-data-rendering.spec.ts )

if [ ${#RDA_FILES[@]} -eq 0 ] || [ ! -f "${RDA_FILES[0]}" ]; then
  info "No data-rendering specs found — skipping Layer 2"
  LAYER2_STATUS="SKIP"
else
  info "Found ${#RDA_FILES[@]} data-rendering spec(s)"
  set +e
  ${PW_BASE} ${RDA_FILES[@]} 2>&1
  LAYER2_EXIT=$?
  set -e

  if [ ${LAYER2_EXIT} -eq 0 ]; then
    success "Layer 2 PASSED"
    LAYER2_STATUS="PASS"
  else
    failure "Layer 2 FAILED — aborting pipeline (exit ${LAYER2_EXIT})"
    LAYER2_STATUS="FAIL"

    echo ""
    echo -e "${BOLD}Pipeline Summary${RESET}"
    echo "  Layer 1 — Error Boundary Sweep       : ${GREEN}PASS${RESET}"
    echo "  Layer 2 — Rendered Data Assertions   : ${RED}FAIL${RESET}"
    echo "  Layer 3 — Data Completeness Verify   : ${YELLOW}ABORTED${RESET}"
    echo ""
    echo "HTML report : test-results/integrity/html/index.html"
    echo "JSON report : test-results/integrity/results.json"
    exit 2
  fi
fi

# ---------------------------------------------------------------------------
# Layer 3 — Data Completeness Verification (DCV)
# ---------------------------------------------------------------------------
header "Layer 3 — Data Completeness Verification (DCV)"
info "Asserting every seeded record appears with all expected fields"

DCV_FILES=( ${INTEGRITY_DIR}/*data-completeness*.spec.ts )

if [ ${#DCV_FILES[@]} -eq 0 ] || [ ! -f "${DCV_FILES[0]}" ]; then
  info "No data-completeness specs found yet — Layer 3 skipped"
  info "Add *-data-completeness.spec.ts files to ${INTEGRITY_DIR} to enable"
  LAYER3_STATUS="SKIP"
else
  info "Found ${#DCV_FILES[@]} data-completeness spec(s)"
  set +e
  ${PW_BASE} ${DCV_FILES[@]} 2>&1
  LAYER3_EXIT=$?
  set -e

  if [ ${LAYER3_EXIT} -eq 0 ]; then
    success "Layer 3 PASSED"
    LAYER3_STATUS="PASS"
  else
    failure "Layer 3 FAILED (exit ${LAYER3_EXIT})"
    LAYER3_STATUS="FAIL"
  fi
fi

# ---------------------------------------------------------------------------
# Final Summary
# ---------------------------------------------------------------------------
header "Pipeline Complete"

format_status() {
  case "$1" in
    PASS) echo -e "${GREEN}PASS${RESET}" ;;
    FAIL) echo -e "${RED}FAIL${RESET}" ;;
    SKIP) echo -e "${YELLOW}SKIP${RESET}" ;;
    *)    echo "$1" ;;
  esac
}

echo ""
echo -e "${BOLD}  Integrity Pipeline Summary${RESET}"
echo "  ─────────────────────────────────────────────────"
echo -e "  Layer 1 — Error Boundary Sweep       : $(format_status ${LAYER1_STATUS})"
echo -e "  Layer 2 — Rendered Data Assertions   : $(format_status ${LAYER2_STATUS})"
echo -e "  Layer 3 — Data Completeness Verify   : $(format_status ${LAYER3_STATUS})"
echo "  ─────────────────────────────────────────────────"
echo "  HTML report : test-results/integrity/html/index.html"
echo "  JSON report : test-results/integrity/results.json"
echo ""

# Exit non-zero if Layer 3 failed (Layers 1+2 failures already exited above)
if [ "${LAYER3_STATUS}" = "FAIL" ]; then
  exit 3
fi

exit 0
