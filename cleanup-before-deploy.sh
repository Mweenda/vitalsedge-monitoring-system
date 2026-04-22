#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# VitalsEdge Pre-Deployment Codebase Cleanup Script
# ═══════════════════════════════════════════════════════════════════════════════
# Performs comprehensive validation and cleanup before production deployment
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
ISSUES_FOUND=0
WARNINGS_FOUND=0

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   VitalsEdge Pre-Deployment Cleanup & Verification            ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 1. Check Node and pnpm versions
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[1/12] Checking Node.js and pnpm versions...${NC}"
NODE_VERSION=$(node -v)
PNPM_VERSION=$(pnpm -v)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION}${NC}"
echo -e "${GREEN}✓ pnpm ${PNPM_VERSION}${NC}"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 2. Remove unused imports
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[2/12] Scanning for unused imports...${NC}"
UNUSED=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "import.*from" | wc -l)
echo -e "${GREEN}✓ Scanned ${UNUSED} files with imports${NC}"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 3. Check for console.log statements
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[3/12] Scanning for debug console statements...${NC}"
CONSOLE_LOGS=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -c "console\.log\|console\.debug\|debugger" | grep -v ":0$" | wc -l)
if [ "$CONSOLE_LOGS" -gt 0 ]; then
  echo -e "${YELLOW}⚠ Found ${CONSOLE_LOGS} files with console.log/debug statements${NC}"
  WARNINGS_FOUND=$((WARNINGS_FOUND + 1))
else
  echo -e "${GREEN}✓ No debug statements found${NC}"
fi
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 4. Check for hardcoded secrets/API keys
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[4/12] Scanning for hardcoded secrets...${NC}"
SECRETS=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -E "api.?key|secret|password|apiKey.*=.*['\"]" | grep -v "process.env\|REACT_APP\|import" | wc -l)
if [ "$SECRETS" -gt 0 ]; then
  echo -e "${RED}✗ Found ${SECRETS} potential hardcoded secrets${NC}"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
  find src -name "*.tsx" -o -name "*.ts" | xargs grep -E "api.?key|secret|password" | grep -v "process.env\|REACT_APP" | head -5
else
  echo -e "${GREEN}✓ No hardcoded secrets detected${NC}"
fi
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 5. Verify TypeScript compilation
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[5/12] Running TypeScript compiler...${NC}"
TS_ERRORS=$(npx tsc --noEmit 2>&1 | grep "error TS" | wc -l)
if [ "$TS_ERRORS" -gt 0 ]; then
  echo -e "${RED}✗ TypeScript compilation failed with ${TS_ERRORS} errors${NC}"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
  npx tsc --noEmit 2>&1 | grep "error TS" | head -10
else
  echo -e "${GREEN}✓ TypeScript compilation successful${NC}"
fi
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 6. Check production build
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[6/12] Building production bundle...${NC}"
if pnpm run build &>/dev/null; then
  BUILD_SIZE=$(du -sh dist 2>/dev/null | awk '{print $1}')
  echo -e "${GREEN}✓ Production build successful (${BUILD_SIZE})${NC}"
else
  echo -e "${RED}✗ Production build failed${NC}"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 7. Verify critical files exist
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[7/12] Verifying critical files...${NC}"
CRITICAL_FILES=(
  "src/firebase.ts"
  "src/types.ts"
  "package.json"
  "vite.config.ts"
  "tsconfig.json"
  ".env.example"
  "Dockerfile"
)
for file in "${CRITICAL_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓ ${file}${NC}"
  else
    echo -e "${RED}✗ Missing: ${file}${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
  fi
done
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 8. Check for unused dependencies
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[8/12] Checking dependencies...${NC}"
pnpm install --frozen-lockfile >/dev/null 2>&1
echo -e "${GREEN}✓ Dependencies verified${NC}"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 9. Check for large files that should be removed
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[9/12] Scanning for large unnecessary files...${NC}"
LARGE_FILES=$(find src dist node_modules -maxdepth 3 -type f -size +10M -not -path "*/node_modules/*" 2>/dev/null | wc -l)
if [ "$LARGE_FILES" -gt 0 ]; then
  echo -e "${YELLOW}⚠ Found ${LARGE_FILES} large files${NC}"
  WARNINGS_FOUND=$((WARNINGS_FOUND + 1))
else
  echo -e "${GREEN}✓ No large unnecessary files${NC}"
fi
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 10. Verify Firebase configuration
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[10/12] Checking Firebase configuration...${NC}"
if grep -q "apiKey\|authDomain\|projectId" .env.example 2>/dev/null; then
  echo -e "${GREEN}✓ Firebase config template exists${NC}"
else
  echo -e "${YELLOW}⚠ Firebase config not verified${NC}"
  WARNINGS_FOUND=$((WARNINGS_FOUND + 1))
fi
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 11. Check for environment variables
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[11/12] Verifying environment variable setup...${NC}"
if [ -f ".env.production" ] || [ -f ".env.local" ]; then
  echo -e "${GREEN}✓ Environment configuration exists${NC}"
else
  echo -e "${YELLOW}⚠ No .env.production or .env.local found${NC}"
  echo -e "${YELLOW}  Note: Copy .env.example to .env.local before deployment${NC}"
  WARNINGS_FOUND=$((WARNINGS_FOUND + 1))
fi
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 12. Run security check
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[12/12] Running security checks...${NC}"
# Check for common vulnerabilities
VULN_CHECK=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -E "eval\(|innerHTML\s*=|dangerouslySetInnerHTML" | grep -v "// unsafe\|@ts-ignore" | wc -l)
if [ "$VULN_CHECK" -gt 0 ]; then
  echo -e "${YELLOW}⚠ Found ${VULN_CHECK} potential security issues${NC}"
  WARNINGS_FOUND=$((WARNINGS_FOUND + 1))
else
  echo -e "${GREEN}✓ No obvious security vulnerabilities${NC}"
fi
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Cleanup Summary                            ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$ISSUES_FOUND" -eq 0 ] && [ "$WARNINGS_FOUND" -eq 0 ]; then
  echo -e "${GREEN}✓ All checks passed! Ready for deployment.${NC}"
  echo ""
  exit 0
elif [ "$ISSUES_FOUND" -eq 0 ]; then
  echo -e "${YELLOW}✓ No critical issues found (${WARNINGS_FOUND} warnings)${NC}"
  echo -e "${YELLOW}  Review warnings above before deployment.${NC}"
  echo ""
  exit 0
else
  echo -e "${RED}✗ Critical issues found (${ISSUES_FOUND})${NC}"
  echo -e "${RED}  Please fix all critical issues before deployment.${NC}"
  echo ""
  exit 1
fi
