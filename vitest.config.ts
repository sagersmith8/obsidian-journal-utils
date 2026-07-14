import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
	},
	resolve: {
		alias: {
			obsidian: path.resolve(__dirname, 'tests/stubs/obsidian.ts'),
		},
	},
});
