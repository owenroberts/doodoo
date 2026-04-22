import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
	css: { devSourcemap: true, },
	server: { port: 8787 },
	build: {
		rollupOptions: {
			input: {
				main: resolve(__dirname, 'index.html'),
				composer: resolve(__dirname, 'composer/index.html')
			},
		},
	},
});
