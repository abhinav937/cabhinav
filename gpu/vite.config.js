import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		port: 5500,
		open: true,
		host: '127.0.0.1'
	},
	build: {
		outDir: 'dist',
		assetsDir: 'assets'
	}
});

