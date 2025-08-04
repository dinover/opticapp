#!/bin/bash

echo "🚀 Building AppDelStream Frontend..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build application
echo "🔨 Building application..."
npm run build

# Check build output
echo "📁 Checking build output..."
if [ -d "dist" ]; then
    echo "✅ Build completed successfully!"
    echo "📊 Build size:"
    du -sh dist/*
else
    echo "❌ Build failed!"
    exit 1
fi

echo "🎯 Ready for Vercel deployment!" 