import type { ThemePreset, FontPreset, ButtonStyle, TenantBranding } from '@/types'

/**
 * Theme Presets — controlled color palettes for white-label tenants.
 *
 * Each preset defines a harmonious color system. Tenants pick one,
 * or choose 'custom' for manual hex overrides (within reasonable bounds).
 *
 * Colors map to CSS custom properties: --brand-primary, --brand-secondary, etc.
 * Tailwind uses these via `brand-xxx` utility classes.
 */

export interface ThemeColors {
  primary: string
  primaryLight: string
  primaryDark: string
  secondary: string
  secondaryLight: string
  accent: string
  accentLight: string
  background: string
  surface: string
  surfaceAlt: string
  text: string
  textMuted: string
}

export const THEME_PRESETS: Record<ThemePreset, { name: string; colors: ThemeColors }> = {
  forest: {
    name: 'Orman Yeşili',
    colors: {
      primary: '#264d26',
      primaryLight: '#357a35',
      primaryDark: '#1a2e1a',
      secondary: '#b8960c',
      secondaryLight: '#d4b44a',
      accent: '#b8960c',
      accentLight: '#d4b44a',
      background: '#fdfbf7',
      surface: '#faf6f0',
      surfaceAlt: '#f0e8d8',
      text: '#1a1a1a',
      textMuted: '#4a4a4a',
    },
  },
  ocean: {
    name: 'Okyanus',
    colors: {
      primary: '#1e4d6e',
      primaryLight: '#2a6f97',
      primaryDark: '#0f2d42',
      secondary: '#cd853f',
      secondaryLight: '#deb887',
      accent: '#cd853f',
      accentLight: '#deb887',
      background: '#fafcff',
      surface: '#f0f5fa',
      surfaceAlt: '#dce8f0',
      text: '#1a1a2e',
      textMuted: '#4a4a5a',
    },
  },
  sunset: {
    name: 'Gün Batımı',
    colors: {
      primary: '#d4520a',
      primaryLight: '#e87830',
      primaryDark: '#a03d08',
      secondary: '#f5c518',
      secondaryLight: '#ffd84d',
      accent: '#f5c518',
      accentLight: '#ffd84d',
      background: '#fffbf5',
      surface: '#fff5eb',
      surfaceAlt: '#ffe8d0',
      text: '#1a1510',
      textMuted: '#5a4a3a',
    },
  },
  midnight: {
    name: 'Gece Mavisi',
    colors: {
      primary: '#1a1a2e',
      primaryLight: '#2d2d4a',
      primaryDark: '#0d0d1a',
      secondary: '#e94560',
      secondaryLight: '#f06880',
      accent: '#e94560',
      accentLight: '#f06880',
      background: '#fafafa',
      surface: '#f5f5f8',
      surfaceAlt: '#e8e8f0',
      text: '#1a1a2e',
      textMuted: '#4a4a5e',
    },
  },
  rose: {
    name: 'Gül',
    colors: {
      primary: '#9b2c5a',
      primaryLight: '#c23670',
      primaryDark: '#721f42',
      secondary: '#d4a017',
      secondaryLight: '#e8b840',
      accent: '#d4a017',
      accentLight: '#e8b840',
      background: '#fffbfc',
      surface: '#fdf2f5',
      surfaceAlt: '#f5e0e8',
      text: '#1a1015',
      textMuted: '#5a3a45',
    },
  },
  amber: {
    name: 'Amber',
    colors: {
      primary: '#92400e',
      primaryLight: '#b45309',
      primaryDark: '#6d2f0a',
      secondary: '#d97706',
      secondaryLight: '#f59e0b',
      accent: '#d97706',
      accentLight: '#f59e0b',
      background: '#fffdf5',
      surface: '#fef9ee',
      surfaceAlt: '#fcefd5',
      text: '#1a1508',
      textMuted: '#5a4a30',
    },
  },
  slate: {
    name: 'Arduvaz',
    colors: {
      primary: '#334155',
      primaryLight: '#475569',
      primaryDark: '#1e293b',
      secondary: '#dc2626',
      secondaryLight: '#ef4444',
      accent: '#dc2626',
      accentLight: '#ef4444',
      background: '#fafafa',
      surface: '#f8fafc',
      surfaceAlt: '#e2e8f0',
      text: '#0f172a',
      textMuted: '#475569',
    },
  },
  custom: {
    name: 'Özel',
    colors: {
      // Fallback colors for custom theme — overridden by tenant's hex values
      primary: '#264d26',
      primaryLight: '#357a35',
      primaryDark: '#1a2e1a',
      secondary: '#b8960c',
      secondaryLight: '#d4b44a',
      accent: '#b8960c',
      accentLight: '#d4b44a',
      background: '#fdfbf7',
      surface: '#faf6f0',
      surfaceAlt: '#f0e8d8',
      text: '#1a1a1a',
      textMuted: '#4a4a4a',
    },
  },
}

