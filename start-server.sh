#!/bin/bash

# Alert Scout - Start Development Server
# =============================================================================

set -e

echo "🚀 Starting Alert Scout Development Server..."
echo "================================================"

cd ~/.openclaw/workspace/webdev/alert-scout

# Check if port 3000 is in use
if lsof -i :3000 > /dev/null 2>&1; then
    echo "⚠️  Port 3000 is already in use"
    echo "⚠️  Killing existing process..."
    fuser -k 3000/tcp
    sleep 2
fi

# Start development server
echo ""
echo "✅ Starting server..."
echo "📍 Server: http://localhost:3000"
echo "📱 API: http://localhost:3000/api"
echo "📊 Dashboard: http://localhost:3000/dashboard"
echo ""
echo "💡 Press Ctrl+C to stop the server"
echo "================================================"

npm run dev
