import type { ThemeDefinition } from 'vuetify'

import { semanticColors, type ThemeName } from '../tokens'

/**
 * Projects the semantic tokens onto Vuetify's theme contract.
 *
 * Vuetify needs opaque colour values (it splits them into RGB channels for its
 * own `--v-theme-*` variables), so it reads the TypeScript tokens directly
 * rather than the CSS variables. Both sides come from `tokens/semantic.ts`,
 * which is what keeps `<v-btn color="primary">` and `class="bg-primary"`
 * showing the same colour.
 *
 * Only the keys Vuetify itself needs, plus a few that are useful on a `color`
 * prop, are exposed here — every extra key also emits `.bg-*` / `.text-*`
 * classes at runtime that would shadow the Tailwind utility of the same name.
 */
function buildTheme(name: ThemeName): ThemeDefinition {
  const c = semanticColors[name]

  return {
    dark: name === 'dark',
    colors: {
      background: c.canvas,
      surface: c.surface,
      'surface-bright': c['surface-raised'],
      'surface-light': c['surface-raised'],
      'surface-variant': c['fill-subtle'],
      'on-background': c.text,
      'on-surface': c.text,
      'on-surface-variant': c['text-muted'],

      'surface-raised': c['surface-raised'],
      'on-surface-raised': c.text,
      'surface-sunken': c['surface-sunken'],
      'on-surface-sunken': c.text,

      primary: c.primary,
      'primary-darken-1': c['primary-hover'],
      'on-primary': c['primary-fg'],

      // Vuetify's `secondary` is the accent in this system; both names are
      // exposed so either reads naturally on a component.
      secondary: c.accent,
      'secondary-darken-1': c['accent-hover'],
      'on-secondary': c['accent-fg'],
      accent: c.accent,
      'on-accent': c['accent-fg'],

      success: c.success,
      'on-success': c['success-fg'],
      warning: c.warning,
      'on-warning': c['warning-fg'],
      // Vuetify hardcodes `error`; `danger` is the design-system name for it.
      error: c.danger,
      'on-error': c['danger-fg'],
      danger: c.danger,
      'on-danger': c['danger-fg'],
      info: c.info,
      'on-info': c['info-fg'],
    },
    variables: {
      // Vuetify draws every component border from these two, so pointing them
      // at the token gives dividers, outlines and table rules one colour.
      'border-color': c.border,
      'border-opacity': 1,
      'theme-kbd': c['surface-inverse'],
      'theme-on-kbd': c['text-inverse'],
      'theme-code': c['surface-sunken'],
      'theme-on-code': c.text,
    },
  }
}

export const themes = {
  light: buildTheme('light'),
  dark: buildTheme('dark'),
} satisfies Record<ThemeName, ThemeDefinition>
