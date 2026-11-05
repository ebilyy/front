import type { ImportFieldKey } from '@/core/api'

/** `0` → `A`, `25` → `Z`, `26` → `AA`. */
export function columnLetter(index: number): string {
  let letter = ''
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    letter = String.fromCharCode(65 + ((n - 1) % 26)) + letter
  }
  return letter
}

/** `A` → `0`, `AA` → `26`; `-1` for anything that is not a column letter. */
export function columnIndex(letter: string): number {
  const normalized = letter.trim().toUpperCase()
  if (!/^[A-Z]{1,3}$/.test(normalized)) return -1

  let index = 0
  for (const char of normalized) index = index * 26 + (char.charCodeAt(0) - 64)
  return index - 1
}

/** Lowercase, `_` and non-breaking spaces as plain spaces, runs of spaces collapsed. */
export function normalizeHeader(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\s_ ]+/g, ' ')
    .trim()
}

/**
 * Header texts that point at each import field, already normalized. Seeded
 * from the headers of the real supplier price lists (`price-fields.json`),
 * Ukrainian and Russian alike. A miss costs one click, so this stays a
 * suggestion list, not a rule.
 */
export const HEADER_SYNONYMS: Record<ImportFieldKey, readonly string[]> = {
  code: [
    'код',
    'код товару',
    'код товара',
    'артикул',
    'артикул товару',
    'артикул товара',
    'sku',
    'vendorcode',
    'vendor code',
    'part number',
    'id',
  ],
  name: [
    'найменування',
    'наименование',
    'назва',
    'назва товару',
    'название',
    'номенклатура',
    'товар',
    'name',
    'title',
  ],
  price: [
    'ціна',
    'цена',
    'price',
    'вартість',
    'стоимость',
    'опт',
    'оптова ціна',
    'оптовая цена',
    'ціна закупівлі',
    'ценазакупки',
    'дилер',
    'диллер',
    'партнер',
    'partner',
    'vip',
  ],
  retailPrice: [
    'ррц',
    'мрц',
    'роздріб',
    'розница',
    'роздрібна ціна',
    'розничная цена',
    'ціна роздрібна',
    'цена розничная',
    'ценаррц',
    'retail price',
  ],
  availability: [
    'наявність',
    'наличие',
    'доступність',
    'доступность',
    'в наявності',
    'в наличии',
    'availability',
    'available',
    'in stock',
  ],
  quantity: [
    'кількість',
    'количество',
    'к-ть',
    'к-сть',
    'кол-во',
    'залишок',
    'остаток',
    'остатки',
    'qty',
    'quantity',
    'quantity in stock',
    'stock quantity',
  ],
  barcode: ['штрихкод', 'штрих-код', 'штрих код', 'ean', 'ean13', 'barcode', 'upc'],
  brand: ['бренд', 'виробник', 'производитель', 'марка', 'brand', 'vendor', 'manufacturer'],
  category: ['категорія', 'категория', 'група', 'группа', 'розділ', 'раздел', 'category'],
  description: ['опис', 'описание', 'характеристики', 'description'],
  imageUrl: [
    'фото',
    'зображення',
    'изображение',
    'картинка',
    'image',
    'image url',
    'picture',
    'photo',
  ],
}

interface HeaderMatch {
  key: ImportFieldKey
  /** Higher is surer: see the tiers below; within a tier a longer synonym wins. */
  score: number
}

/** The header is the synonym: `Ціна`. */
const EXACT = 2000
/** The header starts with the synonym as a word: `Ціна (usd)`. */
const PREFIX = 1000
/** The synonym is a word somewhere inside: `Ваша Ціна USD`, `4_Диллер`. Weakest. */
const INSIDE = 0

const WORD_CHAR = /[\p{L}\p{N}]/u

/** Whether `synonym` occurs in `header` at `index` as a whole word. */
function isWordAt(header: string, synonym: string, index: number): boolean {
  return (
    !WORD_CHAR.test(header.charAt(index - 1)) &&
    !WORD_CHAR.test(header.charAt(index + synonym.length))
  )
}

function synonymScore(header: string, synonym: string): number | null {
  if (header === synonym) return EXACT + synonym.length

  for (let at = header.indexOf(synonym); at >= 0; at = header.indexOf(synonym, at + 1)) {
    if (isWordAt(header, synonym, at)) return (at === 0 ? PREFIX : INSIDE) + synonym.length
  }
  return null
}

/**
 * The field a header text most likely means: `ціна (usd)` is a price,
 * `ціна роздрібна, грн` a retail price (the longer synonym), `кодування`
 * nothing. With `anywhere: false` a synonym deep inside the text does not
 * count — that is for telling a header row from a data row.
 */
export function matchHeader(
  text: string,
  keys: readonly ImportFieldKey[],
  { anywhere = true } = {},
): HeaderMatch | null {
  const header = normalizeHeader(text)
  if (!header) return null

  let best: HeaderMatch | null = null
  for (const key of keys) {
    for (const synonym of HEADER_SYNONYMS[key] ?? []) {
      const score = synonymScore(header, synonym)
      if (score === null || (!anywhere && score < PREFIX)) continue
      if (score > (best?.score ?? -1)) best = { key, score }
    }
  }
  return best
}

/**
 * Proposes a column for each field from the header row's texts. Each field
 * and each column is used once: the surest matches claim theirs first, and on
 * a tie the leftmost column wins.
 */
export function suggestMappings(
  headerCells: readonly string[],
  keys: readonly ImportFieldKey[],
): Map<ImportFieldKey, number> {
  const candidates = headerCells
    .map((text, column) => ({ column, match: matchHeader(text, keys) }))
    .filter((candidate): candidate is { column: number; match: HeaderMatch } => !!candidate.match)
    .sort((a, b) => b.match.score - a.match.score || a.column - b.column)

  const mappings = new Map<ImportFieldKey, number>()
  const taken = new Set<number>()
  for (const { column, match } of candidates) {
    if (mappings.has(match.key) || taken.has(column)) continue
    mappings.set(match.key, column)
    taken.add(column)
  }
  return mappings
}

const NUMERIC = /^[-+]?[\d\s.,]+%?$/

/**
 * The 1-based row that most looks like the header row among the first
 * `scanRows`. A cell that is or starts with a known header is worth ten plain
 * text cells, so a data row full of names and brands does not outvote the real
 * header — a synonym buried in a product name (`… ціна …`) earns nothing extra.
 * Numbers count for nothing. On a tie the upper row wins; with nothing to go
 * on, row 1.
 */
export function guessHeaderRow(
  grid: readonly (readonly string[])[],
  keys: readonly ImportFieldKey[],
  scanRows = 30,
): number {
  let bestRow = 0
  let bestScore = 0

  grid.slice(0, scanRows).forEach((row, index) => {
    let score = 0
    for (const cell of row) {
      const text = cell.trim()
      if (!text || NUMERIC.test(text)) continue
      score += matchHeader(text, keys, { anywhere: false }) ? 10 : 1
    }
    if (score > bestScore) {
      bestRow = index
      bestScore = score
    }
  })

  return bestRow + 1
}
