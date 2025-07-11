#!/bin/bash

# Configuration
API_URL="http://localhost:8000"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"  # Go up two levels: backend -> apps -> root
TEST_PDF="$PROJECT_ROOT/data/input/sample-invoice.pdf"
TEST_PDF2="$PROJECT_ROOT/data/input/wordpress-pdf-invoice-plugin-sample.pdf"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check for .env file
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo -e "${RED}Error: .env file not found in $SCRIPT_DIR"
    echo -e "Please create a .env file with your Mistral API key:${NC}"
    echo -e "MISTRAL_API_KEY=your_api_key"
    exit 1
fi

# Verify test files exist
if [ ! -f "$TEST_PDF" ]; then
    echo -e "${RED}Error: Test file not found: $TEST_PDF${NC}"
    exit 1
fi

if [ ! -f "$TEST_PDF2" ]; then
    echo -e "${RED}Error: Test file not found: $TEST_PDF2${NC}"
    exit 1
fi

echo "Testing Invoice Parser API"
echo "========================"
echo -e "${YELLOW}Using test files:${NC}"
echo -e "PDF 1: $TEST_PDF"
echo -e "PDF 2: $TEST_PDF2"

# Test health check
echo -e "\n1. Testing health check endpoint..."
health_response=$(curl -s "${API_URL}/")
if [[ $health_response == *"running"* ]]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}✗ Health check failed${NC}"
    echo "Response: $health_response"
    exit 1
fi

# Test single document processing
echo -e "\n2. Testing single document processing..."
echo -e "${YELLOW}Request${NC}: POST ${API_URL}/process/document"
echo -e "${YELLOW}File${NC}: ${TEST_PDF}"

# Use -v for verbose output and capture both stdout and stderr
single_response=$(curl -v -X POST \
    -F "file=@${TEST_PDF}" \
    "${API_URL}/process/document" 2>&1)

echo -e "${YELLOW}Response Body:${NC}"
echo "$single_response"

if [[ $single_response == *"success"* ]]; then
    echo -e "${GREEN}✓ Single document processing successful${NC}"
else
    echo -e "${RED}✗ Single document processing failed${NC}"
    exit 1
fi

# Test multiple document processing
echo -e "\n3. Testing multiple document processing..."
echo -e "${YELLOW}Request${NC}: POST ${API_URL}/process/documents"
echo -e "${YELLOW}Files${NC}: ${TEST_PDF}, ${TEST_PDF2}"

multi_response=$(curl -v -X POST \
    -F "files=@${TEST_PDF}" \
    -F "files=@${TEST_PDF2}" \
    "${API_URL}/process/documents" 2>&1)

echo -e "${YELLOW}Response Body:${NC}"
echo "$multi_response"

if [[ $multi_response == *"success"* ]]; then
    echo -e "${GREEN}✓ Multiple document processing successful${NC}"
else
    echo -e "${RED}✗ Multiple document processing failed${NC}"
    exit 1
fi

echo -e "\n${GREEN}All tests passed!${NC}"
