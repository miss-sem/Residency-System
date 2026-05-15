/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#D92243',
          50:  '#FFF0F3',
          100: '#FFD6DF',
          200: '#FFB3C1',
          300: '#FF7096',
          400: '#F5476A',
          500: '#D92243',
          600: '#B81A38',
          700: '#93142C',
          800: '#6E0F21',
          900: '#4A0A16',
        },
        surface: '#FAFAFA',
        card:    '#FFFFFF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':       'fadeIn 0.4s ease forwards',
        'slide-up':      'slideUp 0.4s ease forwards',
        'slide-in-left': 'slideInLeft 0.35s ease forwards',
        'slide-in-right':'slideInRight 0.38s cubic-bezier(0.25,0.46,0.45,0.94) forwards',
        'slide-in-back': 'slideInBack 0.38s cubic-bezier(0.25,0.46,0.45,0.94) forwards',
        'pulse-dot':     'pulseDot 1.8s ease-in-out infinite',
        'shimmer':       'shimmer 1.6s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0 },
          to:   { opacity: 1 },
        },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(16px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        slideInLeft: {
          from: { opacity: 0, transform: 'translateX(-16px)' },
          to:   { opacity: 1, transform: 'translateX(0)' },
        },
        slideInRight: {
          from: { opacity: 0, transform: 'translateX(28px)' },
          to:   { opacity: 1, transform: 'translateX(0)' },
        },
        slideInBack: {
          from: { opacity: 0, transform: 'translateX(-28px)' },
          to:   { opacity: 1, transform: 'translateX(0)' },
        },
        pulseDot: {
          '0%, 100%': { transform: 'scale(1)', opacity: 1 },
          '50%':      { transform: 'scale(1.4)', opacity: 0.6 },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to:   { backgroundPosition:  '200% 0' },
        },
      },
      boxShadow: {
        'card':  '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.10)',
        'primary': '0 4px 14px rgba(217,34,67,0.30)',
      },
    },
  },
  plugins: [],
};
