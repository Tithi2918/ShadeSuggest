/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#7B3F5E',
          light:   '#F2E8EE',
          accent:  '#C97A8A',
        },
        cream:   '#FAF6F1',
        warm:    '#F0E8DC',
        charcoal:'#2C2420',
        muted:   '#7A6B63',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body:    ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
