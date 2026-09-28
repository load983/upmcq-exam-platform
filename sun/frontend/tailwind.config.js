/** @type {import('tailwindcss').Config} */

// 'primary' কালার প্যালেট CSS ভ্যারিয়েবল দিয়ে বানানো হয়েছে, যাতে রানটাইমে
// (index.css তে ডিফাইন করা data-accent অ্যাট্রিবিউট অনুযায়ী) থিম বদলানো যায়।
function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgb(var(${variableName}) / ${opacityValue})`;
    }
    return `rgb(var(${variableName}))`;
  };
}

module.exports = {
  darkMode: 'class',

  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans Bengali"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        bangla: ['"Noto Sans Bengali"', 'sans-serif'],
      },
      colors: {
        primary: {
          50: withOpacity('--color-primary-50'),
          100: withOpacity('--color-primary-100'),
          200: withOpacity('--color-primary-200'),
          300: withOpacity('--color-primary-300'),
          400: withOpacity('--color-primary-400'),
          500: withOpacity('--color-primary-500'),
          600: withOpacity('--color-primary-600'),
          700: withOpacity('--color-primary-700'),
          800: withOpacity('--color-primary-800'),
          900: withOpacity('--color-primary-900'),
          950: withOpacity('--color-primary-950'),
        },
      },
      boxShadow: {
        soft: '0 2px 10px -2px rgb(0 0 0 / 0.06), 0 8px 24px -8px rgb(0 0 0 / 0.08)',
        glow: '0 0 0 1px rgb(var(--color-primary-500) / 0.15), 0 8px 30px -8px rgb(var(--color-primary-600) / 0.35)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(4px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: 0, transform: 'scale(0.96)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.18s ease-out',
        'scale-in': 'scaleIn 0.18s ease-out',
        'float-slow': 'floatSlow 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
