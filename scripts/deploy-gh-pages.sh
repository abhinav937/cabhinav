#!/bin/bash

# Build the React app
echo "Building React app..."
npm run build

# Copy dist contents to root (for GitHub Pages)
echo "Copying build files to root..."
cp -r dist/* .

# Keep important files
git checkout index.html 2>/dev/null || true

echo "Build complete! Files are ready for GitHub Pages."
echo "Commit and push to deploy."

