import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Static design system colors (admin panel, platform chrome)
        forest: {
          50: '#f2faf2',
          100: '#e8f5e8',
          200: '#c8e6c8',
          300: '#a0d4a0',
          400: '#6bb86b',
          500: '#4a9e4a',
          600: '#3d8b3d',
          700: '#357a35',
          800: '#2d5f2d',
          900: '#264d26',
          950: '#1a2e1a',
        },
        burgundy: {
          50: '#fdf2f6',
          100: '#fce7ef',
          200: '#f9cede',
          300: '#f4a3c0',
          400: '#ec6d96',
          500: '#8b2545',
          600: '#7a1e3c',
          700: '#6b1d34',
          800: '#5a1a2d',
          900: '#4a1525',
          950: '#2d0a16',
        },
        cream: {
          50: '#fdfbf7',
          100: '#faf6f0',
          200: '#f0e8d8',
          300: '#e6d9c0',
          400: '#d4c4a0',
        },
        gold: {
          300: '#e0c860',
          400: '#d4b44a',
          500: '#c8a520',
          600: '#b8960c',
          700: '#9a7d0a',
        },
        charcoal: {
          50: '#f5f5f5',
          100: '#e5e5e5',
          200: '#d0d0d0',
          300: '#b0b0b0',
          400: '#7a7a7a',
          500: '#5a5a5a',
          600: '#4a4a4a',
          700: '#3a3a3a',
          800: '#2a2a2a',
          900: '#1a1a1a',
        },
        // Dynamic tenant brand colors (CSS custom properties)
        // Usage: bg-brand-primary, text-brand-accent, etc.
        brand: {
          primary: 'var(--brand-primary)',
          'primary-light': 'var(--brand-primary-light)',
          'primary-dark': 'var(--brand-primary-dark)',
          secondary: 'var(--brand-secondary)',
          'secondary-light': 'var(--brand-secondary-light)',
          accent: 'var(--brand-accent)',
          'accent-light': 'var(--brand-accent-light)',
          bg: 'var(--brand-bg)',
          surface: 'var(--brand-surface)',
          'surface-alt': 'var(--brand-surface-alt)',
          text: 'var(--brand-text)',
          'text-muted': 'var(--brand-text-muted)',
        },
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        button: '8px',
      },
      boxShadow: {
        card: '0 4px 24px color-mix(in srgb, var(--brand-primary) 8%, transparent)',
        'card-hover': '0 8px 32px color-mix(in srgb, var(--brand-primary) 14%, transparent)',
        nav: '0 2px 16px color-mix(in srgb, var(--brand-primary) 6%, transparent)',
      },
      maxWidth: {
        site: '1280px',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'fade-up': 'fadeUp 0.6s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

export default config
