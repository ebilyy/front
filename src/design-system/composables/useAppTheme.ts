import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import type { ThemeInstance } from 'vuetify'

import type { ThemeName } from '../tokens'

export type ThemePreference = ThemeName | 'system'

/** Kept in sync with the inline no-flash script in `index.html`. */
const STORAGE_KEY = 'schemka:theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

const preference = ref<ThemePreference>('system')
const systemPrefersDark = ref(false)

/** The theme actually on screen once `system` has been resolved. */
const activeTheme = computed<ThemeName>(() => {
  if (preference.value === 'system') return systemPrefersDark.value ? 'dark' : 'light'
  return preference.value
})

function readStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    // Private-mode browsers throw on access; falling back to `system` is fine.
  }
  return 'system'
}

function persistPreference(value: ThemePreference) {
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // Preference simply will not survive a reload — not worth failing over.
  }
}

/**
 * Briefly cross-fades colours across the whole document while the theme swaps.
 * The attribute is removed again so it never interferes with hover or focus
 * transitions, which have their own (faster) timings.
 */
let transitionTimer: ReturnType<typeof setTimeout> | undefined

function flagTransition(root: HTMLElement) {
  root.setAttribute('data-theme-transition', '')
  clearTimeout(transitionTimer)
  transitionTimer = setTimeout(() => root.removeAttribute('data-theme-transition'), 200)
}

/**
 * Wires the controller to Vuetify and the DOM. Call once, from `main.ts`,
 * before mounting — components then use `useAppTheme()`.
 */
export function installTheme(theme: ThemeInstance) {
  preference.value = readStoredPreference()

  const media = window.matchMedia(DARK_QUERY)
  systemPrefersDark.value = media.matches
  media.addEventListener('change', (event) => {
    systemPrefersDark.value = event.matches
  })

  let isFirstApply = true

  watch(
    activeTheme,
    (name) => {
      const root = document.documentElement
      // The inline script already painted the first theme; animating it here
      // would fade in from the wrong colours on load.
      if (!isFirstApply) flagTransition(root)
      isFirstApply = false

      root.dataset.theme = name
      root.style.colorScheme = name
      theme.change(name)
    },
    { immediate: true },
  )

  watch(preference, persistPreference)
}

export interface AppTheme {
  /** What the user chose — including `system`, which follows the OS. */
  preference: Ref<ThemePreference>
  /** What is rendered right now: always `light` or `dark`. */
  activeTheme: ComputedRef<ThemeName>
  isDark: ComputedRef<boolean>
  setPreference: (value: ThemePreference) => void
  /** Flips between light and dark, leaving `system` behind. */
  toggle: () => void
}

export function useAppTheme(): AppTheme {
  return {
    preference,
    activeTheme,
    isDark: computed(() => activeTheme.value === 'dark'),
    setPreference: (value) => {
      preference.value = value
    },
    toggle: () => {
      preference.value = activeTheme.value === 'dark' ? 'light' : 'dark'
    },
  }
}
