/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
      },
      colors: {
        app: 'var(--bg-app)',
        sidebar: 'var(--bg-sidebar)',
        content: 'var(--bg-content)',
        card: 'var(--bg-card)',
        secondary: 'var(--bg-secondary)',
        ink: 'var(--text-primary)',
        soft: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        line: 'var(--border-primary)',
        'line-soft': 'var(--border-secondary)',
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          strong: 'var(--accent-strong)',
          soft: 'var(--accent-soft)',
        },
        success: {
          DEFAULT: '#16A34A',
          soft: 'var(--success-soft)',
        },
        warning: {
          DEFAULT: '#F59E0B',
          soft: 'var(--warning-soft)',
        },
        danger: {
          DEFAULT: '#EF4444',
          soft: 'var(--danger-soft)',
        },
        info: {
          DEFAULT: '#3B82F6',
          soft: 'var(--info-soft)',
        },
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.04)',
        soft: '0 1px 3px rgba(16, 24, 40, 0.06), 0 1px 2px rgba(16, 24, 40, 0.03)',
        pop: '0 16px 40px -12px rgba(16, 24, 40, 0.18), 0 4px 12px rgba(16, 24, 40, 0.05)',
        float: '0 24px 60px -18px rgba(16, 24, 40, 0.28)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.18s ease-out',
        'slide-up': 'slide-up 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slide-in-right 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scale-in 0.16s ease-out',
      },
    },
  },
  plugins: [],
};
