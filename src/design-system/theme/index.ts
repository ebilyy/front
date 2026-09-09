import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { en, uk } from 'vuetify/locale'

import { defaults } from './defaults'
import { themes } from './vuetify'

/**
 * Builds the Vuetify instance for the admin.
 *
 * Vuetify's own CSS is not imported here on purpose — `vite.config.ts` runs the
 * plugin with `styles: 'none'` and `styles/index.css` pulls the stylesheet into
 * the `vuetify` cascade layer, which is what lets Tailwind utilities override
 * component styles without `!important`.
 */
export function createDesignSystem() {
  return createVuetify({
    theme: {
      defaultTheme: 'light',
      themes,
    },
    defaults,
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
}

export { themes } from './vuetify'
export { defaults } from './defaults'
