import { http } from './http'

/** Keys of the backend's closed import-field registry (`import-fields.ts`). */
export type ImportFieldKey =
  | 'code'
  | 'name'
  | 'price'
  | 'retailPrice'
  | 'availability'
  | 'quantity'
  | 'barcode'
  | 'brand'
  | 'category'
  | 'description'
  | 'imageUrl'

/** One field a file column can be mapped to. The registry order is the display order. */
export interface ImportField {
  key: ImportFieldKey
  label: string
  /** A config without this field cannot be used for an import. */
  required: boolean
  description: string
}

export type SupplierConfigCurrency = 'UAH' | 'USD'

/** One "file column → import field" pair from the config's `columns` jsonb. */
export interface SupplierConfigColumn {
  field: ImportFieldKey
  /** Column letter in the sheet, e.g. `D`. */
  column: string
  /** Header cell text at the time of mapping; `null` when the column had no header. */
  headerText: string | null
}

/** A row of the `supplier_configs` table: how to read one supplier's price file. */
export interface SupplierConfig {
  id: number
  supplierId: number
  name: string
  /** `null` means the workbook's first sheet. */
  sheetName: string | null
  /** 1-based; data rows start right below it. */
  headerRow: number
  currency: SupplierConfigCurrency
  columns: SupplierConfigColumn[]
  /** ISO timestamps — the API sends strings, not `Date`. */
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export const supplierConfigsApi = {
  /** Ordered by id. Not paginated: a supplier has a handful of configs at most. */
  list: (supplierId: number) => http.get<SupplierConfig[]>(`/suppliers/${supplierId}/configs`),
  get: (supplierId: number, id: number) =>
    http.get<SupplierConfig>(`/suppliers/${supplierId}/configs/${id}`),
}

export const importFieldsApi = {
  list: () => http.get<ImportField[]>('/import-fields'),
}
