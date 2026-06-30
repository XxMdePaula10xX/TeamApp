/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta temática via CSS variables (default = verde "campo de
        // futebol"); pode ser sobrescrita em runtime pela cor do time.
        // Ver src/index.css (:root) e src/utils/theme.ts.
        pitch: {
          50: 'rgb(var(--pitch-50) / <alpha-value>)',
          100: 'rgb(var(--pitch-100) / <alpha-value>)',
          200: 'rgb(var(--pitch-200) / <alpha-value>)',
          300: 'rgb(var(--pitch-300) / <alpha-value>)',
          400: 'rgb(var(--pitch-400) / <alpha-value>)',
          500: 'rgb(var(--pitch-500) / <alpha-value>)',
          600: 'rgb(var(--pitch-600) / <alpha-value>)',
          700: 'rgb(var(--pitch-700) / <alpha-value>)',
          800: 'rgb(var(--pitch-800) / <alpha-value>)',
          900: 'rgb(var(--pitch-900) / <alpha-value>)',
          950: 'rgb(var(--pitch-950) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
