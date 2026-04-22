/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_COMPLIANCE_LABELS?: string;
  readonly VITE_GEMINI_API_KEY?: string;
  /** Override RAG POST path (default `/api/medical-rag/query`). Use `/api/rag/query` for docs-style proxy. */
  readonly VITE_RAG_QUERY_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}
