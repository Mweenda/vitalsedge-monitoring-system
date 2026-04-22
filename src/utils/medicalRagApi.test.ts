import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  mapRagUserRoleForBackend,
  normalizeRagResponseFromApi,
  getRagQueryPath,
} from './medicalRagApi';

describe('medicalRagApi', () => {
  describe('mapRagUserRoleForBackend', () => {
    it('maps doctor to clinician', () => {
      expect(mapRagUserRoleForBackend('doctor')).toBe('clinician');
    });
    it('passes through clinician, patient, admin', () => {
      expect(mapRagUserRoleForBackend('clinician')).toBe('clinician');
      expect(mapRagUserRoleForBackend('patient')).toBe('patient');
      expect(mapRagUserRoleForBackend('admin')).toBe('admin');
    });
    it('defaults unknown roles to clinician', () => {
      expect(mapRagUserRoleForBackend('nurse')).toBe('clinician');
    });
  });

  describe('normalizeRagResponseFromApi', () => {
    it('normalizes legacy Vertex/medical-rag shape', () => {
      const out = normalizeRagResponseFromApi({
        response: 'Hello',
        sources: [
          {
            id: '1',
            type: 'note',
            title: 'Lab',
            excerpt: 'HbA1c 6.2',
            date: '2026-01-01',
          },
        ],
        confidence: 0.8,
        timestamp: '2026-01-02T00:00:00Z',
      });
      expect(out.response).toBe('Hello');
      expect(out.sources[0].title).toBe('Lab');
      expect(out.confidence).toBe(0.8);
    });

    it('normalizes docs-style answer + fileName sources', () => {
      const out = normalizeRagResponseFromApi({
        answer: 'Take metformin as prescribed.',
        sources: [{ fileName: 'meds.pdf', excerpt: 'Metformin 500mg BID' }],
      });
      expect(out.response).toBe('Take metformin as prescribed.');
      expect(out.sources[0].title).toBe('meds.pdf');
      expect(out.sources[0].excerpt).toBe('Metformin 500mg BID');
      expect(out.confidence).toBe(0.9);
    });
  });

  describe('getRagQueryPath', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_RAG_QUERY_PATH', '');
    });
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('defaults to medical-rag path', () => {
      expect(getRagQueryPath()).toBe('/api/medical-rag/query');
    });

    it('uses VITE_RAG_QUERY_PATH when set', () => {
      vi.stubEnv('VITE_RAG_QUERY_PATH', '/api/rag/query');
      expect(getRagQueryPath()).toBe('/api/rag/query');
    });

    it('prefixes slash when missing', () => {
      vi.stubEnv('VITE_RAG_QUERY_PATH', 'api/rag/query');
      expect(getRagQueryPath()).toBe('/api/rag/query');
    });
  });
});
