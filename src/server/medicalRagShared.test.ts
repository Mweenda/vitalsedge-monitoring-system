import { describe, it, expect } from 'vitest';
import {
  normalizeMedicalRagRequestBody,
  toDocsRagResponse,
} from './medicalRagShared';

describe('medicalRagShared', () => {
  it('maps doctor to clinician', () => {
    const n = normalizeMedicalRagRequestBody({
      query: 'hello',
      userRole: 'doctor',
    });
    expect(n.userRole).toBe('clinician');
    expect(n.query).toBe('hello');
  });

  it('preserves patient and admin', () => {
    expect(
      normalizeMedicalRagRequestBody({ query: 'q', userRole: 'patient' }).userRole,
    ).toBe('patient');
    expect(
      normalizeMedicalRagRequestBody({ query: 'q', userRole: 'admin' }).userRole,
    ).toBe('admin');
  });

  it('converts legacy result to docs API shape', () => {
    const docs = toDocsRagResponse({
      response: 'Answer text',
      sources: [
        {
          id: '1',
          type: 'doc',
          title: 'note.pdf',
          excerpt: 'snippet',
          date: '2026-01-01',
        },
      ],
      confidence: 0.9,
      timestamp: '2026-01-01T00:00:00Z',
    });
    expect(docs.answer).toBe('Answer text');
    expect(docs.sources[0]).toEqual({ fileName: 'note.pdf', excerpt: 'snippet' });
  });
});