/**
 * Font presets — controlled typography pairings.
 * Each preset specifies a heading (serif/display) and body (sans) font.
 * Fonts are loaded dynamically via next/font/google in the layout.
 */
export const FONT_PRESETS: Record<FontPreset, {
  name: string
  heading: string
  headingWeights: string[]
  body: string
  bodyWeights: string[]
}> = {
  classic: {
    name: 'Klasik',
    heading: 'Playfair Display',
    headingWeights: ['400', '600', '700'],
    body: 'Inter',
    bodyWeights: ['400', '500', '600'],
  },
  modern: {
    name: 'Modern',
    heading: 'Plus Jakarta Sans',
    headingWeights: ['500', '600', '700'],
    body: 'Inter',
    bodyWeights: ['400', '500', '600'],
  },
  elegant: {
    name: 'Zarif',
    heading: 'Cormorant Garamond',
    headingWeights: ['400', '600', '700'],
    body: 'Lato',
    bodyWeights: ['400', '700'],
  },
  playful: {
    name: 'Oyuncu',
    heading: 'Poppins',
    headingWeights: ['500', '600', '700'],
    body: 'Nunito',
    bodyWeights: ['400', '600'],
  },
}

/**
 * Button style presets.
 */
export const BUTTON_STYLES: Record<ButtonStyle, { borderRadius: string }> = {
  rounded: { borderRadius: '8px' },
  pill: { borderRadius: '9999px' },
  sharp: { borderRadius: '2px' },
}

/**
 * Generate CSS custom property values from tenant branding.
 * Returns an object suitable for `style` prop on <html> or <body>.
 */
export function generateThemeVars(branding: TenantBranding): Record<string, string> {
  const preset = THEME_PRESETS[branding.theme_preset] || THEME_PRESETS.forest
  const colors = { ...preset.colors }

  // Apply custom color overrides if theme_preset is 'custom'
  if (branding.theme_preset === 'custom') {
    if (branding.color_primary) colors.primary = branding.color_primary
    if (branding.color_secondary) colors.secondary = branding.color_secondary
    if (branding.color_accent) colors.accent = branding.color_accent
    if (branding.color_background) colors.background = branding.color_background
    if (branding.color_surface) colors.surface = branding.color_surface
  }

  const btnStyle = BUTTON_STYLES[branding.button_style] || BUTTON_STYLES.rounded

  return {
    '--brand-primary': colors.primary,
    '--brand-primary-light': colors.primaryLight,
    '--brand-primary-dark': colors.primaryDark,
    '--brand-secondary': colors.secondary,
    '--brand-secondary-light': colors.secondaryLight,
    '--brand-accent': colors.accent,
    '--brand-accent-light': colors.accentLight,
    '--brand-bg': colors.background,
    '--brand-surface': colors.surface,
    '--brand-surface-alt': colors.surfaceAlt,
    '--brand-text': colors.text,
    '--brand-text-muted': colors.textMuted,
    '--brand-btn-radius': btnStyle.borderRadius,
  }
}
