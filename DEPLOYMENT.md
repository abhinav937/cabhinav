# Deployment Guide for GitHub Pages

## Automatic Deployment (Recommended)

The `.github/workflows/deploy.yml` file is configured for automatic deployment. Just push to the `main` branch:

```bash
git add .
git commit -m "Update site"
git push
```

GitHub Actions will automatically:
1. Build the React app
2. Deploy to GitHub Pages
3. Your site will be live at https://cabhinav.com

**First-time setup:**
1. Go to your GitHub repository → Settings → Pages
2. Under "Source", select "GitHub Actions"
3. The workflow will run automatically on the next push

## Manual Deployment (Alternative)

If you prefer manual deployment:

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

