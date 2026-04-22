#!/bin/bash

echo "🔥 Starting Firebase Emulators for VitalsEdge Development..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Start emulators in background
echo "🚀 Starting Firebase Emulators..."
firebase emulators:start --project=vitalsedge-monitoring-system --import=./emulator-data --export-on-exit

echo "✅ Emulators starting..."
echo "📊 Auth Emulator: http://localhost:9099"
echo "🗄️ Firestore Emulator: http://localhost:8080"
echo "🔧 Emulator UI: http://localhost:4000"
echo ""
echo "💡 Run 'pnpm run dev' in another terminal to start the application"
