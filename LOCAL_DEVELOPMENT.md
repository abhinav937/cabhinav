# Local Development Guide

## Running the React App Locally

### Option 1: Vite Dev Server (Recommended)

The React app uses Vite which transpiles TypeScript/JSX on the fly. You **cannot** open `index.html` directly - you must use the dev server:

```bash
npm run dev
# or
npm start
```

Then open: **http://localhost:5173** (or the port shown in the terminal)

### Option 2: Preview Built Version

If you want to test the production build locally:

```bash
# Build the app
npm run build

# Preview the built version
npm run preview
```

Then open: **http://localhost:4173** (or the port shown)

### Option 3: Serve Built Files with Simple Server

If you want to test the built files directly:

```bash
# Build first
npm run build

# Then serve the dist folder
cd dist
python3 -m http.server 8000
```

Then open: **http://localhost:8000**

## Why Direct File Access Doesn't Work

- The `index.html` references `/index.tsx` which needs to be transpiled
- React and TypeScript require a build process
- ES modules need to be resolved by a server
- Vite handles all of this automatically

## Quick Commands

- **Development**: `npm run dev` → http://localhost:5173 (or port shown in terminal)
- **Build**: `npm run build` → Creates `dist/` folder
- **Preview Build**: `npm run preview` → http://localhost:4173

