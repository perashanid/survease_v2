#!/bin/bash
# Render build script for backend

echo "🚀 Starting backend build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Verify build output
if [ -d "dist" ] && [ -f "dist/app.js" ]; then
    echo "✅ Build successful! dist/app.js found."
else
    echo "❌ Build failed! dist/app.js not found."
    exit 1
fi

echo "🎉 Backend build completed successfully!"
