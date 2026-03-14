/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './pages/**/*.{tsx,ts}',
    './components/**/*.{tsx,ts}',
    './src/**/*.{tsx,ts}',
  ],
  theme: {
    extend: {
      colors: {
        primary: "#ed2ba5",
        "primary-light": "#ffe4f2",
        "background-light": "#f8f6f7",
        "background-dark": "#22101b",
        "card-light": "#ffffff",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Noto Sans SC", "sans-serif"],
        serif: ["Noto Serif SC", "serif"],
      },
      boxShadow: {
        'soft': '0 4px 24px -2px rgba(237, 43, 165, 0.08)',
        'glow': '0 4px 20px rgba(237, 43, 165, 0.3)',
      }
    },
  },
  plugins: [],
}
