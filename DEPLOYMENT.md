# Deployment Guide for GitHub Pages

## Quick Deploy

### Option 1: Manual Deployment (Recommended)

1. Build the React app:
   ```bash
   npm run build
   ```

2. Copy build files to root (for GitHub Pages):
   ```bash
   npm run deploy:copy
   ```

3. Commit and push:
   ```bash
   git add .
   git commit -m "Deploy React app"
   git push
   ```

### Option 2: Automatic Deployment with GitHub Actions

The `.github/workflows/deploy.yml` file is already configured. Just push to the `main` branch and GitHub Actions will automatically build and deploy to GitHub Pages.

Make sure GitHub Pages is configured to serve from the root directory (not `/docs`).

## Build Output

After running `npm run build`, the files will be in the `dist/` folder:
- `dist/index.html` - Main HTML file with all SEO meta tags
- `dist/assets/` - CSS and JS bundles

## SEO Features Included

✅ All meta tags (keywords, description, robots)
✅ Open Graph tags for social sharing
✅ Twitter Card tags
✅ Structured Data (JSON-LD) for search engines
✅ Google Analytics
✅ Canonical URLs
✅ Geo-location tags
✅ Language targeting

## Notes

- The React app is now the main page
- All SEO code from the original index.html has been integrated
- The build process uses Vite for fast builds
- Assets are automatically optimized and hashed for caching

