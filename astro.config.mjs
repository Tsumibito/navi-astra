import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://docs.astro.build
export default defineConfig({
  integrations: [tailwind({
    config: {
      applyBaseStyles: true
    }
  })],
});
