import { http } from './http'
import type { Paginated, PaginationQuery } from './types'

/** Mirrors `files.constants.ts` on the backend, which enforces the same limits. */
export const FILES_FIELD = 'files'
export const MAX_FILE_SIZE_MB = 10
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
export const MAX_FILES_PER_REQUEST = 10

/**
 * A row of the `file_uploads` table. The storage key and the content hash
 * never leave the API — both are `select: false` on the backend entity.
 */
export interface FileUpload {
  id: number
  originalName: string
  /** Lowercased, latin letters and digits only; `null` when the name had none. */
  extension: string | null
  /** As the browser reported it on upload — not sniffed from the content. */
  mimeType: string
  sizeBytes: number
  /** ISO timestamps — the API sends strings, not `Date`. */
  createdAt: string
  updatedAt: string
  /** Nothing deletes uploads yet, so a listed file always has `null` here. */
  deletedAt: string | null
}

export const filesApi = {
  /** Newest first. */
  list: (query: PaginationQuery = {}) => http.get<Paginated<FileUpload>>('/files', { ...query }),
  /**
   * One request for the whole batch, and the backend keeps it all-or-nothing:
   * on any failure no file of the batch is stored.
   */
  upload: (files: File[]) => {
    const form = new FormData()
    for (const file of files) form.append(FILES_FIELD, file)
    return http.post<FileUpload[]>('/files', form)
  },
}
