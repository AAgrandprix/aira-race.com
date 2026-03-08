/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Brand tokens — Clean Intelligence
        arena: {
          bg: '#fafafa',        // zinc-50: ページベース背景
          surface: '#ffffff',   // カードや浮き要素
          border: '#e4e4e7',    // zinc-200: 境界線
          muted: '#71717a',     // zinc-500: サブテキスト
          ink: '#18181b',       // zinc-900: 見出し・本文
          solid: '#18181b',     // 黒ソリッドボタン背景
        },
      },
      backgroundImage: {
        'arena-grid':
          'linear-gradient(to right, #e4e4e7 1px, transparent 1px), linear-gradient(to bottom, #e4e4e7 1px, transparent 1px)',
      },
      backgroundSize: {
        'arena-grid': '48px 48px',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
