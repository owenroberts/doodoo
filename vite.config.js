import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
	server: {
		port: 8080
	},
	build: {
    rollupOptions: {
			input: {
				main: resolve(__dirname, 'index.html'),
				nested: resolve(__dirname, 'composer/index.html'),
			},
		},
	},
});
