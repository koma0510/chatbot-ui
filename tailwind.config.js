/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}', // appフォルダ内の全てのJS/TSファイル
    './components/**/*.{js,jsx,ts,tsx}', // componentsフォルダ内の全てのJS/TSファイル
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

