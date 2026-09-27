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
        // Main Warm Palette
        canvas: '#FBF6EE', // Warm cream canvas
        surface: '#FFFFFF', // Clean surface
        forest: {
          DEFAULT: '#183C32',
          deep: '#102A23',
          light: '#EBF2EE',
          border: '#245044',
        },
        charcoal: '#262824',
        muted: '#6F716C',
        cocoa: '#4B3A31', // Deep cocoa neutral
        
        // Emotional Warmth & Accents
        terracotta: {
          DEFAULT: '#C86F4A',
          hover: '#B55E3A',
          subtle: '#FDF2EC',
          border: '#ECC2AF',
        },
        clay: {
          DEFAULT: '#C86F4A',
          hover: '#B55E3A',
          subtle: '#FDF2EC',
          border: '#ECC2AF',
        },
        apricot: {
          DEFAULT: '#E6A27C',
          subtle: '#FCF3EE',
          border: '#F5CEBA',
        },
        ochre: {
          DEFAULT: '#C8923F',
          subtle: '#FDF8EE',
          border: '#F3DCB1',
          text: '#996B22',
        },
        sage: {
          DEFAULT: '#789184',
          subtle: '#EEF3F0',
          border: '#C3D1CA',
        },
        
        // Warm Stone & Taupe Structure
        stone: {
          warm: '#CFC3B4', // Warm taupe
          subtle: '#F4EFE6', // Soft cream-stone fill
          line: '#E8DFD3',   // Subtle divider
          border: '#D8CEBE', // Control border
          text: '#7A7063',   // Warm secondary text
        },

        // Functional Status Scale (retained with warm backgrounds)
        status: {
          success: '#3E745D',
          'success-bg': '#EFF7F3',
          warning: '#C8923F',
          'warning-bg': '#FDF8EE',
          critical: '#A95145',
          'critical-bg': '#FDF2F0',
          neutral: '#7A7063',
          'neutral-bg': '#F4EFE6',
        },

        // Legacy / helper aliases for compatibility
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
          50: '#FDFBF8',
          100: '#FBF6EE',
          200: '#F4EFE6',
          300: '#E8DFD3',
          400: '#D8CEBE',
        },
        coral: {
          50: '#FDF2EC',
          100: '#FBE4D8',
          500: '#C86F4A',
          600: '#B55E3A',
        },
        amber: {
          50: '#FDF8EE',
          100: '#FBF0D9',
          500: '#C8923F',
          600: '#B07B2D',
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
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(75, 58, 49, 0.04)',
        xs: '0 1px 3px 0 rgba(75, 58, 49, 0.06), 0 1px 2px -1px rgba(75, 58, 49, 0.05)',
        sm: '0 2px 5px 0 rgba(75, 58, 49, 0.06)',
        md: '0 4px 8px -1px rgba(75, 58, 49, 0.08), 0 2px 4px -2px rgba(75, 58, 49, 0.06)',
      },
    },
  },
  plugins: [],
}
