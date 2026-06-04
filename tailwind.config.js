/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          gold: '#C9A84C',
          dark: '#1a1a1a',
        }
      }
    },
  },
  plugins: [],
}
