/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PROD: boolean
  readonly DEV: boolean
  readonly MODE: string
  // 更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}