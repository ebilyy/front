export * from './tokens'
export { createDesignSystem, themes, defaults } from './theme'
export { installTheme, useAppTheme } from './composables/useAppTheme'
export type { AppTheme, ThemePreference } from './composables/useAppTheme'

// The components themselves live in `src/core/components`; the design system
// re-exports them so `@/design-system` stays a single import surface for tokens,
// theme and components alike.
export * from '@/core/components'
