/** @type {import('tailwindcss').Config} */
module.exports = {
  // ১. ক্লাস-বেসড ডার্ক মোড এনাবল করা হচ্ছে
  darkMode: 'class', 

  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // ডিফল্ট sans ফন্ট হিসেবে 'Noto Sans Bengali' যুক্ত
        sans: ['"Noto Sans Bengali"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // কাস্টম font-bangla ক্লাস ব্যবহারের জন্য
        bangla: ['"Noto Sans Bengali"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
