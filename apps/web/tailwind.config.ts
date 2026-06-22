import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: '#0f0f1a',
        dawn: '#1a1a2e',
        village: '#d4a853',
        wolf: '#8b1a1a',
        neutral: '#4a4a6a',
      },
    },
  },
} satisfies Config;
