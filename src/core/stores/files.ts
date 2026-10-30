import { ref } from 'vue'
import { defineStore } from 'pinia'

import { ApiError, filesApi } from '@/core/api'
import type { FileUpload } from '@/core/api'

/** Mirrors `DEFAULT_LIMIT` on the backend, so the first page needs no extra query. */
const DEFAULT_LIMIT = 25

/**
 * Server-side list state for the uploaded files table.
 *
 * Same split as the suppliers store: a list failure lands in `error`, while
 * `upload` lets the `ApiError` through so the dialog can show it on the field.
 */
export const useFilesStore = defineStore('files', () => {
  const items = ref<FileUpload[]>([])
  const total = ref(0)
  const page = ref(1)
  const limit = ref(DEFAULT_LIMIT)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const { items: rows, meta } = await filesApi.list({ page: page.value, limit: limit.value })
      items.value = rows
      total.value = meta.totalItems
    } catch (err) {
      items.value = []
      total.value = 0
      error.value = err instanceof ApiError ? err.message : 'Не вдалося завантажити список файлів'
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

  async function upload(files: File[]) {
    const uploaded = await filesApi.upload(files)
    // The list is newest first, so the fresh batch is on page one — wherever
    // the user had paged to, that is where they expect to see it.
    page.value = 1
    await fetchAll()
    return uploaded
  }

  return { items, total, page, limit, loading, error, fetchAll, goToPage, setLimit, upload }
})
