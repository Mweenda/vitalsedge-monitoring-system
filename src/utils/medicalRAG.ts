/**
 * Medical RAG (Retrieval-Augmented Generation) Service
 * Fast local corpus queries for chatbot, AI-enhanced responses for full assistant
 */

import {
  getRagQueryPath,
  mapRagUserRoleForBackend,
  normalizeRagResponseFromApi,
} from './medicalRagApi';

export interface RAGQuery {
  query: string;
  patientId?: string;
  userRole: 'clinician' | 'patient' | 'admin' | 'doctor';
  context?: string;
}

export interface RAGResponse {
  response: string;
  sources: Array<{
    id: string;
    type: string;
    title: string;
    excerpt: string;
    date: string;
  }>;
  confidence: number;
  timestamp: string;
}

function getApiUrl(): string {
  const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
  return configuredApiUrl || 'https://vitalsedge-medical-rag-6grvus5iua-uc.a.run.app';
}

export async function queryLocalRAG(ragQuery: RAGQuery): Promise<RAGResponse> {
  const backendUrl = getApiUrl();
  const path = '/api/local-rag/query';

  // In production (no backend), return a fallback response
  if (!backendUrl) {
    return {
      response: `I understand you're asking about "${ragQuery.query}". For detailed medical information, please consult your healthcare provider or use the local development server.\n\nTo enable AI responses, please deploy the backend server.`,
      sources: [],
      confidence: 0.1,
      timestamp: new Date().toISOString(),
    };
  }

  const response = await fetch(`${backendUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: ragQuery.query,
      patientId: ragQuery.patientId,
      userRole: mapRagUserRoleForBackend(ragQuery.userRole),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.details || errorData.error || response.statusText;
    throw new Error(`Local RAG failed: ${errorMessage}`);
  }

  const raw = await response.json();
  return normalizeRagResponseFromApi(raw);
}

export async function queryMedicalRAG(ragQuery: RAGQuery): Promise<RAGResponse> {
  try {
    return await queryAiRAG(ragQuery);
  } catch (error) {
    console.warn('AI RAG failed, falling back to local corpus:', error);
    return await queryLocalRAG(ragQuery);
  }
}

async function queryAiRAG(ragQuery: RAGQuery): Promise<RAGResponse> {
  const backendUrl = getApiUrl();
  const path = '/api/ai-rag/query';

  const response = await fetch(`${backendUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: ragQuery.query,
      patientId: ragQuery.patientId,
      userRole: mapRagUserRoleForBackend(ragQuery.userRole),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.details || errorData.error || response.statusText;
    throw new Error(`AI RAG failed: ${errorMessage}`);
  }

  const raw = await response.json();
  return normalizeRagResponseFromApi(raw);
}
