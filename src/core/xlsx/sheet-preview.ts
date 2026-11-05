import type { Range, WorkSheet } from 'xlsx'

type Xlsx = typeof import('xlsx')

/**
 * Rows parsed per sheet. Headers sit as low as row 12 in the price lists we
 * have, so this leaves room for a long preamble and a screenful of data.
 */
export const PREVIEW_ROW_LIMIT = 200

/**
 * Columns kept per sheet. Price lists are 5–30 columns wide; the cap only
 * guards against a stray value far to the right rendering thousands of cells.
 */
export const PREVIEW_COLUMN_LIMIT = 100

/** The first rows of one sheet, laid out exactly as Excel numbers them. */
export interface SheetPreview {
  name: string
  /**
   * `grid[r][c]` is the cell in row `r + 1`, column `c` (0 is `A`): the text
   * Excel displays, `''` for a blank cell. Every row has the same length.
   */
  grid: string[][]
  /** Rows the sheet declares, beyond the ones parsed; may count formatted blanks. */
  totalRows: number
  /** Columns from `A` to the last one holding a value; may exceed what `grid` carries. */
  totalColumns: number
  /** Merged ranges that start inside `grid`, clipped to it. */
  merges: Range[]
}

/**
 * Reads the first rows of every sheet in an .xls/.xlsx file, in the browser.
 *
 * SheetJS is imported on demand: it is several hundred KB and only the config
 * dialog needs it.
 */
export async function readWorkbookPreview(file: Blob): Promise<SheetPreview[]> {
  return parseWorkbookPreview(await file.arrayBuffer())
}

export async function parseWorkbookPreview(
  data: ArrayBuffer,
  rowLimit = PREVIEW_ROW_LIMIT,
  columnLimit = PREVIEW_COLUMN_LIMIT,
): Promise<SheetPreview[]> {
  const XLSX = await import('xlsx')
  // `sheetRows` stops each sheet after `rowLimit` rows instead of reading all
  // 20k of them for a preview.
  const workbook = XLSX.read(data, { type: 'array', sheetRows: rowLimit })

  return workbook.SheetNames.map((name) =>
    toPreview(XLSX, name, workbook.Sheets[name], columnLimit),
  )
}

function toPreview(
  XLSX: Xlsx,
  name: string,
  sheet: WorkSheet | undefined,
  columnLimit: number,
): SheetPreview {
  const preview: SheetPreview = { name, grid: [], totalRows: 0, totalColumns: 0, merges: [] }
  if (!sheet?.['!ref']) return preview

  // `sheetRows` cuts `!ref` down to the parsed rows; `!fullref` keeps the original.
  preview.totalRows = XLSX.utils.decode_range(sheet['!fullref'] ?? sheet['!ref']).e.r + 1

  // `!ref` is what the writer claimed, not what is filled: it may start at C3,
  // and a cell formatted once in column XFD stretches it 16k columns wide. The
  // bounds come from the cells themselves; SheetJS only keeps cells with a value.
  let lastRow = -1
  let lastColumn = -1
  for (const address of Object.keys(sheet)) {
    if (address.startsWith('!')) continue
    const { r, c } = XLSX.utils.decode_cell(address)
    if (r > lastRow) lastRow = r
    if (c > lastColumn) lastColumn = c
  }
  if (lastRow < 0) return preview

  preview.totalColumns = lastColumn + 1
  const width = Math.min(preview.totalColumns, columnLimit)

  // Starting at A1 keeps array indices equal to Excel's row and column numbers.
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    range: { s: { r: 0, c: 0 }, e: { r: lastRow, c: width - 1 } },
    // The formatted text (`w`): what the operator sees in Excel, and so what a
    // header is matched against — `12.50`, not `12.5`.
    raw: false,
    defval: '',
    // Without this blank rows are dropped and every row below shifts up.
    blankrows: true,
  })
  preview.grid = rows.map((row) =>
    Array.from({ length: width }, (_, column) => String(row[column] ?? '')),
  )

  preview.merges = (sheet['!merges'] ?? [])
    .filter((merge) => merge.s.r <= lastRow && merge.s.c < width)
    .map((merge) => ({
      s: { ...merge.s },
      e: { r: Math.min(merge.e.r, lastRow), c: Math.min(merge.e.c, width - 1) },
    }))

  return preview
}
