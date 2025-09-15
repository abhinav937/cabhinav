#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * Script to download the latest resume PDF from GitHub
 * Usage: node update-resume.js [options]
 *
 * Options:
 *   --from-releases: Download from GitHub releases (requires GITHUB_TOKEN)
 *   --from-repo: Download from repository file (default)
 *   --repo: Repository in format 'owner/repo' (default: current repo)
 *   --branch: Branch to download from (default: main)
 *   --path: Path to resume file in repo (default: assets/documents/abhinav-chinnusamy-resume.pdf)
 *   --output: Local output path (default: assets/documents/abhinav-chinnusamy-resume.pdf)
 */

// Configuration
const config = {
  repo: process.env.GITHUB_REPOSITORY || 'abhinav937/resume', // Your resume repository
  branch: 'main',
  filePath: 'main.pdf', // The PDF file in your resume repo
  outputPath: 'assets/documents/abhinav-chinnusamy-resume.pdf', // Local destination
  githubToken: process.env.GITHUB_TOKEN
};

// Parse command line arguments
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--from-releases':
      config.fromReleases = true;
      break;
    case '--from-repo':
      config.fromReleases = false;
      break;
    case '--repo':
      config.repo = args[++i];
      break;
    case '--branch':
      config.branch = args[++i];
      break;
    case '--path':
      config.filePath = args[++i];
      break;
    case '--output':
      config.outputPath = args[++i];
      break;
    case '--help':
    case '-h':
      console.log(`
Resume Update Script

Downloads the latest resume PDF from GitHub.

Usage:
  node update-resume.js [options]

Options:
  --from-releases    Download from GitHub releases (looks for asset named 'resume.pdf')
  --from-repo        Download from repository file (default)
  --repo OWNER/REPO  Repository to download from (default: ${config.repo})
  --branch BRANCH    Branch to download from (default: ${config.branch})
  --path PATH        Path to file in repository (default: ${config.filePath})
  --output PATH      Local output path (default: ${config.outputPath})
  --help, -h         Show this help

Environment Variables:
  GITHUB_TOKEN       Required for private repos or higher rate limits
  GITHUB_REPOSITORY  Auto-detected if running in GitHub Actions

Examples:
  # Download from current repo
  node update-resume.js

  # Download from another repo
  node update-resume.js --repo john/resume-repo --path resume.pdf

  # Download from releases
  node update-resume.js --from-releases
`);
      process.exit(0);
  }
}

function downloadFromReleases() {
  return new Promise((resolve, reject) => {
    const [owner, repo] = config.repo.split('/');
    const url = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;

    const options = {
      headers: {
        'User-Agent': 'Resume-Update-Script',
        ...(config.githubToken && { 'Authorization': `token ${config.githubToken}` })
      }
    };

    https.get(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const release = JSON.parse(data);

          if (res.statusCode !== 200) {
            reject(new Error(`GitHub API error: ${release.message || 'Unknown error'}`));
            return;
          }

          // Find resume PDF asset
          const resumeAsset = release.assets.find(asset =>
            asset.name.toLowerCase().includes('resume') && asset.name.endsWith('.pdf')
          );

          if (!resumeAsset) {
            reject(new Error('No resume PDF found in latest release'));
            return;
          }

          console.log(`Found resume asset: ${resumeAsset.name}`);
          downloadFile(resumeAsset.browser_download_url, config.outputPath)
            .then(resolve)
            .catch(reject);

        } catch (err) {
          reject(new Error(`Failed to parse GitHub API response: ${err.message}`));
        }
      });
    }).on('error', (err) => {
      reject(new Error(`Failed to fetch release info: ${err.message}`));
    });
  });
}

function downloadFromRepo() {
  const [owner, repo] = config.repo.split('/');
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${config.branch}/${config.filePath}`;

  console.log(`Downloading from: ${url}`);
  return downloadFile(url, config.outputPath);
}

function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const options = {
      headers: {
        'User-Agent': 'Resume-Update-Script'
      }
    };

    https.get(url, options, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }

      const fileStream = fs.createWriteStream(outputPath);
      res.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`✅ Resume downloaded successfully to ${outputPath}`);
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(outputPath, () => {}); // Delete the file on error
        reject(new Error(`Failed to write file: ${err.message}`));
      });
    }).on('error', (err) => {
      reject(new Error(`Failed to download file: ${err.message}`));
    });
  });
}

// Main execution
async function main() {
  try {
    console.log('🚀 Updating resume PDF...');

    if (config.fromReleases) {
      await downloadFromReleases();
    } else {
      await downloadFromRepo();
    }

    console.log('✨ Resume update completed!');
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { downloadFromReleases, downloadFromRepo, downloadFile };
