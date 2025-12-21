# x-wrap - 3D Card Carousel

A React Three Fiber carousel for showcasing content in a 3D circular layout.

## Folder Structure

### Development Files (for `npm start`)
- **`src/`** - React source code
- **`public/`** - Public assets (images, HTML template)
- **`package.json`** - Dependencies and scripts
- **`node_modules/`** - Installed dependencies
- **`.env`** - Environment variables (PUBLIC_URL=/x-wrap)

### Production Build (for GitHub Pages)
- **`build/`** - Contains all static files ready for deployment
  - `index.html`
  - `static/` - JS and CSS bundles
  - `img*.jpg` - Image assets
  - `asset-manifest.json`

## Development

```bash
npm start
```
Access at: `http://localhost:3000`

## Building for Production

```bash
npm run build
```

This creates/updates the `build/` folder with production-ready static files.

## GitHub Pages Deployment

To deploy to GitHub Pages:

1. Build the project:
   ```bash
   npm run build
   ```

2. Copy the contents of `build/` folder to your GitHub Pages deployment location (e.g., `docs/` folder or `gh-pages` branch root).

3. The app is configured for `/x-wrap/` path. Make sure your GitHub Pages is set up to serve from the correct directory.

---

**Note:** The `build/` folder is gitignored by default. If you want to commit build files, remove `/build` from `.gitignore`.

