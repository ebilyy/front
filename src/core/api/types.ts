/** Shapes shared by every collection endpoint — see `common/pagination` on the backend. */

export interface PaginationMeta {
  totalItems: number
  itemCount: number
  itemsPerPage: number
  totalPages: number
  currentPage: number
}

export interface Paginated<T> {
  items: T[]
  meta: PaginationMeta
}

export interface PaginationQuery {
  page?: number
  /** The backend caps this at `MAX_LIMIT = 100`; anything larger is a 400. */
  limit?: number
}

export const MAX_PAGE_LIMIT = 100
