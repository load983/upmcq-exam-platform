/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class', // Dark Mode টগল করার জন্য 'class' স্ট্র্যাটেজি ব্যবহার হচ্ছে
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff', 100: '#e0e7ff', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca',
        },
      },
    },
  },
  plugins: [],
};
