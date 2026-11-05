/** Public surface of the API layer: one import site for clients and their types. */
export { ApiError, http } from './http'
export type { QueryParams } from './http'

export { MAX_PAGE_LIMIT } from './types'
export type { Paginated, PaginationMeta, PaginationQuery } from './types'

export { suppliersApi } from './suppliers'
export type { CreateSupplierDto, Supplier, UpdateSupplierDto } from './suppliers'

export { importFieldsApi, supplierConfigsApi } from './supplier-configs'
export type {
  ImportField,
  ImportFieldKey,
  SupplierConfig,
  SupplierConfigColumn,
  SupplierConfigCurrency,
} from './supplier-configs'

export {
  filesApi,
  FILES_FIELD,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  MAX_FILES_PER_REQUEST,
} from './files'
export type { FileUpload } from './files'
