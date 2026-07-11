/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0a0a0f',
        card: '#12121a',
        border: 'rgba(255, 255, 255, 0.08)',
        primary: '#f59e0b',
      }
    }
  },
  plugins: []
};
