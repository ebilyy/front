import { palette } from './palette'

const n = palette.neutral
const a = palette.accent
const s = palette.success
const w = palette.warning
const d = palette.danger

/**
 * Semantic colour tokens — what components actually consume.
 *
 * Every token exists in both themes, so a component never needs to know which
 * theme is active. The type below makes the two maps structurally identical:
 * adding a token to `light` forces you to add it to `dark`.
 *
 * Naming: `<role>` is the solid fill, `<role>-fg` is the text/icon colour that
 * sits on it, `<role>-subtle` is the tinted background used for badges and
 * banners, and `<role>-subtle-fg` is the text that sits on *that*.
 */
const light = {
  // Surfaces, from furthest back to closest to the user.
  canvas: n[50],
  surface: n[0],
  'surface-raised': n[0],
  'surface-sunken': n[100],
  'surface-inverse': n[900],

  // Neutral interactive fills (hover, disabled, track backgrounds).
  'fill-subtle': n[100],
  'fill-muted': n[200],
  'fill-strong': n[300],

  // Text and icons.
  text: n[900],
  'text-muted': n[600],
  'text-subtle': n[500],
  'text-disabled': n[400],
  'text-inverse': n[0],

  // Separators and outlines.
  border: n[200],
  'border-subtle': n[100],
  'border-strong': n[300],
  'border-focus': a[500],

  // Brand action — dark buttons on a light UI.
  primary: n[900],
  'primary-hover': n[800],
  'primary-active': n[700],
  'primary-fg': n[0],
  'primary-subtle': n[100],
  'primary-subtle-fg': n[900],

  // Accent — links, focus rings, selected rows.
  accent: a[600],
  'accent-hover': a[700],
  'accent-fg': n[0],
  'accent-subtle': a[50],
  'accent-subtle-fg': a[700],
  'accent-border': a[200],

  success: s[600],
  'success-hover': s[700],
  'success-fg': n[0],
  'success-subtle': s[50],
  'success-subtle-fg': s[700],
  'success-border': s[200],

  warning: w[600],
  'warning-hover': w[700],
  'warning-fg': n[0],
  'warning-subtle': w[50],
  'warning-subtle-fg': w[700],
  'warning-border': w[200],

  danger: d[600],
  'danger-hover': d[700],
  'danger-fg': n[0],
  'danger-subtle': d[50],
  'danger-subtle-fg': d[700],
  'danger-border': d[200],

  info: a[600],
  'info-hover': a[700],
  'info-fg': n[0],
  'info-subtle': a[50],
  'info-subtle-fg': a[700],
  'info-border': a[200],
} as const

export type SemanticColorToken = keyof typeof light

const dark = {
  canvas: n[950],
  surface: n[900],
  'surface-raised': n[800],
  'surface-sunken': n[950],
  'surface-inverse': n[50],

  'fill-subtle': n[800],
  'fill-muted': n[700],
  'fill-strong': n[600],

  text: n[50],
  'text-muted': n[400],
  'text-subtle': n[500],
  'text-disabled': n[600],
  'text-inverse': n[900],

  border: n[700],
  'border-subtle': n[800],
  'border-strong': n[600],
  'border-focus': a[400],

  // Inverted brand action — light buttons on a dark UI.
  primary: n[50],
  'primary-hover': n[0],
  'primary-active': n[200],
  'primary-fg': n[900],
  'primary-subtle': n[800],
  'primary-subtle-fg': n[50],

  accent: a[400],
  'accent-hover': a[300],
  'accent-fg': n[950],
  'accent-subtle': a[950],
  'accent-subtle-fg': a[300],
  'accent-border': a[800],

  success: s[400],
  'success-hover': s[300],
  'success-fg': n[950],
  'success-subtle': s[950],
  'success-subtle-fg': s[300],
  'success-border': s[800],

  warning: w[400],
  'warning-hover': w[300],
  'warning-fg': n[950],
  'warning-subtle': w[950],
  'warning-subtle-fg': w[300],
  'warning-border': w[800],

  danger: d[400],
  'danger-hover': d[300],
  'danger-fg': n[950],
  'danger-subtle': d[950],
  'danger-subtle-fg': d[300],
  'danger-border': d[800],

  info: a[400],
  'info-hover': a[300],
  'info-fg': n[950],
  'info-subtle': a[950],
  'info-subtle-fg': a[300],
  'info-border': a[800],
} as const satisfies Record<SemanticColorToken, string>

export const semanticColors = { light, dark }

/**
 * Alpha-based tokens. Kept apart from `semanticColors` because Vuetify's theme
 * only accepts opaque colours — these are emitted as CSS variables only.
 */
export const semanticEffects = {
  light: {
    scrim: 'rgba(27, 30, 35, 0.45)',
    'shadow-color': '218 13% 12%',
    'shadow-strength': '1',
  },
  dark: {
    scrim: 'rgba(0, 0, 0, 0.65)',
    'shadow-color': '218 14% 3%',
    'shadow-strength': '1.6',
  },
} as const

export type ThemeName = keyof typeof semanticColors
