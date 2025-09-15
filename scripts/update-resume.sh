#!/bin/bash

# Script to download the latest resume PDF from GitHub
# Usage: ./update-resume.sh

# Configuration
GITHUB_REPO="abhinav937/resume"
BRANCH="main"
FILE_PATH="main.pdf"
OUTPUT_PATH="assets/documents/abhinav-chinnusamy-resume.pdf"

# GitHub raw file URL
URL="https://raw.githubusercontent.com/${GITHUB_REPO}/${BRANCH}/${FILE_PATH}"

echo "🚀 Downloading latest resume from: $URL"

# Create output directory if it doesn't exist
mkdir -p "$(dirname "$OUTPUT_PATH")"

# Download the file
if curl -s -o "$OUTPUT_PATH" "$URL"; then
    if [ -s "$OUTPUT_PATH" ]; then
        echo "✅ Resume downloaded successfully to $OUTPUT_PATH"
        echo "📄 File size: $(ls -lh "$OUTPUT_PATH" | awk '{print $5}')"
        echo "✨ Resume update completed!"
    else
        echo "❌ Error: Downloaded file is empty"
        rm -f "$OUTPUT_PATH"
        exit 1
    fi
else
    echo "❌ Error: Failed to download resume from GitHub"
    exit 1
fi
