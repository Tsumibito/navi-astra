import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

// https://docs.astro.build
export default defineConfig({
  compressHTML: true,
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: { '~': path.resolve(process.cwd(), 'src') },
    },
  },
});
