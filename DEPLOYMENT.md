# Deployment Guide for GitHub Pages

## Quick Deploy

1. Build the React app and copy to root:
   ```bash
   npm run build:gh-pages
   ```

2. Commit and push:
   ```bash
   git add .
   git commit -m "Deploy React app"
   git push
   ```

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

