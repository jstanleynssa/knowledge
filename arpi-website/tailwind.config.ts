import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'arpi-green': '#2a6b54',
        nssa: {
          navy: '#276f46',
          gold: '#C8952A',
          light: '#f0faf4',
          blue: {
            100: '#d1f0de',
            300: '#a7dfc1',
            400: '#6bc99a',
            500: '#139a4d',
            700: '#276f46',
            900: '#1a4a2e',
          },
          red: {
            100: '#fce7f3',
            300: '#f4a6cb',
            400: '#e87aaa',
            500: '#9d174d',
            700: '#7f1424',
            900: '#4a0a1e',
          },
        },
        'green-dark':   '#2a6b54',
        'green-mid':    '#139a4d',
        'green-light':  '#d1f0de',
        'green-xlight': '#f0faf4',
        'ink':          '#111827',
        'ink-mid':      '#374151',
        'ink-light':    '#6b7280',
        'ink-xlight':   '#9ca3af',
        'bg-soft':      '#f8f9fa',
        'bg-mid':       '#f1f3f5',
        'border-arpi':  '#e5e7eb',
      },
      fontFamily: {
        sans:  ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['var(--font-merriweather)', 'Georgia', 'serif'],
      },
      maxWidth: {
        container: '1180px',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}

export default config
