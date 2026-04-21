import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
	css: {
      devSourcemap: true,
    },
	server: {
		port: 4998
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
