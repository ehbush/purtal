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
        primary: {
          50: '#e0f7ff',
          100: '#b3ebff',
          200: '#80deff',
          300: '#4dd0ff',
          400: '#26c6ff',
          500: '#00b8ff', // Electric blue - main primary
          600: '#00a8e6',
          700: '#0096cc',
          800: '#0084b3',
          900: '#006699',
        },
        secondary: {
          50: '#f3e5f5',
          100: '#e1bee7',
          200: '#ce93d8',
          300: '#ba68c8',
          400: '#ab47bc',
          500: '#9c27b0', // Purple - main secondary
          600: '#8e24aa',
          700: '#7b1fa2',
          800: '#6a1b9a',
          900: '#4a148c',
        },
        accent: {
          cyan: '#00d4ff', // Bright cyan from logo
          purple: '#c084fc', // Bright purple from logo
          magenta: '#e879f9', // Magenta from logo
          blue: '#0099ff', // Electric blue variant
        },
        dark: {
          bg: '#0a0e27', // Very dark blue background (logo background)
          surface: '#0f172a', // Dark surface
          border: '#1e293b', // Dark border
        },
      },
      backgroundImage: {
        'gradient-purtal': 'linear-gradient(135deg, #00d4ff 0%, #0099ff 50%, #c084fc 100%)', // Logo gradient
        'gradient-purtal-subtle': 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 153, 255, 0.1) 50%, rgba(192, 132, 252, 0.1) 100%)',
      },
    },
  },
  plugins: [],
}
