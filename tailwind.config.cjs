/**** @type {import('tailwindcss').Config} ****/
module.exports = {
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'
  ],
  theme: {
    extend: {
      colors: {
        'brand-orange': '#ffb052',
        'brand-orangeDark': 'rgba(226, 129, 15, 1)',
        'brand-blue': 'rgba(47, 175, 215, 1)',
      },
      fontFamily: {
        neo: [
          'Inter',
          'Roboto',
          'Helvetica Neue',
          'Arial Nova',
          'Nimbus Sans',
          'Arial',
          'sans-serif',
        ],
        tenor: ['"Tenor Sans"', 'serif'],
      },
    },
  },
  plugins: [],
};
