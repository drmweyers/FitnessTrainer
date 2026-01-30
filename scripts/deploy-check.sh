#!/bin/bash

# EvoFit Trainer - Pre-Deployment Check Script
# Run this before deploying to Vercel

echo "================================"
echo "EvoFit Pre-Deployment Check"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Environment Variables
echo "📋 Checking environment variables..."
missing_vars=()

if [ -z "$DATABASE_URL" ]; then missing_vars+=("DATABASE_URL"); fi
if [ -z "$NEXTAUTH_SECRET" ]; then missing_vars+=("NEXTAUTH_SECRET"); fi
if [ -z "$NEXTAUTH_URL" ]; then missing_vars+=("NEXTAUTH_URL"); fi
if [ -z "$JWT_SECRET" ]; then missing_vars+=("JWT_SECRET"); fi

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo -e "${RED}❌ Missing environment variables: ${missing_vars[*]}${NC}"
else
    echo -e "${GREEN}✅ All required environment variables set${NC}"
fi
echo ""

# Check 2: Build
echo "🔨 Testing production build..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    echo "Run 'npm run build' to see errors"
fi
echo ""

# Check 3: Type Check
echo "🔍 Running type check..."
npm run type-check > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ No type errors${NC}"
else
    echo -e "${YELLOW}⚠️  Type errors present (build with type check disabled)${NC}"
fi
echo ""

# Check 4: Lint
echo "🧹 Running linter..."
npm run lint > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ No lint errors${NC}"
else
    echo -e "${YELLOW}⚠️  Lint warnings present${NC}"
fi
echo ""

# Check 5: Tests
echo "🧪 Running tests..."
npm test -- --passWithNoTests > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Tests passing${NC}"
else
    echo -e "${YELLOW}⚠️  Some tests failing${NC}"
fi
echo ""

# Check 6: Security Audit
echo "🔒 Security audit..."
npm audit --production > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ No vulnerabilities${NC}"
else
    echo -e "${YELLOW}⚠️  Vulnerabilities found (see DEPLOYMENT-CHECKLIST.md)${NC}"
fi
echo ""

# Summary
echo "================================"
echo "Pre-Deployment Check Complete"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Review DEPLOYMENT-CHECKLIST.md"
echo "2. Set Vercel environment variables"
echo "3. Deploy: git push origin main"
echo "4. Monitor: vercel logs"
echo ""
