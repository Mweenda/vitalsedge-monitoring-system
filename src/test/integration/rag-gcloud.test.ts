import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { queryMedicalRAG } from '../../utils/medicalRAG';

// Mock the global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Medical RAG GCloud Integration (Storage-backed)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful backend response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        response: 'Based on the medical corpus in GCloud Storage, the patient has a history of hypertension.',
        sources: [
          { id: '1', title: 'Clinical Note.pdf', excerpt: 'BP 140/90', date: '2026-03-30' }
        ],
        confidence: 0.95,
        timestamp: new Date().toISOString()
      })
    });
  });

  it('should call the backend proxy and return cloud RAG response from storage', async () => {
    const result = await queryMedicalRAG({
      query: 'Hypertension history?',
      userRole: 'clinician',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/medical-rag/query'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Hypertension history?')
      })
    );
    expect(result.response).toContain('GCloud Storage');
    expect(result.sources[0].title).toBe('Clinical Note.pdf');
  });

  it('uses VITE_RAG_QUERY_PATH and normalizes docs-style { answer, sources }', async () => {
    vi.stubEnv('VITE_RAG_QUERY_PATH', '/api/rag/query');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        answer: 'Docs API answer',
        sources: [{ fileName: 'labs.pdf', excerpt: 'WBC normal' }],
      }),
    });

    const result = await queryMedicalRAG({
      query: 'Any findings?',
      userRole: 'clinician',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/rag/query'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Any findings?'),
      }),
    );
    expect(result.response).toBe('Docs API answer');
    expect(result.sources[0].title).toBe('labs.pdf');
    expect(result.sources[0].excerpt).toBe('WBC normal');
  });

  it('should throw error if backend proxy fails', async () => {
    // Mock backend failure
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Vertex AI Search failed' })
    });

    await expect(
      queryMedicalRAG({ query: 'Failed query', userRole: 'patient' }),
    ).rejects.toThrow('GCloud RAG proxy failed');
  });
});
