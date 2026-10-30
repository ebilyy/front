/**
 * The single door to the Schemka API.
 *
 * Every call funnels through `request`, so a failure always arrives as an
 * `ApiError` — never a raw `Response` or a rejected `fetch`. The backend
 * validates with Zod and answers a 400 with `message: [{ field, message }]`,
 * which is unpacked here into `fieldErrors` so a form can bind messages
 * straight onto the offending inputs.
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3008').replace(/\/+$/, '')

/** One `{ field, message }` entry from the backend's Zod validation pipe. */
interface ValidationIssue {
  field: string
  message: string
}

/** Nest's error envelope: `message` is a string, or the Zod issues on a 400. */
interface ErrorBody {
  statusCode?: number
  error?: string
  message?: string | ValidationIssue[]
}

export class ApiError extends Error {
  constructor(
    /** HTTP status, or `0` when the request never reached the server. */
    readonly status: number,
    message: string,
    /** Keyed by DTO field name. Empty for anything but a validation error. */
    readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message)
    this.name = 'ApiError'
  }

  get hasFieldErrors() {
    return Object.keys(this.fieldErrors).length > 0
  }
}

export type QueryParams = Record<string, string | number | boolean | undefined>

/** `window.location.origin` as the base lets `VITE_API_BASE_URL` also be a path like `/api`. */
function buildUrl(path: string, query?: QueryParams) {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin)

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }

  return url.toString()
}

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined

  const text = await response.text()
  if (!text) return undefined

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function toApiError(status: number, body: unknown): ApiError {
  const { message, error } = (body ?? {}) as ErrorBody

  if (Array.isArray(message)) {
    const fieldErrors: Record<string, string> = {}
    // One message per field — that is all an input can show anyway, and the
    // first issue is the one the user has to fix first.
    for (const issue of message) {
      if (!(issue.field in fieldErrors)) fieldErrors[issue.field] = issue.message
    }
    return new ApiError(status, 'Перевірте заповнені поля', fieldErrors)
  }

  return new ApiError(status, message || error || `Помилка запиту (${status})`)
}

async function request<T>(
  path: string,
  {
    query,
    body,
    ...init
  }: Omit<RequestInit, 'body'> & { query?: QueryParams; body?: unknown } = {},
): Promise<T> {
  let response: Response

  // FormData goes out as is: the browser writes the multipart Content-Type
  // itself, boundary included, and a hand-set header would lose that boundary.
  const isJson = body !== undefined && !(body instanceof FormData)

  try {
    response = await fetch(buildUrl(path, query), {
      ...init,
      headers: isJson ? { 'Content-Type': 'application/json', ...init.headers } : init.headers,
      body: isJson ? JSON.stringify(body) : (body as FormData | undefined),
    })
  } catch {
    // fetch only rejects when the request never got an answer — DNS, CORS,
    // connection refused. Anything the server said lands in the branch below.
    throw new ApiError(0, 'Немає зв’язку з сервером. Перевірте, чи запущено API.')
  }

  const payload = await readBody(response)

  if (!response.ok) throw toApiError(response.status, payload)

  return payload as T
}

export const http = {
  get: <T>(path: string, query?: QueryParams) => request<T>(path, { method: 'GET', query }),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
