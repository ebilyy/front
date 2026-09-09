/**
 * Generates `src/design-system/styles/tokens.generated.css` from the TypeScript
 * token modules.
 *
 * The TS modules are the single source of truth: Vuetify's theme reads them
 * directly, and this script projects the same values into CSS custom properties
 * so Tailwind utilities and hand-written CSS resolve to identical colours.
 *
 * Run with `npm run tokens:build` after editing anything under `tokens/`.
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

import { createJiti } from 'jiti'
import { format, resolveConfig } from 'prettier'

// jiti resolves the extensionless imports the app-side TS modules use, which
// bare `node` cannot do even with type stripping enabled.
const jiti = createJiti(import.meta.url)

const { palette } = await jiti.import('../src/design-system/tokens/palette.ts')
const { semanticColors, semanticEffects } = await jiti.import(
  '../src/design-system/tokens/semantic.ts',
)
const {
  space,
  radius,
  font,
  fontSize,
  fontWeight,
  letterSpacing,
  shadow,
  duration,
  easing,
  zIndex,
  layout,
} = await jiti.import('../src/design-system/tokens/scale.ts')

const STYLES = resolve(dirname(fileURLToPath(import.meta.url)), '../src/design-system/styles')
const TOKENS_OUT = resolve(STYLES, 'tokens.generated.css')
const THEME_OUT = resolve(STYLES, 'tailwind-theme.generated.css')

/** `0.5` is a legal object key but not a legal CSS identifier segment. */
const cssKey = (key) => String(key).replace('.', '-')

