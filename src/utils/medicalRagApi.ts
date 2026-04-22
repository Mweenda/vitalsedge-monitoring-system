/**
 * Medical RAG HTTP contract helpers (docs: /api/rag/query, answer + fileName sources).
 */

import type { RAGResponse } from './medicalRAG';

export type RAGBackendUserRole = 'clinician' | 'patient' | 'admin';
export type RAGUserRoleInput = RAGBackendUserRole | 'doctor';

/** Map docs/API role aliases to the backend Vertex prompt roles. */
export function mapRagUserRoleForBackend(role: string): RAGBackendUserRole {
  const r = String(role).toLowerCase();
  if (r === 'doctor' || r === 'clinician') return 'clinician';
  if (r === 'patient') return 'patient';
  if (r === 'admin') return 'admin';
  return 'clinician';
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Normalize either legacy `{ response, sources[], confidence, timestamp }`
 * or docs-style `{ answer, sources: { fileName, excerpt }[] }`.
 */
export function normalizeRagResponseFromApi(raw: unknown): RAGResponse {
  if (!isRecord(raw)) {
    return {
      response: '',
      sources: [],
      confidence: 0,
      timestamp: new Date().toISOString(),
    };
  }

  const response =
    typeof raw.response === 'string'
      ? raw.response
      : typeof raw.answer === 'string'
        ? raw.answer
        : '';

  const rawSources = Array.isArray(raw.sources) ? raw.sources : [];
  const sources = rawSources.map((item: unknown, index: number) => {
    if (!isRecord(item)) {
      return {
        id: `source-${index}`,
        type: 'document',
        title: 'Source',
        excerpt: '',
        date: new Date().toISOString().split('T')[0],
      };
    }
    const title =
      typeof item.title === 'string'
        ? item.title
        : typeof item.fileName === 'string'
          ? item.fileName
          : 'Source';
    return {
      id: typeof item.id === 'string' ? item.id : `source-${index}`,
      type: typeof item.type === 'string' ? item.type : 'document',
      title,
      excerpt: typeof item.excerpt === 'string' ? item.excerpt : '',
      date:
        typeof item.date === 'string'
          ? item.date
          : new Date().toISOString().split('T')[0],
    };
  });

  return {
    response,
    sources,
    confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.9,
    timestamp:
      typeof raw.timestamp === 'string' ? raw.timestamp : new Date().toISOString(),
  };
}

export function getRagQueryPath(): string {
  const fromEnv = import.meta.env.VITE_RAG_QUERY_PATH?.trim();
  if (fromEnv) return fromEnv.startsWith('/') ? fromEnv : `/${fromEnv}`;
  return '/api/medical-rag/query';
}
