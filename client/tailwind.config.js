/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        prime: {
          bg: '#0f171e',         // Deep Amazon Prime dark blue-black
          surface: '#1a242f',    // Surface cards / containers
          elevated: '#253342',   // Hovered card / modal surface
          border: '#2a3b4c',     // Subtle border line
          cyan: '#00a8e1',       // Prime Blue highlight
          cyanHover: '#1b9ce2',  // Button hover state
          cyanGlow: 'rgba(0, 168, 225, 0.4)',
          text: '#ffffff',       // Crisp white
          muted: '#8197a4',      // Muted metadata text
          gold: '#f59e0b',       // Star ratings & highlights
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        prime: '0 8px 30px rgba(0, 0, 0, 0.6)',
        cyanGlow: '0 0 20px rgba(0, 168, 225, 0.45)',
        goldGlow: '0 0 15px rgba(245, 158, 11, 0.35)',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(0, 168, 225, 0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(0, 168, 225, 0.7)' },
        },
      },
      animation: {
        pulseGlow: 'pulseGlow 2s infinite ease-in-out',
      },
    },
  },
  plugins: [],
}