/** Prettier normalises hex to lower case; matching it keeps the file stable. */
const cssValue = (value) => (/^#[0-9a-f]+$/i.test(value) ? value.toLowerCase() : value)

const declarations = (entries, indent = '  ') =>
  entries.map(([name, value]) => `${indent}--ds-${name}: ${cssValue(value)};`).join('\n')

const section = (title) => `\n  /* ${title} */\n`

const primitives = Object.entries(palette).flatMap(([family, stops]) =>
  Object.entries(stops).map(([stop, hex]) => [`color-${family}-${stop}`, hex]),
)

const scale = [
  section('Spacing — 4px grid').trimEnd(),
  declarations(Object.entries(space).map(([k, v]) => [`space-${cssKey(k)}`, v])),
  section('Radius').trimEnd(),
  declarations(Object.entries(radius).map(([k, v]) => [`radius-${cssKey(k)}`, v])),
  section('Typography').trimEnd(),
  declarations(Object.entries(font).map(([k, v]) => [`font-${k}`, v])),
  declarations(
    Object.entries(fontSize).flatMap(([k, [size, lineHeight]]) => [
      [`font-size-${cssKey(k)}`, size],
      [`line-height-${cssKey(k)}`, lineHeight],
    ]),
  ),
  declarations(Object.entries(fontWeight).map(([k, v]) => [`font-weight-${k}`, v])),
  declarations(Object.entries(letterSpacing).map(([k, v]) => [`tracking-${k}`, v])),
  section('Elevation').trimEnd(),
  declarations(Object.entries(shadow).map(([k, v]) => [`shadow-${cssKey(k)}`, v])),
  section('Motion').trimEnd(),
  declarations(Object.entries(duration).map(([k, v]) => [`duration-${k}`, v])),
  declarations(Object.entries(easing).map(([k, v]) => [`ease-${k}`, v])),
  section('Stacking').trimEnd(),
  declarations(Object.entries(zIndex).map(([k, v]) => [`z-${k}`, v])),
  section('Admin shell geometry').trimEnd(),
  declarations(Object.entries(layout).map(([k, v]) => [`layout-${k}`, v])),
].join('\n')

const theme = (name) =>
  [
    declarations(Object.entries(semanticColors[name])),
    declarations(Object.entries(semanticEffects[name])),
    `  color-scheme: ${name};`,
  ].join('\n')

const css = `/**
 * GENERATED FILE — do not edit by hand.
 * Source: src/design-system/tokens/*.ts
 * Regenerate: npm run tokens:build
 */

:root {
  /* Primitive palette — prefer the semantic tokens below. */
${declarations(primitives)}
${scale}
}

/* Light is the default theme, so it also answers before JS sets data-theme. */
:root,
[data-theme='light'] {
${theme('light')}
}

[data-theme='dark'] {
${theme('dark')}
}
`

/**
 * Tailwind reads the same tokens through `@theme`, so a utility such as
 * `bg-surface` and a hand-written `var(--ds-surface)` can never disagree.
 * Colour utilities point at the themed variables rather than raw hex, which is
 * what makes every utility theme-aware for free.
 */

/** Semantic tokens named `text*` would produce awkward `text-text` utilities. */
const TAILWIND_COLOR_ALIASES = {
  text: 'fg',
  'text-muted': 'fg-muted',
  'text-subtle': 'fg-subtle',
  'text-disabled': 'fg-disabled',
  'text-inverse': 'fg-inverse',
}

const themeColors = Object.keys(semanticColors.light).map((token) => {
  const name = TAILWIND_COLOR_ALIASES[token] ?? token
  return `  --color-${name}: var(--ds-${token});`
})

const themeBlock = `@theme {
  /* Drop Tailwind's stock palette so only design-system colours are reachable. */
  --color-*: initial;
  --color-inherit: inherit;
  --color-current: currentColor;
  --color-transparent: transparent;
  --color-white: var(--ds-color-neutral-0);
  --color-black: var(--ds-color-neutral-1000);

${themeColors.join('\n')}

  /* 4px grid — matches the \`space\` tokens, so \`p-4\` is 16px. */
  --spacing: 4px;

  --font-sans: var(--ds-font-sans);
  --font-mono: var(--ds-font-mono);

  --text-*: initial;
${Object.keys(fontSize)
  .map(
    (k) =>
      `  --text-${cssKey(k)}: var(--ds-font-size-${cssKey(k)});\n` +
      `  --text-${cssKey(k)}--line-height: var(--ds-line-height-${cssKey(k)});`,
  )
  .join('\n')}

  --font-weight-*: initial;
${Object.keys(fontWeight)
  .map((k) => `  --font-weight-${k}: var(--ds-font-weight-${k});`)
  .join('\n')}

  --tracking-*: initial;
${Object.keys(letterSpacing)
  .map((k) => `  --tracking-${k}: var(--ds-tracking-${k});`)
  .join('\n')}

  --radius-*: initial;
${Object.keys(radius)
  .filter((k) => k !== 'none')
  .map((k) => `  --radius-${cssKey(k)}: var(--ds-radius-${cssKey(k)});`)
  .join('\n')}

  --shadow-*: initial;
${Object.keys(shadow)
  .filter((k) => k !== 'none')
  .map((k) => `  --shadow-${cssKey(k)}: var(--ds-shadow-${cssKey(k)});`)
  .join('\n')}

  --ease-*: initial;
${Object.keys(easing)
  .map((k) => `  --ease-${k}: var(--ds-ease-${k});`)
  .join('\n')}
}
`

const themeCss = `/**
 * GENERATED FILE — do not edit by hand.
 * Source: src/design-system/tokens/*.ts
 * Regenerate: npm run tokens:build
 */

${themeBlock}`

// Run the output through Prettier so `npm run format` never rewrites what this
// script just produced, which would otherwise show up as a spurious diff.
const prettierConfig = await resolveConfig(TOKENS_OUT)

async function writeFormatted(path, contents) {
  writeFileSync(path, await format(contents, { ...prettierConfig, parser: 'css' }), 'utf8')
}

await writeFormatted(TOKENS_OUT, css)
await writeFormatted(THEME_OUT, themeCss)
console.log(
  `tokens \u2192 tokens.generated.css + tailwind-theme.generated.css ` +
    `(${primitives.length} primitives, ${Object.keys(semanticColors.light).length} semantic \u00d7 2 themes)`,
)
