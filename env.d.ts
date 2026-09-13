/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origin of the Schemka API, without a trailing slash. */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
