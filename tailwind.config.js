/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2f8f5',
          100: '#dfefe8',
          200: '#c2e0d3',
          300: '#9acbb7',
          400: '#6eb096',
          500: '#4c947a',
          600: '#387762',
          700: '#2d6050',
          800: '#264d41',
          900: '#1b4d3e', // Primary deep forest green
          950: '#112b23',
        },
        sand: {
          50: '#fdfbf7',
          100: '#fbf9f5', // Warm sand background
          200: '#f5efe6',
          300: '#ebe1d1',
          400: '#dcceb7',
        },
        coral: {
          50: '#fdf3f2',
          100: '#fce5e3',
          500: '#e76f51',
          600: '#d95338',
          700: '#b63b23',
        },
        amber: {
          500: '#f4a261',
          600: '#e78a42',
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
