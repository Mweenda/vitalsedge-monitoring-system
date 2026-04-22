/** Request body shape for POST /api/medical-rag/query and POST /api/rag/query */

export type MedicalRagUserRole = 'clinician' | 'patient' | 'admin';

export interface MedicalRagRequestBody {
  query: string;
  patientId?: string;
  userRole?: string;
}

export interface MedicalRagLegacyResult {
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

/** Accept docs-style `doctor` and map to `clinician` for Vertex preamble. */
export function normalizeMedicalRagRequestBody(
  body: MedicalRagRequestBody | null | undefined,
): { query: string; patientId?: string; userRole: MedicalRagUserRole } {
  const query = typeof body?.query === 'string' ? body.query.trim() : '';
  const patientId =
    typeof body?.patientId === 'string' && body.patientId.trim()
      ? body.patientId.trim()
      : undefined;
  const raw = typeof body?.userRole === 'string' ? body.userRole.toLowerCase() : '';
  let userRole: MedicalRagUserRole = 'clinician';
  if (raw === 'patient') userRole = 'patient';
  else if (raw === 'admin') userRole = 'admin';
  else if (raw === 'doctor' || raw === 'clinician') userRole = 'clinician';
  return { query, patientId, userRole };
}

/** Docs sample API: { answer, sources: [{ fileName, excerpt }] } */
export function toDocsRagResponse(legacy: MedicalRagLegacyResult): {
  answer: string;
  sources: Array<{ fileName: string; excerpt: string }>;
} {
  return {
    answer: legacy.response,
    sources: legacy.sources.map((s) => ({
      fileName: s.title,
      excerpt: s.excerpt,
    })),
  };
}
