/**
 * Non-colour primitives: spacing, radius, type, elevation, motion, layout.
 *
 * These are theme-independent — they resolve to the same value in light and
 * dark — so they are emitted once on `:root`.
 */

/** 4px base grid. Keys are the multiplier, so `space[4]` is 16px. */
export const space = {
  0: '0px',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const

export const radius = {
  none: '0px',
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  full: '9999px',
} as const

export const font = {
  sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
} as const

/** Size / line-height pairs. `base` (14px) is the admin body size. */
export const fontSize = {
  '2xs': ['11px', '16px'],
  xs: ['12px', '16px'],
  sm: ['13px', '20px'],
  base: ['14px', '20px'],
  md: ['15px', '24px'],
  lg: ['16px', '24px'],
  xl: ['18px', '28px'],
  '2xl': ['20px', '28px'],
  '3xl': ['24px', '32px'],
  '4xl': ['30px', '38px'],
} as const

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const

export const letterSpacing = {
  tight: '-0.011em',
  normal: '0em',
  wide: '0.02em',
} as const

/**
 * Elevation. Alpha is driven by `--ds-shadow-color` / `--ds-shadow-strength`,
 * which the theme swaps — so shadows read correctly on dark surfaces without a
 * second set of definitions.
 */
export const shadow = {
  none: 'none',
  xs: '0 1px 2px 0 hsl(var(--ds-shadow-color) / calc(0.05 * var(--ds-shadow-strength)))',
  sm: '0 1px 3px 0 hsl(var(--ds-shadow-color) / calc(0.08 * var(--ds-shadow-strength))), 0 1px 2px -1px hsl(var(--ds-shadow-color) / calc(0.06 * var(--ds-shadow-strength)))',
  md: '0 4px 8px -2px hsl(var(--ds-shadow-color) / calc(0.10 * var(--ds-shadow-strength))), 0 2px 4px -2px hsl(var(--ds-shadow-color) / calc(0.06 * var(--ds-shadow-strength)))',
  lg: '0 12px 20px -6px hsl(var(--ds-shadow-color) / calc(0.12 * var(--ds-shadow-strength))), 0 4px 8px -4px hsl(var(--ds-shadow-color) / calc(0.08 * var(--ds-shadow-strength)))',
  xl: '0 24px 40px -12px hsl(var(--ds-shadow-color) / calc(0.18 * var(--ds-shadow-strength))), 0 8px 16px -8px hsl(var(--ds-shadow-color) / calc(0.10 * var(--ds-shadow-strength)))',
} as const

export const duration = {
  instant: '80ms',
  fast: '120ms',
  base: '180ms',
  slow: '260ms',
} as const

export const easing = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  enter: 'cubic-bezier(0, 0, 0.2, 1)',
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
} as const

/**
 * Stacking order for design-system components. Vuetify's own overlays live at
 * 2400+, so anything that must sit above a Vuetify dialog needs its own value
 * rather than a token from here.
 */
export const zIndex = {
  base: '0',
  sticky: '100',
  sidebar: '200',
  topbar: '300',
  dropdown: '400',
  toast: '500',
} as const

/** Admin shell geometry. */
export const layout = {
  'sidebar-width': '260px',
  'sidebar-width-collapsed': '68px',
  'topbar-height': '56px',
  'content-max-width': '1440px',
  'page-gutter': '24px',
} as const
