import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'public',
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
      // Copy subpage files with correct script references on server start
      const { exec } = require('child_process');
      exec('npm run copy-subpages-dev', (error, stdout, stderr) => {
        if (error) {
          console.error('Error copying subpages:', error);
        } else {
          console.log('Subpages copied for development');
        }
      });

      // Redirect subdirectory requests to .html files
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';

        // Skip if it's a file request, root, or Vite internal routes
        if (url.includes('.') || url === '/' || url.startsWith('/@') || url.startsWith('/node_modules')) {
          return next();
        }

        // Check for subdirectory requests and redirect to .html files
        const cleanUrl = url.replace(/\/$/, ''); // Remove trailing slash
        const pathParts = cleanUrl.split('/').filter(Boolean);

        if (pathParts.length === 1) {
          const subdir = pathParts[0];
          const htmlFile = `${subdir}.html`;

          // Check if the .html file exists
          const fullPath = resolve(process.cwd(), htmlFile);
          if (existsSync(fullPath)) {
            // Redirect to the .html file
            res.writeHead(302, { 'Location': `/${htmlFile}` });
            res.end();
            return;
          }
        }

        next();
      });
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});

