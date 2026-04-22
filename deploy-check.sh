#!/bin/bash

# VitalsEdge Monitoring System - Deployment Verification Script
# Run this before deploying to production

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   VitalsEdge Monitoring System - Pre-Deployment Check     ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check Node.js version
echo -e "${YELLOW}[1/10] Checking Node.js version...${NC}"
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 22 ]; then
  echo -e "${GREEN}✓ Node.js version: $(node -v)${NC}"
else
  echo -e "${RED}✗ Node.js 22+ required. Current: $(node -v)${NC}"
  exit 1
fi

# Check pnpm
echo -e "${YELLOW}[2/10] Checking pnpm...${NC}"
if command -v pnpm &> /dev/null; then
  echo -e "${GREEN}✓ pnpm version: $(pnpm -v)${NC}"
else
  echo -e "${RED}✗ pnpm not found. Install with: npm install -g pnpm${NC}"
  exit 1
fi

# Check dependencies
echo -e "${YELLOW}[3/10] Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}  Installing dependencies...${NC}"
  pnpm install
fi
echo -e "${GREEN}✓ Dependencies installed${NC}"

# TypeScript compilation
echo -e "${YELLOW}[4/10] Running TypeScript compiler...${NC}"
if npx tsc --noEmit 2>&1 | grep -q "error"; then
  echo -e "${RED}✗ TypeScript compilation failed${NC}"
  npx tsc --noEmit
  exit 1
else
  echo -e "${GREEN}✓ TypeScript compilation successful${NC}"
fi

# Build check
echo -e "${YELLOW}[5/10] Building for production...${NC}"
if pnpm run build; then
  echo -e "${GREEN}✓ Production build successful${NC}"
  DIST_SIZE=$(du -sh dist | cut -f1)
  echo -e "${GREEN}  Build size: ${DIST_SIZE}${NC}"
else
  echo -e "${RED}✗ Production build failed${NC}"
  exit 1
fi

# Check critical files
echo -e "${YELLOW}[6/10] Verifying critical files...${NC}"
REQUIRED_FILES=("dist/index.html" "src/firebase.ts" "package.json" "vite.config.ts")
for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ] || [ -d "$file" ]; then
    echo -e "${GREEN}✓ $file exists${NC}"
  else
    echo -e "${RED}✗ $file missing${NC}"
    exit 1
  fi
done

# Environment variables
echo -e "${YELLOW}[7/10] Checking environment variables...${NC}"
if [ -f ".env.production" ]; then
  echo -e "${GREEN}✓ .env.production file exists${NC}"
else
  echo -e "${YELLOW}⚠ .env.production not found (will use defaults)${NC}"
fi

# Firebase configuration
echo -e "${YELLOW}[8/10] Verifying Firebase configuration...${NC}"
if [ -f "firebase.json" ] && [ -f "firebase-minimal.json" ]; then
  echo -e "${GREEN}✓ Firebase configuration files present${NC}"
else
  echo -e "${RED}✗ Firebase configuration files missing${NC}"
  exit 1
fi

# Check for production-safe code
echo -e "${YELLOW}[9/10] Checking for debugging code...${NC}"
if grep -r "console.log\|debugger\|DEBUG" src --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules" | grep -q "."; then
  echo -e "${YELLOW}⚠ Warning: Found console.log/debugger statements in code${NC}"
  echo -e "${YELLOW}  Consider removing these for production${NC}"
else
  echo -e "${GREEN}✓ No obvious debugging code found${NC}"
fi

# Security check
echo -e "${YELLOW}[10/10] Running security checks...${NC}"
if grep -r "apiKey\|password\|secret" src/.env* --include="*.ts" --include="*.tsx" 2>/dev/null; then
  echo -e "${YELLOW}⚠ Warning: Found potential hardcoded secrets in code${NC}"
else
  echo -e "${GREEN}✓ No hardcoded secrets detected${NC}"
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          ✓ All Pre-Deployment Checks Passed              ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Run: firebase deploy --only hosting"
echo "2. Or use Docker:  docker build -t vitalsedge:latest . && docker run -p 3000:3000 vitalsedge:latest"
echo "3. Or use Docker Compose: docker-compose up -d"
echo ""
echo -e "${GREEN}✓ Ready for deployment!${NC}"
