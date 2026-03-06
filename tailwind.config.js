/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bar: {
          bg: "#1a1a2e",
          card: "#16213e",
          accent: "#e94560",
          gold: "#f5a623",
          surface: "#0f3460",
          muted: "#533483",
        },
      },
    },
  },
  plugins: [],
};
