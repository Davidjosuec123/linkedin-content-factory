/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          green: "#00FF94",
          cyan: "#00E5FF",
        },
        dark: {
          DEFAULT: "#0D0D0D",
          2: "#1A1A1A",
          3: "#2A2A2A",
        },
      },
    },
  },
  plugins: [],
}
