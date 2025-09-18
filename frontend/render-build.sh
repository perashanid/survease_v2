#!/bin/bash
# Render build script for frontend

echo "🚀 Starting frontend build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Verify build output
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    echo "✅ Build successful! dist/index.html found."
    echo "📁 Build output contents:"
    ls -la dist/
else
    echo "❌ Build failed! dist/index.html not found."
    exit 1
fi

echo "🎉 Frontend build completed successfully!"
