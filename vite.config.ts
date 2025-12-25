import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'public',
  server: {
    // Allow serving files from project root
    fs: {
      allow: ['.']
    },
    // Automatically open browser when dev server starts
    open: false, // Set to true if you want auto-open, or use --open flag
    port: 5173,
    host: true // Allow external connections
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});

