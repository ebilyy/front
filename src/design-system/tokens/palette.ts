/**
 * Primitive colour ramps — the raw material of the design system.
 *
 * Nothing in the app should reference these directly: components consume the
 * semantic tokens in `semantic.ts`, which alias these stops per theme.
 *
 * The ramps are generated in HSL around the brand base `#1B1E23`
 * (hsl(218, 13%, 12%)), so every neutral shares the brand hue.
 */

export const palette = {
  /** Brand neutral. `900` is the brand base colour `#1B1E23`. */
  neutral: {
    0: '#FFFFFF',
    50: '#F9FAFB',
    100: '#F3F4F7',
    200: '#E4E7EC',
    300: '#CDD2DA',
    400: '#98A0AE',
    500: '#6D7788',
    600: '#555E6D',
    700: '#3E4551',
    800: '#2C313A',
    900: '#1B1E23',
    950: '#121417',
    1000: '#000000',
  },
  /** Interactive accent — links, focus rings, selected states. */
  accent: {
    50: '#F0F6FF',
    100: '#DCE9FE',
    200: '#BAD4FC',
    300: '#8BB5F9',
    400: '#5C96F5',
    500: '#3179ED',
    600: '#1B64DA',
    700: '#1D55AF',
    800: '#1C4587',
    900: '#183562',
    950: '#102341',
  },
  success: {
    50: '#EDFDF5',
    100: '#D4F7E7',
    200: '#AAEECE',
    300: '#74DCAC',
    400: '#3ECC89',
    500: '#27A56A',
    600: '#1C8755',
    700: '#156F45',
    800: '#105635',
    900: '#0D3F28',
    950: '#092A1B',
  },
  warning: {
    50: '#FEF6E6',
    100: '#FDE8C4',
    200: '#FCD592',
    300: '#FABE57',
    400: '#F8AB25',
    500: '#E6950A',
    600: '#BD7B0A',
    700: '#93610B',
    800: '#744E0B',
    900: '#563B0B',
    950: '#362507',
  },
  danger: {
    50: '#FEF0F1',
    100: '#FDDDE0',
    200: '#FABDC1',
    300: '#F58E95',
    400: '#EE636C',
    500: '#E13743',
    600: '#C7232E',
    700: '#A31F28',
    800: '#7D1C22',
    900: '#5E171C',
    950: '#3D0F12',
  },
} as const

export type Palette = typeof palette
export type PaletteFamily = keyof Palette
