#!/bin/bash

set -e

echo "🚀 Alert Scout Setup"
echo "===================="
echo ""

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 20+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version 20+ required. Current: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v)"

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create data directory
mkdir -p data

# Initialize database
echo "🗄️  Initializing database..."
node -e "
const { initDb } = require('./src/lib/db');
initDb();
console.log('✅ Database ready');
"

# Create .env if not exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Start the development server:"
echo "  npm run dev"
echo ""
echo "Then open http://localhost:3000"
