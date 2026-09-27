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
        canvas: '#F7F5F0',
        surface: '#FFFFFF',
        forest: {
          DEFAULT: '#183C32',
          deep: '#102A23',
          light: '#EBF2EE',
          border: '#245044',
        },
        charcoal: '#262824',
        muted: '#6F716C',
        sage: {
          DEFAULT: '#789184',
          subtle: '#EEF3F0',
          border: '#C3D1CA',
        },
        stone: {
          warm: '#D8D1C5',
          subtle: '#EDE8E0',
          line: '#E5DFD5',
        },
        clay: {
          DEFAULT: '#C66D45',
          subtle: '#FDF1EB',
          border: '#E8A78A',
        },
        status: {
          success: '#3E745D',
          'success-bg': '#EFF7F3',
          warning: '#B7803B',
          'warning-bg': '#FEF7EC',
          critical: '#A95145',
          'critical-bg': '#FDF2F0',
          neutral: '#7C8079',
          'neutral-bg': '#F2F2F0',
        },
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
          900: '#183C32',
          950: '#102A23',
        },
        sand: {
          50: '#fdfbf7',
          100: '#F7F5F0',
          200: '#f2ece2',
          300: '#ebe1d1',
          400: '#dcceb7',
        },
        coral: {
          50: '#fdf3f2',
          100: '#fce5e3',
          500: '#C66D45',
          600: '#b63b23',
        },
        amber: {
          50: '#fef9ed',
          100: '#fcf0d3',
          500: '#B7803B',
          600: '#9e6d30',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Newsreader', 'Georgia', 'serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',  // 8px
        md: '0.625rem',     // 10px
        lg: '0.75rem',      // 12px
        xl: '0.875rem',     // 14px
        '2xl': '1rem',      // 16px (standard surface)
        '3xl': '1.125rem',  // 18px (max feature area)
        full: '9999px',
      },
    },
  },
  plugins: [],
}
