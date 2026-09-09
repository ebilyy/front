import type { DefaultsInstance } from 'vuetify'

/**
 * Global component defaults — the part of the design system that makes plain
 * Vuetify markup already correct.
 *
 * Rather than wrapping every control in a bespoke component, the shared
 * decisions (density, variant, focus colour, where messages go) live here, so
 * `<v-text-field>` written anywhere in the admin comes out consistent.
 *
 * House rules encoded below:
 *   - `<v-btn>`                       neutral secondary action
 *   - `<v-btn color="primary">`       the one primary action on a view
 *   - `<v-btn variant="text">`        tertiary / toolbar action
 *   - `<v-btn color="danger">`        destructive action
 *
 * Note the absence of `rounded` and `elevation`: those props emit `!important`
 * utilities, which a later cascade layer cannot override. Radius and shadow
 * come from `styles/vuetify-bridge.css` instead.
 */
const field = {
  variant: 'outlined',
  density: 'comfortable',
  color: 'accent',
  // Reserve message space only once a message exists, so forms do not jump.
  hideDetails: 'auto',
} as const

const selectionControl = {
  color: 'accent',
  density: 'comfortable',
  hideDetails: 'auto',
} as const

export const defaults: DefaultsInstance = {
  global: {
    // Material ink ripples read as noise in a dense admin UI.
    ripple: false,
  },

  VBtn: {
    variant: 'outlined',
    height: 36,
  },
  VBtnGroup: {
    variant: 'outlined',
    divided: true,
  },

  VTextField: field,
  VTextarea: field,
  VSelect: field,
  VAutocomplete: field,
  VCombobox: field,
  VFileInput: field,

  VCheckbox: selectionControl,
  VRadioGroup: selectionControl,
  VSwitch: { ...selectionControl, inset: true },

  VCard: {
    variant: 'outlined',
  },
  VCardTitle: {
    class: 'text-lg font-semibold',
  },

  VChip: {
    variant: 'tonal',
    size: 'small',
    label: true,
  },

  VAlert: {
    variant: 'tonal',
    density: 'comfortable',
  },

  VList: {
    density: 'comfortable',
  },
  VMenu: {
    offset: 4,
  },
  VTooltip: {
    location: 'top',
  },

  VTabs: {
    color: 'accent',
    density: 'comfortable',
    sliderColor: 'accent',
  },

  VDataTable: {
    density: 'comfortable',
    hover: true,
  },
  VDataTableServer: {
    density: 'comfortable',
    hover: true,
  },
  VPagination: {
    density: 'comfortable',
    activeColor: 'accent',
    totalVisible: 7,
    variant: 'text',
  },

  VProgressLinear: {
    color: 'accent',
    height: 2,
  },
  VProgressCircular: {
    color: 'accent',
  },
}
