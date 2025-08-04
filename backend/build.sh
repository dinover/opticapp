#!/bin/bash

echo "🚀 Building AppDelStream Backend..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p dist/uploads

echo "✅ Build completed successfully!" 