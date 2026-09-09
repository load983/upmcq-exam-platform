/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // 'font-sans' এর ডিফল্ট ফন্ট হিসেবে বাংলা ফন্ট যুক্ত করা হচ্ছে
        sans: ['"Noto Sans Bengali"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // কাস্টম 'font-bangla' ক্লাস ব্যবহারের জন্য
        bangla: ['"Noto Sans Bengali"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
