import type { Config } from 'tailwindcss';

/*
 * Colours resolve to the CSS custom properties in app/globals.css (stored as
 * RGB channel triplets), so every utility is theme-aware automatically
 * (light / dark) and opacity modifiers like `bg-flame/10` work. See
 * lib/design/tokens.ts for the canonical values.
 *
 * The `slate` and `court` scales are kept as aliases onto the new tokens so
 * screens not yet migrated to the DYNI system stay legible in both themes.
 * New code should use `flame` / `surface` / `ink` etc. directly.
 * Migration tracker: docs/DESIGN-MIGRATION.md.
 */
const rgb = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ground: rgb('--ground'),
        surface: {
          DEFAULT: rgb('--surface'),
          2: rgb('--surface-2'),
          3: rgb('--surface-3'),
        },
        ink: {
          DEFAULT: rgb('--ink'),
          dim: rgb('--ink-dim'),
          faint: rgb('--ink-faint'),
        },
        line: {
          DEFAULT: 'var(--line)',
          strong: 'var(--line-strong)',
        },
        flame: {
          DEFAULT: rgb('--flame'),
          ink: rgb('--flame-ink'),
        },
        ember: rgb('--ember'),
        gold: rgb('--gold'),
        'on-flame': rgb('--on-flame'),
        success: rgb('--success'),
        warning: rgb('--warning'),
        danger: rgb('--danger'),
        info: rgb('--info'),
        court: {
          50: rgb('--surface-2'),
          100: rgb('--surface-3'),
          400: rgb('--flame'),
          500: rgb('--flame'),
          600: rgb('--flame'),
          700: rgb('--flame-ink'),
          800: rgb('--flame-ink'),
        },
        slate: {
          50: rgb('--surface-2'),
          100: rgb('--surface-3'),
          200: 'var(--line-strong)',
          300: 'var(--line-strong)',
          400: rgb('--ink-faint'),
          500: rgb('--ink-faint'),
          600: rgb('--ink-dim'),
          700: rgb('--ink-dim'),
          800: rgb('--ink'),
          900: rgb('--ink'),
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-archivo)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        condensed: ['var(--font-barlow)', 'var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        control: 'var(--radius-control)',
        card: 'var(--radius-card)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        pop: 'var(--shadow-pop)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-live': {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s cubic-bezier(0.4,0,0.2,1) both',
        'pulse-live': 'pulse-live 1.6s ease-in-out infinite',
        'slide-up': 'slide-up 0.28s cubic-bezier(0.32,0.72,0,1) both',
      },
    },
  },
  plugins: [],
};

export default config;
