/** @type {import('tailwindcss').Config} */
const c = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: c('bg'),
        surface: c('surface'),
        surface2: c('surface2'),
        ink: c('ink'),
        muted: c('muted'),
        line: c('line'),
        accent: c('accent'),
        accentInk: c('accent-ink'),
        ok: c('ok'),
        okBg: c('ok-bg'),
        warn: c('warn'),
        warnBg: c('warn-bg'),
        bad: c('bad'),
        badBg: c('bad-bg'),
      },
      fontFamily: {
        display: ['"Barlow Condensed"', '"Arial Narrow"', 'Arial', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
