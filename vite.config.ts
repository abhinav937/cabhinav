import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: 'src',
  publicDir: '../public',
  server: {
    // Allow serving files from project root
    fs: {
      allow: ['.'],
      strict: false
    },
    // Automatically open browser when dev server starts
    open: false, // Set to true if you want auto-open, or use --open flag
    port: 5173,
    host: true, // Allow external connections
    configureServer(server) {
      // Redirect subdirectory requests to root for SPA
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';

        // Skip if it's a file request, root, or Vite internal routes
        if (url.includes('.') || url === '/' || url.startsWith('/@') || url.startsWith('/node_modules')) {
          return next();
        }

        // For all other routes, let Vite serve index.html
        next();
      });
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});

