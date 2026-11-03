/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#24362E',
          900: '#1B2A23',
          800: '#24362E',
          700: '#2F453A',
          600: '#3D574A',
        },
        sage: {
          DEFAULT: '#87958A',
          light: '#A7B2A8',
          dark: '#6C7A70',
        },
        sand: {
          DEFAULT: '#D9CBB5',
          light: '#E7DECD',
          dark: '#C6B49A',
        },
        ivory: {
          DEFAULT: '#F3F0E8',
          deep: '#EAE6DA',
          soft: '#F8F6F1',
        },
        champagne: {
          DEFAULT: '#C5A878',
          light: '#D8C29E',
          dark: '#A98C5E',
        },
        ink: {
          DEFAULT: '#24362E',
          muted: '#6B7770',
          faint: '#9AA39D',
        },
        success: '#5C7A5F',
        warning: '#C08A3E',
        urgent: '#C4705C',
        neutral: '#8E8879',
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        card: '20px',
        tile: '16px',
        pill: '999px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(36,54,46,0.04), 0 8px 24px -12px rgba(36,54,46,0.14)',
        lift: '0 2px 4px rgba(36,54,46,0.05), 0 18px 40px -18px rgba(36,54,46,0.22)',
        nav: '0 -1px 0 rgba(36,54,46,0.06), 0 -10px 30px -18px rgba(36,54,46,0.28)',
        brand: '0 6px 18px -6px rgba(36,54,46,0.45)',
      },
      spacing: {
        safe: 'env(safe-area-inset-bottom, 0px)',
      },
      transitionTimingFunction: {
        calm: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'sheet-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.42s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.3s ease both',
        'sheet-up': 'sheet-up 0.34s cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};
