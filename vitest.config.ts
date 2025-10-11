import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';


// Variables

const dir = dirname(fileURLToPath(new URL(import.meta.url)));


export default defineConfig({
  plugins: [ tsconfigPaths() ],
  resolve: {
    alias: {
      '@': resolve(dir, 'src'),
      '@flext': resolve(dir, 'dist'),
      '@test-lib': resolve(dir, 'test-lib.ts'),
    },
  },
});
