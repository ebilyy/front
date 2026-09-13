import { ref } from 'vue'
import { defineStore } from 'pinia'

import { ApiError, suppliersApi } from '@/core/api'
import type { CreateSupplierDto, Supplier, UpdateSupplierDto } from '@/core/api'

/** Mirrors `DEFAULT_LIMIT` on the backend, so the first page needs no extra query. */
const DEFAULT_LIMIT = 25

/**
 * Server-side list state for the suppliers table.
 *
 * `fetchAll` swallows its error into `error` — a list failure is a state of the
 * page, not of a caller. The mutations do the opposite and let the `ApiError`
 * through, because the form needs its `fieldErrors` to annotate the inputs.
 */
export const useSuppliersStore = defineStore('suppliers', () => {
  const items = ref<Supplier[]>([])
  const total = ref(0)
  const page = ref(1)
  const limit = ref(DEFAULT_LIMIT)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const { items: rows, meta } = await suppliersApi.list({
        page: page.value,
        limit: limit.value,
      })

      // Deleting the last row of the last page leaves us pointing past the end
      // of the list; step back instead of showing an empty table.
      if (rows.length === 0 && meta.currentPage > 1) {
        page.value = Math.max(meta.totalPages, 1)
        return await fetchAll()
      }

      items.value = rows
      total.value = meta.totalItems
    } catch (err) {
      items.value = []
      total.value = 0
      error.value =
        err instanceof ApiError ? err.message : 'Не вдалося завантажити список постачальників'
    } finally {
      loading.value = false
    }
  }

  async function goToPage(next: number) {
    if (next === page.value) return
    page.value = next
    await fetchAll()
  }

  async function setLimit(next: number) {
    if (next === limit.value) return
    limit.value = next
    page.value = 1
    await fetchAll()
  }

  async function create(dto: CreateSupplierDto) {
    const created = await suppliersApi.create(dto)
    await fetchAll()
    return created
  }

  async function update(id: number, dto: UpdateSupplierDto) {
    const updated = await suppliersApi.update(id, dto)
    await fetchAll()
    return updated
  }

  async function remove(id: number) {
    const removed = await suppliersApi.remove(id)
    await fetchAll()
    return removed
  }

  return {
    items,
    total,
    page,
    limit,
    loading,
    error,
    fetchAll,
    goToPage,
    setLimit,
    create,
    update,
    remove,
  }
})
