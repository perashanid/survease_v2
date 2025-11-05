/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_WS_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_PUBLIC_SURVEYS_PER_PAGE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}