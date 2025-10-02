#!/bin/bash

set -e

echo "🚀 Building Agent Arena SDK..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Build core package
echo -e "${BLUE}📦 Building core package...${NC}"
cd packages/core
npm install
npm run build
cd ../..
echo -e "${GREEN}✓ Core built${NC}"
echo ""

# Build CLI
echo -e "${BLUE}🔧 Building CLI...${NC}"
cd packages/cli
npm install
npm run build
cd ../..
echo -e "${GREEN}✓ CLI built${NC}"
echo ""

# Build verifier service
echo -e "${BLUE}🔍 Building verifier service...${NC}"
cd apps/verifier-service
npm install
npm run build
cd ../..
echo -e "${GREEN}✓ Verifier service built${NC}"
echo ""

echo -e "${GREEN}✅ All packages built successfully!${NC}"
echo ""
echo "Next steps:"
echo "  1. Configure .env file"
echo "  2. Test CLI: npx arena --help"
echo "  3. Start services: npm run dev"
echo ""
echo "See SHIP_TODAY.md for complete deployment guide"
