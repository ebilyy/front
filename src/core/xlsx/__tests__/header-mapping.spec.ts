import { describe, expect, it } from 'vitest'

import type { ImportFieldKey } from '@/core/api'
import {
  columnIndex,
  columnLetter,
  guessHeaderRow,
  matchHeader,
  normalizeHeader,
  suggestMappings,
} from '@/core/xlsx'

const KEYS: ImportFieldKey[] = [
  'code',
  'name',
  'price',
  'retailPrice',
  'availability',
  'quantity',
  'barcode',
  'brand',
  'category',
  'description',
  'imageUrl',
]

describe('columnLetter / columnIndex', () => {
  it.each([
    [0, 'A'],
    [25, 'Z'],
    [26, 'AA'],
    [51, 'AZ'],
    [701, 'ZZ'],
    [702, 'AAA'],
  ])('%i ↔ %s', (index, letter) => {
    expect(columnLetter(index)).toBe(letter)
    expect(columnIndex(letter)).toBe(index)
  })

  it('accepts lowercase and padding, refuses anything else', () => {
    expect(columnIndex(' d ')).toBe(3)
    expect(columnIndex('')).toBe(-1)
    expect(columnIndex('A1')).toBe(-1)
    expect(columnIndex('ABCD')).toBe(-1)
  })
})

describe('normalizeHeader', () => {
  it('lowercases and folds underscores and non-breaking spaces', () => {
    expect(normalizeHeader('  Stock_Quantity  ')).toBe('stock quantity')
    expect(normalizeHeader('Ціна\n(USD)')).toBe('ціна (usd)')
  })
})

describe('matchHeader', () => {
  it('takes the longest synonym the header starts with as a whole word', () => {
    expect(matchHeader('Ціна (usd)', KEYS)?.key).toBe('price')
    expect(matchHeader('Ціна роздрібна, грн', KEYS)?.key).toBe('retailPrice')
    expect(matchHeader('Опт 2000', KEYS)?.key).toBe('price')
  })

  it('does not match a synonym that is only the start of a longer word', () => {
    expect(matchHeader('Кодування', KEYS)).toBeNull()
    // Not `товар` → name: «група» inside still makes it a category.
    expect(matchHeader('Товарна група', KEYS)?.key).toBe('category')
  })

  it('finds a synonym inside the header as a whole word, below any prefix match', () => {
    expect(matchHeader('Ваша Ціна USD', KEYS)?.key).toBe('price')
    expect(matchHeader('4_Диллер', KEYS)?.key).toBe('price')
    expect(matchHeader('2 VIP S', KEYS)?.key).toBe('price')
    expect(matchHeader('Ваша Ціна USD', KEYS, { anywhere: false })).toBeNull()

    const row = ['Ваша Ціна USD', 'Ціна (usd)']
    expect(suggestMappings(row, KEYS).get('price')).toBe(1)
  })

  it('ignores fields outside the given registry', () => {
    expect(matchHeader('Бренд', ['code', 'name', 'price'])).toBeNull()
  })
})

describe('suggestMappings', () => {
  it('maps the afm-v1 header row', () => {
    const row = ['', 'Код', 'Найменування', 'Ціна (usd)']
    expect(Object.fromEntries(suggestMappings(row, KEYS))).toEqual({ code: 1, name: 2, price: 3 })
  })

  it('gives a field to its exact match over an earlier prefix match', () => {
    const row = ['Ціна опт, USD', 'Ціна']
    expect(suggestMappings(row, KEYS).get('price')).toBe(1)
  })

  it('uses each field once, leftmost column first on a tie', () => {
    const row = ['Назва', 'Назва', 'Артикул']
    expect(Object.fromEntries(suggestMappings(row, KEYS))).toEqual({ name: 0, code: 2 })
  })
})

describe('guessHeaderRow', () => {
  it('finds a header below a title and blank rows', () => {
    const grid = [
      ['Прайс-лист ТОВ «Ромашка» на 05.05.2026', '', ''],
      ['', '', ''],
      ['Артикул', 'Найменування', 'Ціна'],
      ['A-1', 'Дисплей iPhone 11', '12.50'],
    ]
    expect(guessHeaderRow(grid, KEYS)).toBe(3)
  })

  it('does not take a text-heavy data row for the header', () => {
    const grid = [
      ['Код', 'Назва', 'Ціна'],
      ['Apple', 'Дисплей iPhone 11 OLED', 'Чорний'],
    ]
    expect(guessHeaderRow(grid, KEYS)).toBe(1)
  })

  it('falls back to row 1 for an empty or numbers-only sheet', () => {
    expect(guessHeaderRow([], KEYS)).toBe(1)
    expect(guessHeaderRow([['1', '2,5']], KEYS)).toBe(1)
  })
})
