import { http } from './http'
import type { Paginated, PaginationQuery } from './types'

/** A row of the `suppliers` table, exactly as the API serialises it. */
export interface Supplier {
  id: number
  name: string
  email: string
  description: string | null
  /** ISO timestamps — the API sends strings, not `Date`. */
  createdAt: string
  updatedAt: string
  /** Deletes are soft; a listed supplier always has `null` here. */
  deletedAt: string | null
}

export interface CreateSupplierDto {
  name: string
  /** Unique across the table, deleted rows included; the API lowercases it. */
  email: string
  description?: string | null
}

/** PATCH accepts any subset, but the backend rejects a body with no fields at all. */
export type UpdateSupplierDto = Partial<CreateSupplierDto>

export const suppliersApi = {
  list: (query: PaginationQuery = {}) => http.get<Paginated<Supplier>>('/suppliers', { ...query }),
  get: (id: number) => http.get<Supplier>(`/suppliers/${id}`),
  create: (dto: CreateSupplierDto) => http.post<Supplier>('/suppliers', dto),
  update: (id: number, dto: UpdateSupplierDto) => http.patch<Supplier>(`/suppliers/${id}`, dto),
  /** Soft delete — resolves with the row as it now stands, `deletedAt` set. */
  remove: (id: number) => http.delete<Supplier>(`/suppliers/${id}`),
}
