import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { en, uk } from 'vuetify/locale'

/** `system` follows the OS — Vuetify resolves it and tracks changes itself. */
export type ThemePreference = 'light' | 'dark' | 'system'

const THEME_STORAGE_KEY = 'schemka:theme'

export function readThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    // Private-mode browsers throw on access; following the OS is a fine fallback.
  }
  return 'system'
}

export function saveThemePreference(value: ThemePreference) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, value)
  } catch {
    // The choice simply will not survive a reload — not worth failing over.
  }
}

const vuetify = createVuetify({
  // Read before mount, so the first paint is already in the stored theme.
  theme: { defaultTheme: readThemePreference() },
  // Pagination, data-table and picker strings ship with Vuetify — pointing
  // them at `uk` keeps built-in components in the admin's language.
  locale: {
    locale: 'uk',
    fallback: 'en',
    messages: { uk, en },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
})

export default vuetify
