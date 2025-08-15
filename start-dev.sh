#!/bin/bash

# SongSync Development Setup Script
# This script starts both the mock Stripe server and the React Native app

echo "🎵 Starting SongSync Development Environment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Node.js is installed
if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

# Start mock Stripe server in background
echo -e "${BLUE}🚀 Starting Mock Stripe Server...${NC}"
cd server
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing server dependencies...${NC}"
    npm install
fi

# Start the server in background
npm start &
SERVER_PID=$!
echo -e "${GREEN}✅ Mock Stripe Server started (PID: $SERVER_PID)${NC}"
echo -e "${GREEN}📡 Server running at: http://localhost:3001${NC}"

# Wait a moment for server to start
sleep 2

# Test server health
echo -e "${BLUE}🏥 Testing server health...${NC}"
if curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✅ Mock server is healthy${NC}"
else
    echo -e "${RED}❌ Mock server health check failed${NC}"
fi

# Go back to main directory
cd ..

# Start React Native app
echo -e "${BLUE}📱 Starting React Native App...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing app dependencies...${NC}"
    npm install
fi

echo -e "${GREEN}🎯 Choose your platform:${NC}"
echo "1) iOS Simulator"
echo "2) Android Emulator"
echo "3) Web Browser"
echo "4) Expo Go (scan QR code)"

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo -e "${BLUE}🍎 Starting iOS app...${NC}"
        npx expo start --ios
        ;;
    2)
        echo -e "${BLUE}🤖 Starting Android app...${NC}"
        npx expo start --android
        ;;
    3)
        echo -e "${BLUE}🌐 Starting web app...${NC}"
        npx expo start --web
        ;;
    4)
        echo -e "${BLUE}📲 Starting Expo development server...${NC}"
        npx expo start
        ;;
    *)
        echo -e "${RED}❌ Invalid choice. Starting default Expo server...${NC}"
        npx expo start
        ;;
esac

# Cleanup function
cleanup() {
    echo -e "\n${BLUE}🧹 Cleaning up...${NC}"
    if kill -0 $SERVER_PID 2>/dev/null; then
        echo -e "${BLUE}🛑 Stopping Mock Stripe Server (PID: $SERVER_PID)...${NC}"
        kill $SERVER_PID
    fi
    echo -e "${GREEN}✅ Cleanup complete${NC}"
    exit 0
}

# Trap SIGINT (Ctrl+C) and call cleanup
trap cleanup SIGINT

# Wait for user to stop the script
echo -e "\n${GREEN}🎵 SongSync is running!${NC}"
echo -e "${BLUE}📡 Mock Stripe Server: http://localhost:3001${NC}"
echo -e "${BLUE}📋 Available endpoints:${NC}"
echo -e "   • Health: http://localhost:3001/health"
echo -e "   • Plans: http://localhost:3001/api/stripe/plans"
echo -e "   • Config: http://localhost:3001/api/stripe/config"
echo -e "\n${BLUE}Press Ctrl+C to stop all services${NC}"

# Keep script running
wait
