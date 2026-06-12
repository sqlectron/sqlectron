/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{ts,tsx,js,jsx}'],
  // Semantic UI's CSS reset is still in place while we migrate components
  // off it, so Tailwind's preflight reset is disabled to avoid global
  // regressions. Re-enable once vendor/renderer/semantic-ui is removed.
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {},
  },
  plugins: [require('tailwindcss-animate')],
};
