/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand Indigo - Primary accent color
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
          // Pure Indigo (#4B0082)
          DEFAULT: '#4B0082',
          dark: '#3a0068',
          light: '#7a44b8',
        },
        // Surface colors - very light grays
        surface: {
          white: '#FFFFFF',
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(75, 0, 130, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(75, 0, 130, 0.6)' },
        },
      },
      backgroundImage: {
        'gradient-indigo': 'linear-gradient(135deg, #4B0082 0%, #6366f1 100%)',
        'gradient-surface': 'linear-gradient(180deg, #F9FAFB 0%, #FFFFFF 100%)',
      },
    },
  },
  plugins: [],
};
