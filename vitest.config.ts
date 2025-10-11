import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';


// Variables

const dir = dirname(fileURLToPath(new URL(import.meta.url)));


export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(dir, 'src'),
      '@flext': resolve(dir, 'dist'),
      '@test-lib': resolve(dir, 'test-lib.ts'),
    },
  },
});
