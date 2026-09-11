/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      // Los colores apuntan a los tokens de styles/theme.css, así las clases
      // utilitarias siguen el tema claro/oscuro igual que el resto de la app.
      colors: {
        canvas: 'var(--canvas)',
        surface: 'var(--surface)',
        ink: 'var(--text-primary)',
        muted: 'var(--text-muted)',
        violet: 'var(--violet)',
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          500: 'var(--brand-light)',
          600: 'var(--brand)',
          700: 'var(--brand-dark)',
        },
      },
      borderRadius: {
        card: 'var(--radius-lg)',
        panel: 'var(--radius-xl)',
      },
    },
  },
  plugins: [],
}
