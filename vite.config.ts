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
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});

