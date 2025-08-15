#!/bin/bash

# SongSync Stripe Integration Test Script
# Tests all mock Stripe API endpoints

echo "🧪 Testing SongSync Mock Stripe Integration..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

BASE_URL="http://localhost:3001/api/stripe"
TOTAL_TESTS=0
PASSED_TESTS=0

# Test function
run_test() {
    local test_name="$1"
    local endpoint="$2"
    local method="$3"
    local data="$4"
    local expected_status="$5"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "\n${BLUE}🧪 Test: $test_name${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo "$response" | sed -e 's/HTTPSTATUS\:.*//g')
    
    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ PASSED - HTTP $http_code${NC}"
        echo -e "${BLUE}Response: ${body:0:100}...${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAILED - Expected HTTP $expected_status, got $http_code${NC}"
        echo -e "${RED}Response: $body${NC}"
    fi
}

# Check if server is running
echo -e "${BLUE}🏥 Checking if mock server is running...${NC}"
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${RED}❌ Mock server is not running. Please start it first:${NC}"
    echo -e "${YELLOW}cd server && npm start${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Mock server is running${NC}"

# Test 1: Health Check
run_test "Health Check" "/../../health" "GET" "" 200

# Test 2: Get Config
run_test "Get Stripe Config" "/config" "GET" "" 200

# Test 3: Get Plans
run_test "Get Available Plans" "/plans" "GET" "" 200

# Test 4: Create Customer
CUSTOMER_DATA='{"email":"test@songsync.com","name":"Test User"}'
run_test "Create Customer" "/customers" "POST" "$CUSTOMER_DATA" 200

# Test 5: Create Payment Method
PAYMENT_METHOD_DATA='{"type":"card","card":{"brand":"visa","last4":"4242","exp_month":12,"exp_year":2025}}'
run_test "Create Payment Method" "/payment_methods" "POST" "$PAYMENT_METHOD_DATA" 200

# Test 6: Create Basic Subscription
SUBSCRIPTION_DATA='{"customer":"cus_mock_test","items":[{"price":"price_mock_basic_plan"}],"default_payment_method":"pm_mock_card"}'
echo -e "\n${BLUE}🧪 Test: Create Basic Subscription${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X "POST" -H "Content-Type: application/json" -d "$SUBSCRIPTION_DATA" "$BASE_URL/subscriptions")
http_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
body=$(echo "$response" | sed -e 's/HTTPSTATUS\:.*//g')

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ PASSED - HTTP $http_code${NC}"
    echo -e "${BLUE}Response: ${body:0:100}...${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    # Extract subscription ID for later tests
    SUB_ID=$(echo "$body" | grep -o '"id":"[^"]*"' | head -n1 | cut -d'"' -f4)
    echo -e "${BLUE}Extracted subscription ID: $SUB_ID${NC}"
else
    echo -e "${RED}❌ FAILED - Expected HTTP 200, got $http_code${NC}"
    echo -e "${RED}Response: $body${NC}"
    SUB_ID="sub_mock_test_fallback"
fi

# Test 7: Create Premium Subscription
PREMIUM_SUBSCRIPTION_DATA='{"customer":"cus_mock_test2","items":[{"price":"price_mock_premium_plan"}],"default_payment_method":"pm_mock_card"}'
run_test "Create Premium Subscription" "/subscriptions" "POST" "$PREMIUM_SUBSCRIPTION_DATA" 200

# Test 8: Update Subscription (using real subscription ID)
UPDATE_DATA='{"items":[{"price":"price_mock_premium_plan"}]}'
run_test "Update Subscription" "/subscriptions/$SUB_ID" "POST" "$UPDATE_DATA" 200

# Test 9: Cancel Subscription (using real subscription ID)
run_test "Cancel Subscription" "/subscriptions/$SUB_ID" "DELETE" "" 200

# Test 10: Create Payment Intent
PAYMENT_INTENT_DATA='{"amount":1000,"currency":"usd","customer":"cus_mock_test"}'
run_test "Create Payment Intent" "/payment_intents" "POST" "$PAYMENT_INTENT_DATA" 200

# Test 11: Webhook Test
WEBHOOK_DATA='{"type":"customer.subscription.created","data":{"object":{"id":"sub_test"}}}'
run_test "Webhook Processing" "/webhooks" "POST" "$WEBHOOK_DATA" 200

# Test 12: Invalid Customer Lookup
run_test "Invalid Customer Lookup" "/customers/invalid_id" "GET" "" 404

# Summary
echo -e "\n${BLUE}📊 Test Summary${NC}"
echo -e "${BLUE}=================${NC}"
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$((TOTAL_TESTS - PASSED_TESTS))${NC}"

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo -e "\n${GREEN}🎉 All tests passed! Stripe integration is working correctly.${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Please check the mock server.${NC}"
    exit 1
fi
