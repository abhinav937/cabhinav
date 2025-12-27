# Deployment Guide for Vercel

## Quick Deploy

1. Connect your GitHub repository to Vercel:
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect the Vite framework

2. Configure build settings (if needed):
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist` (leave as default)

3. Deploy:
   - Click "Deploy"
   - Vercel will build and deploy your site automatically

Your site will be available at a `.vercel.app` URL initially.

## Vercel Configuration

The deployment is configured through:

### vercel.json
```json
{
  "rewrites": [
    {
      "source": "/((?!assets/|web-components/|.*\\..*).*)",
      "destination": "/index.html"
    }
  ],
  "cleanUrls": true,
  "framework": "vite"
}
```

This configuration:
- Routes all non-asset requests to `index.html` for SPA routing
- Enables clean URLs (no `.html` extensions)
- Tells Vercel to use Vite framework detection

### Build Output

After running `npm run build`, the files will be in the `dist/` folder:
- `dist/index.html` - Main HTML file with all SEO meta tags
- `dist/assets/` - CSS and JS bundles optimized for production

## SEO Features Included

✅ All meta tags (keywords, description, robots)
✅ Open Graph tags for social sharing
✅ Twitter Card tags
✅ Structured Data (JSON-LD) for search engines
✅ Google Analytics
✅ Canonical URLs
✅ Geo-location tags
✅ Language targeting

## Vercel Features

- **Automatic deployments** on every push to main branch
- **Preview deployments** for pull requests
- **Global CDN** for fast loading worldwide
- **Custom domains** support
- **HTTPS** automatically enabled
- **Build optimizations** with Vite

## Notes

- The React app is now the main page
- All SEO code from the original setup has been integrated
- The build process uses Vite for fast, optimized builds
- Assets are automatically optimized, hashed, and cached
- Vercel handles SPA routing automatically with the vercel.json configuration

