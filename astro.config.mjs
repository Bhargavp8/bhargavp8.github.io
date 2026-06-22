import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://bharcode.com',
  integrations: [
    // keep the hidden gift doorway out of the sitemap
    sitemap({ filter: (page) => !page.includes('onlyforyouandyouonly') }),
  ],
});
