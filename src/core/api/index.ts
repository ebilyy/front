/** Public surface of the API layer: one import site for clients and their types. */
export { ApiError, http } from './http'
export type { QueryParams } from './http'

export { MAX_PAGE_LIMIT } from './types'
export type { Paginated, PaginationMeta, PaginationQuery } from './types'

export { suppliersApi } from './suppliers'
export type { CreateSupplierDto, Supplier, UpdateSupplierDto } from './suppliers'
