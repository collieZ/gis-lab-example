/** @type {import('tailwindcss').Config} */
const expandColumn = (() => {
  let expandColumn = {};
  for(let i = 14; i <= 25; i++) {
    expandColumn[i] =  i + ''
  }
  return expandColumn
})()
console.log(expandColumn, 'expandColumn');
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        '24': 'repeat(24, minmax(0, 1fr))',
      },
      gridColumnStart: {
        ...expandColumn
      },
      gridColumnEnd: {
        ...expandColumn
      }
    },
  },
  plugins: [],
}

