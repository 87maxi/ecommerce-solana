#!/bin/bash

# deploy.sh - Ecommerce Contract Deployment and Testing Script
# Generated with [Continue](https://continue.dev)
# Co-Authored-By: Continue <noreply@continue.dev>

set -e

echo "🚀 Starting Ecommerce contract deployment and testing process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    local color="$1"
    local message="$2"
    echo -e "${color}${message}${NC}"
}

# Step 1: Compile the contracts
print_color "$BLUE" "🎨 Compiling contracts..."
forge build --force
print_color "$GREEN" "✅ Contracts compiled successfully"

# Step 2: Start Anvil local node
print_color "$BLUE" "🔧 Starting Anvil local blockchain..."
anvil &
ANVIL_PID=$!
sleep 3

# Cleanup function
cleanup() {
    print_color "$YELLOW" "🧹 Cleaning up..."
    if [ ! -z "$ANVIL_PID" ] && kill -0 "$ANVIL_PID" 2>/dev/null; then
        kill "$ANVIL_PID"
    fi
}

# Trap to ensure cleanup on script exit
trap cleanup EXIT

# Step 3: Run tests
print_color "$BLUE" "🧪 Running functionality and security tests..."
forge test --ffi --fork-url http://localhost:8545 -vvv
print_color "$GREEN" "✅ All tests passed successfully"

# Step 4: Run gas report
print_color "$BLUE" "📊 Generating gas report..."
forge gas-report --fork-url http://localhost:8545
print_color "$GREEN" "✅ Gas report generated"

# Step 5: Deploy contract
print_color "$BLUE" "🚀 Deploying Ecommerce contract..."

# Use first anvil account as mock ERC20 address
EURO_TOKEN_ADDR="$(cast rpc anvil_accounts | jq -r '.result[0]')"

# Deploy mock ERC20
print_color "$YELLOW" "💸 Deploying mock EuroToken..."
EURO_TOKEN_DEPLOY=$(cast send --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 "0x0000000000000000000000000000000000000000" --create "$(cast abi-encode "constructor(string,string,uint8)(string memory name_, string memory symbol_, uint8 decimals_)" "Euro Token" "EURT" 18)" --rpc-url http://localhost:8545)
MOCK_EURO_TOKEN=$(echo "$EURO_TOKEN_DEPLOY" | jq -r '.logs[0].inner.address' | cut -c 3-)

print_color "$GREEN" "✅ Mock EuroToken deployed at: $MOCK_EURO_TOKEN"

# Deploy Ecommerce contract
print_color "$YELLOW" "🏭 Deploying Ecommerce contract with EuroToken: $MOCK_EURO_TOKEN..."
DEPLOY_OUTPUT=$(cast send --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 "0x0000000000000000000000000000000000000000" --create "$(cast abi-encode "constructor(address _euroTokenAddress)(address _euroTokenAddress)" "$MOCK_EURO_TOKEN")" --rpc-url http://localhost:8545)

CONTRACT_ADDR=$(echo "$DEPLOY_OUTPUT" | jq -r '.logs[0].inner.address' | cut -c 3-)

echo "$DEPLOY_OUTPUT" > deployment.json

print_color "$GREEN" "✅ Ecommerce contract deployed at: $CONTRACT_ADDR"
print_color "$GREEN" "✅ Deployment details saved to deployment.json"

# Step 6: Verify deployment
print_color "$BLUE" "🔍 Verifying deployment..."

# Check contract exists
cast code "$CONTRACT_ADDR" --rpc-url http://localhost:8545 > /dev/null
if [ $? -eq 0 ]; then
    print_color "$GREEN" "✅ Contract code verified on blockchain"
else
    print_color "$RED" "❌ Contract verification failed"
    exit 1
fi

# Print deployment summary
print_color "$GREEN" "\n🎉 Deployment Summary:"
print_color "$YELLOW" "   Network: Local Anvil"
print_color "$YELLOW" "   Ecommerce Contract: $CONTRACT_ADDR"
print_color "$YELLOW" "   EuroToken Mock: $MOCK_EURO_TOKEN"
print_color "$YELLOW" "   Owner: $(cast rpc anvil_accounts | jq -r '.result[0]' | cut -c 3-)"

print_color "$GREEN" "\n✨ Ecommerce contract deployment process completed successfully!\n"

# Keep anvil running if requested
read -p "Do you want to keep Anvil running in background? (y/n): " KEEP_ANSWER
if [[ "$KEEP_ANSWER" =~ ^[Yy]$ ]]; then
    trap 'kill $ANVIL_PID' EXIT
    print_color "$YELLOW" "Anvil will continue running. Use 'kill $ANVIL_PID' to stop it."
    wait $ANVIL_PID
else
    cleanup
fi