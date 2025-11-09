#!/bin/bash

# EVE AI System Testing Script for WSL
# This script runs comprehensive tests for the agent configuration system

set -e  # Exit on any error

echo "🚀 Starting EVE AI System Tests in WSL..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in WSL
if grep -qi microsoft /proc/version; then
    print_status "Running in WSL environment ✓"
else
    print_warning "Not detected as WSL environment"
fi

# Check Node.js version
NODE_VERSION=$(node --version)
print_status "Node.js version: $NODE_VERSION"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
else
    print_status "Dependencies found ✓"
fi

# Create test directories if they don't exist
mkdir -p tests/unit tests/system tests/components coverage

print_status "Test directories ready ✓"

# Function to run test suite with error handling
run_test_suite() {
    local test_name="$1"
    local test_command="$2"
    
    echo ""
    echo "📋 Running $test_name..."
    echo "----------------------------------------"
    
    if eval "$test_command"; then
        print_success "$test_name completed successfully"
        return 0
    else
        print_error "$test_name failed"
        return 1
    fi
}

# Initialize test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Run unit tests
if run_test_suite "Unit Tests" "npm run test:unit"; then
    ((PASSED_TESTS++))
else
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

# Run system tests
if run_test_suite "System Tests" "npm run test:system"; then
    ((PASSED_TESTS++))
else
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

# Run component tests
if run_test_suite "Component Tests" "npm run test:components"; then
    ((PASSED_TESTS++))
else
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

# Run coverage report
echo ""
echo "📊 Generating Coverage Report..."
echo "----------------------------------------"
if npm run test:coverage; then
    print_success "Coverage report generated"
    if [ -f "coverage/index.html" ]; then
        print_status "Coverage report available at: coverage/index.html"
    fi
else
    print_warning "Coverage report generation failed"
fi

# Run linting
echo ""
echo "🔍 Running Code Quality Checks..."
echo "----------------------------------------"
if npm run lint; then
    print_success "Linting passed"
else
    print_warning "Linting issues found"
fi

# Run type checking
echo ""
echo "🔧 Running TypeScript Type Checking..."
echo "----------------------------------------"
if npx tsc --noEmit; then
    print_success "Type checking passed"
else
    print_error "Type checking failed"
fi

# Test build process
echo ""
echo "🏗️  Testing Build Process..."
echo "----------------------------------------"
if npm run build; then
    print_success "Build completed successfully"
    if [ -d "dist" ]; then
        DIST_SIZE=$(du -sh dist | cut -f1)
        print_status "Build output size: $DIST_SIZE"
    fi
else
    print_error "Build failed"
fi

# Test MongoDB connection (if available)
echo ""
echo "🗄️  Testing MongoDB Connection..."
echo "----------------------------------------"
if command -v mongod &> /dev/null; then
    print_status "MongoDB detected, testing connection..."
    if node scripts/test-mongodb-connection.js; then
        print_success "MongoDB connection test passed"
    else
        print_warning "MongoDB connection test failed"
    fi
else
    print_warning "MongoDB not found - system tests may use in-memory database"
fi

# Test Netlify Functions (if available)
echo ""
echo "⚡ Testing Netlify Functions..."
echo "----------------------------------------"
if command -v netlify &> /dev/null; then
    print_status "Netlify CLI detected"
    if npm run functions:build; then
        print_success "Netlify functions built successfully"
    else
        print_warning "Netlify functions build failed"
    fi
else
    print_warning "Netlify CLI not found - skipping function tests"
fi

# Performance check
echo ""
echo "⚡ Performance Check..."
echo "----------------------------------------"
TEST_START_TIME=$(date +%s)
npm run test > /dev/null 2>&1 || true
TEST_END_TIME=$(date +%s)
TEST_DURATION=$((TEST_END_TIME - TEST_START_TIME))
print_status "Full test suite execution time: ${TEST_DURATION}s"

if [ $TEST_DURATION -lt 30 ]; then
    print_success "Test performance: Excellent (< 30s)"
elif [ $TEST_DURATION -lt 60 ]; then
    print_success "Test performance: Good (< 60s)"
else
    print_warning "Test performance: Consider optimization (> 60s)"
fi

# Summary
echo ""
echo "📈 Test Summary"
echo "================================================"
echo "Total Test Suites: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"

if [ $FAILED_TESTS -eq 0 ]; then
    print_success "All test suites passed! 🎉"
    echo ""
    echo "✅ System is ready for development"
    echo "✅ Agent configuration system is functional"
    echo "✅ All validation logic is working"
    echo "✅ UI components are rendering correctly"
    exit 0
else
    print_error "$FAILED_TESTS test suite(s) failed"
    echo ""
    echo "❌ Please fix failing tests before deployment"
    echo "💡 Check the detailed output above for specific issues"
    exit 1
fi