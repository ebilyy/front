import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'

import { parseWorkbookPreview } from '@/core/xlsx'

function workbookBytes(
  sheets: Record<string, XLSX.WorkSheet>,
  bookType: XLSX.BookType = 'xlsx',
): ArrayBuffer {
  const workbook = XLSX.utils.book_new()
  for (const [name, sheet] of Object.entries(sheets)) {
    XLSX.utils.book_append_sheet(workbook, sheet, name)
  }
  return XLSX.write(workbook, { type: 'array', bookType }) as ArrayBuffer
}

/** The afm-v1 layout: a title merged over B2:D2, headers in row 4 from column B. */
function afmSheet() {
  const sheet: XLSX.WorkSheet = {}
  XLSX.utils.sheet_add_aoa(sheet, [['Прайс AFM']], { origin: 'B2' })
  XLSX.utils.sheet_add_aoa(
    sheet,
    [
      ['Код', 'Найменування', 'Ціна (usd)'],
      ['A-1', 'Дисплей', 12.5],
      ['A-2', 'Акумулятор', 3],
    ],
    { origin: 'B4' },
  )
  // What a writer that skips empty leading rows and columns puts in the file.
  sheet['!ref'] = 'B2:D6'
  sheet['!merges'] = [XLSX.utils.decode_range('B2:D2')]
  sheet['D5']!.z = '0.00'
  return sheet
}

describe('parseWorkbookPreview', () => {
  it('lays the grid out from A1 even when the used range starts at B2', async () => {
    const [preview] = await parseWorkbookPreview(workbookBytes({ Sheet1: afmSheet() }))

    expect(preview!.name).toBe('Sheet1')
    expect(preview!.grid[3]).toEqual(['', 'Код', 'Найменування', 'Ціна (usd)'])
    expect(preview!.grid[0]).toEqual(['', '', '', ''])
    expect(preview!.totalColumns).toBe(4)
  })

  it('keeps the text Excel displays, not the raw number', async () => {
    const [preview] = await parseWorkbookPreview(workbookBytes({ Sheet1: afmSheet() }))
    expect(preview!.grid[4]![3]).toBe('12.50')
  })

  it('keeps merged ranges in sheet coordinates', async () => {
    const [preview] = await parseWorkbookPreview(workbookBytes({ Sheet1: afmSheet() }))
    expect(preview!.merges).toEqual([{ s: { r: 1, c: 1 }, e: { r: 1, c: 3 } }])
  })

  it('ignores a used range the writer stretched far beyond the data', async () => {
    const sheet = afmSheet()
    sheet['!ref'] = 'A1:XFD300'

    const [preview] = await parseWorkbookPreview(workbookBytes({ Sheet1: sheet }))
    expect(preview!.grid).toHaveLength(6)
    expect(preview!.grid[0]).toHaveLength(4)
  })

  it('stops at the row limit but reports the full height', async () => {
    const rows = Array.from({ length: 50 }, (_, index) => [`row ${index + 1}`])
    const sheet = XLSX.utils.aoa_to_sheet(rows)

    const [preview] = await parseWorkbookPreview(workbookBytes({ Sheet1: sheet }), 10)
    expect(preview!.grid).toHaveLength(10)
    expect(preview!.grid[9]).toEqual(['row 10'])
    expect(preview!.totalRows).toBe(50)
  })

  it('reads legacy .xls and every sheet in workbook order', async () => {
    const previews = await parseWorkbookPreview(
      workbookBytes({ Ціни: afmSheet(), Порожній: XLSX.utils.aoa_to_sheet([]) }, 'biff8'),
    )

    expect(previews.map((preview) => preview.name)).toEqual(['Ціни', 'Порожній'])
    expect(previews[0]!.grid[3]![2]).toBe('Найменування')
    expect(previews[1]!.grid).toEqual([])
  })
})
