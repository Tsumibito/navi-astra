import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://docs.astro.build
export default defineConfig({
  compressHTML: true,
  vite: {
    plugins: [tailwindcss()],
  },
});
