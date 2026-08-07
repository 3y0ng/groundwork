/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#f7f7f5',
        surface: '#ffffff',
        ink: {
          DEFAULT: '#1c1d1f',
          soft: '#4a4d52',
          faint: '#767a82',
        },
        line: '#e6e5e1',
        brand: {
          50: '#eef4ff',
          100: '#dbe6ff',
          500: '#3b6fe0',
          600: '#2f59c4',
          700: '#274aa3',
        },
        // Evidence semantics
        support: { bg: '#e9f6ee', fg: '#1c7a44', line: '#bfe6cd' },
        contra: { bg: '#fdecec', fg: '#b3261e', line: '#f6c9c6' },
        unclear: { bg: '#fbf3e2', fg: '#9a6b12', line: '#efdcb2' },
        commit: { bg: '#eef0fb', fg: '#3a3f9e', line: '#d0d5f4' },
        opinion: { bg: '#f0f0ee', fg: '#5c5f66', line: '#ddddd8' },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(20,20,25,0.04), 0 1px 3px rgba(20,20,25,0.06)',
        pop: '0 8px 30px rgba(20,20,25,0.12)',
      },
      borderRadius: {
        xl: '0.85rem',
      },
    },
  },
  plugins: [],
}
