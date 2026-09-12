/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MICROSOFT_CLIENT_ID: string;
  readonly VITE_API_URL: string;
  /** `1` = force guest; `0` = allow stored tokens in dev; unset = guest in dev, normal in prod. */
  readonly VITE_FORCE_GUEST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
