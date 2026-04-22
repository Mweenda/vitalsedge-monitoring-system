import type express from 'express';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Storage } from '@google-cloud/storage';
import {
  normalizeMedicalRagRequestBody,
  toDocsRagResponse,
  type MedicalRagLegacyResult,
} from './medicalRagShared';

const VERTEX_AI_API_KEY = process.env.VERTEX_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const GCS_BUCKET_NAME = process.env.GCS_CORPUS_BUCKET || 'medical-corpus';
const GCS_FILE_NAME = process.env.GCS_CORPUS_FILE || 'corpora.csv';
const USE_GCS = process.env.USE_GCS_BUCKET === 'true';

const LOCAL_CORPORA_PATH = path.join(process.cwd(), 'docs', 'corpora.csv');

interface CorpusEntry {
  Dataset_Name: string;
  Category: string;
  Description: string;
  Primary_Format: string;
  Access_URL: string;
  License_Type: string;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}

async function loadCorpusFromGCS(): Promise<CorpusEntry[]> {
  try {
    const storage = new Storage();
    const bucket = storage.bucket(GCS_BUCKET_NAME);
    const file = bucket.file(GCS_FILE_NAME);
    
    const [contents] = await file.download();
    const content = contents.toString('utf-8');
    const lines = content.trim().split('\n');
    const headers = parseCsvLine(lines[0]);
    
    console.log(`[Corpus] Loaded ${lines.length - 1} entries from GCS bucket: ${GCS_BUCKET_NAME}`);
    
    return lines.slice(1).map(line => {
      const values = parseCsvLine(line);
      return Object.fromEntries(headers.map((h, i) => [h, values[i] || ''])) as unknown as CorpusEntry;
    });
  } catch (err) {
    console.error('[Corpus] Failed to load from GCS, falling back to local:', err);
    return loadCorpusFromLocal();
  }
}

function loadCorpusFromLocal(): CorpusEntry[] {
  try {
    const content = fs.readFileSync(LOCAL_CORPORA_PATH, 'utf-8');
    const lines = content.trim().split('\n');
    const headers = parseCsvLine(lines[0]);
    
    console.log(`[Corpus] Loaded ${lines.length - 1} entries from local file: ${LOCAL_CORPORA_PATH}`);
    
    return lines.slice(1).map(line => {
      const values = parseCsvLine(line);
      return Object.fromEntries(headers.map((h, i) => [h, values[i] || ''])) as unknown as CorpusEntry;
    });
  } catch (err) {
    console.error('[Corpus] Failed to load local corpus:', err);
    return [];
  }
}

async function loadCorpusData(): Promise<CorpusEntry[]> {
  if (USE_GCS) {
    return await loadCorpusFromGCS();
  }
  return loadCorpusFromLocal();
}

async function searchCorpus(query: string): Promise<MedicalRagLegacyResult> {
  const corpus = await loadCorpusData();
  const q = query.toLowerCase();

  const keywords = q.split(/\s+/).filter(k => k.length > 2);
  
  const scored = corpus.map(entry => {
    let score = 0;
    const entryText = `${entry.Dataset_Name} ${entry.Category} ${entry.Description}`.toLowerCase();
    
    if (entryText.includes(q)) score += 10;
    keywords.forEach(k => {
      if (entryText.includes(k)) score += 3;
    });
    if (entry.Category.toLowerCase().includes(q)) score += 5;
    if (entry.Dataset_Name.toLowerCase().includes(q)) score += 5;
    
    return { entry, score };
  }).filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const results = scored.slice(0, 3).map(s => s.entry);

  let responseText = '';
  if (results.length === 0) {
    responseText = `I couldn't find specific information about "${query}" in my knowledge base. Here are some topics I can help with:\n\n` +
      corpus.slice(0, 8).map(r => `• ${r.Dataset_Name}`).join('\n') +
      `\n\nWould you like me to elaborate on any of these topics? For medical concerns, please consult your healthcare provider.`;
  } else {
    responseText = results.map(r => {
      return `**${r.Dataset_Name}**\n\n${r.Description}\n\n${r.Category === 'Clinical Reference' ? '' : `Source: ${r.Access_URL}`}`;
    }).join('\n\n---\n\n');
    
    if (results.length > 1) {
      responseText += `\n\n---\n\n**Summary:** Based on your question about "${query}", the information above covers the key points. `;
    }
    responseText += `Always consult with a healthcare professional for personalized medical advice.`;
  }

  return {
    response: responseText,
    sources: results.map((r, i) => ({
      id: `corpus-${i}`,
      type: r.Category,
      title: r.Dataset_Name,
      excerpt: r.Description.substring(0, 150) + (r.Description.length > 150 ? '...' : ''),
      date: r.License_Type,
    })),
    confidence: results.length > 0 ? 0.85 : 0.2,
    timestamp: new Date().toISOString(),
  };
}

async function executeLocalRagQuery(input: {
  query: string;
  patientId?: string;
  userRole: string;
}): Promise<MedicalRagLegacyResult> {
  const { query } = input;
  const result = await searchCorpus(query);
  return result;
}

async function executeAiRagQuery(input: {
  query: string;
  patientId?: string;
  userRole: string;
}): Promise<MedicalRagLegacyResult> {
  const { query, userRole, patientId } = input;

  const corpus = await loadCorpusData();
  
  if (!VERTEX_AI_API_KEY) {
    return createHumanFriendlyResponse(query, corpus, userRole, 'API key not configured', patientId);
  }

  // 1. Intelligent Context Gathering
  const q = query.toLowerCase();
  const keywords = q.split(/\s+/).filter(k => k.length > 2);
  const scored = corpus.map(entry => {
    let score = 0;
    const entryText = `${entry.Dataset_Name} ${entry.Category} ${entry.Description}`.toLowerCase();
    if (entryText.includes(q)) score += 15;
    keywords.forEach(k => { if (entryText.includes(k)) score += 5; });
    return { entry, score };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);

  const relevantSources = scored.slice(0, 5).map(s => s.entry);
  const corpusContext = relevantSources.map(entry => 
    `Source: ${entry.Dataset_Name}\nCategory: ${entry.Category}\nContent: ${entry.Description}`
  ).join('\n\n');

  // 2. Fetch/Mock Patient Data
  let patientContext = '';
  if (patientId) {
    const mockVitals = {
      heartRate: 72,
      spo2: 98,
      temperature: 36.6,
      systolicBP: 120,
      diastolicBP: 80,
      glucose: 105,
      lastUpdated: new Date().toISOString()
    };
    patientContext = JSON.stringify(mockVitals, null, 2);
  }

  // 3. Highly Structured "Intelligence" Prompt
  const prompt = `
SYSTEM ROLE:
You are the VitalsEdge Medical Intelligence Engine. Your goal is to provide high-precision medical information and patient data analysis.

USER CONTEXT:
- Role: ${userRole}
- Patient ID: ${patientId || 'N/A'}

AVAILABLE DATA:
[PATIENT_VITALS]
${patientContext || 'No patient-specific data available for this query.'}

[KNOWLEDGE_BASE_EXTRACTS]
${corpusContext || 'No specific medical references found in local corpus.'}

USER QUERY:
"${query}"

INSTRUCTIONS FOR LOGIC & REASONING:
1. **Intent Analysis**: Determine if the user is asking for general facts, specific patient assessment, or troubleshooting.
2. **Clinical Correlation**: If patient vitals are present, compare them against the "Vital Signs Reference" or other relevant docs in the knowledge base.
3. **Reasoning Step**: 
   - If ${userRole} === 'clinician', use clinical terminology and provide an 'Assessment' and 'Plan/Recommendation'.
   - If ${userRole} === 'patient', use accessible language, explain "why" things matter, and prioritize safety.
4. **Safety Filter**: If vitals are outside normal ranges (per knowledge base), highlight this immediately as an "ALARM" or "CAUTION".

OUTPUT STRUCTURE:
- **Summary**: A 1-sentence overview of the situation.
- **Detailed Analysis**: The core answer, integrating patient data and knowledge base facts.
- **Reference Citations**: List which datasets/docs provided the information.
- **Medical Disclaimer**: Standard warning.

RESPONSE:`;

  try {
    const genAI = new GoogleGenerativeAI(VERTEX_AI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.2, // Lower temperature for more consistent medical logic
        topP: 0.8,
        maxOutputTokens: 1024,
      }
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return {
      response: responseText,
      sources: relevantSources.map((r, i) => ({
        id: `corpus-${i}`,
        type: r.Category,
        title: r.Dataset_Name,
        excerpt: r.Description,
        date: r.License_Type,
      })),
      confidence: relevantSources.length > 0 ? 0.95 : 0.75,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('AI Logic failed, falling back:', error);
    return createHumanFriendlyResponse(query, corpus, userRole, error instanceof Error ? error.message : 'AI Logic Error', patientId);
  }
}

function createHumanFriendlyResponse(
  query: string, 
  corpus: CorpusEntry[], 
  userRole: string,
  errorMessage?: string,
  patientId?: string
): MedicalRagLegacyResult {
  const q = query.toLowerCase();
  const keywords = q.split(/\s+/).filter(k => k.length > 2);
  
  const scored = corpus.map(entry => {
    let score = 0;
    const entryText = `${entry.Dataset_Name} ${entry.Category} ${entry.Description}`.toLowerCase();
    
    if (entryText.includes(q)) score += 15;
    keywords.forEach(k => {
      if (entryText.includes(k)) score += 5;
    });
    if (entry.Category.toLowerCase().includes(q)) score += 8;
    if (entry.Dataset_Name.toLowerCase().includes(q)) score += 8;
    
    return { entry, score };
  }).filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const results = scored.slice(0, 4).map(s => s.entry);
  
  let responseText = '';
  
  if (errorMessage) {
    responseText = `> **Note:** I'm currently using my **offline medical knowledge base** to answer your question.\n\n`;
  }

  // Add patient context if available
  if (patientId) {
    const mockVitals = {
      heartRate: 72,
      spo2: 98,
      temperature: 36.6,
      bp: '120/80',
      lastUpdated: 'Just now'
    };
    responseText += `### 👤 Patient Context (ID: ${patientId})\n`;
    responseText += `- **Heart Rate:** ${mockVitals.heartRate} bpm\n`;
    responseText += `- **SpO2:** ${mockVitals.spo2}%\n`;
    responseText += `- **Blood Pressure:** ${mockVitals.bp} mmHg\n`;
    responseText += `- **Temperature:** ${mockVitals.temperature}°C\n\n---\n\n`;
  }
  
  if (results.length === 0) {
    responseText += `I don't have specific information about "${query}" in my knowledge base. Here's what I can help with:\n\n` +
      corpus.slice(0, 10).map(r => `• **${r.Dataset_Name}**: ${r.Category}`).join('\n') +
      `\n\n**You can ask me about:**\n` +
      `- Vital signs and normal ranges\n` +
      `- Blood pressure, heart rate, oxygen levels\n` +
      `- Common conditions like diabetes, hypertension\n` +
      `- Medications and their effects\n` +
      `- Emergency signs to watch for\n\n` +
      `*For specific medical advice, please consult your healthcare provider.*`;
  } else {
    const prefix = userRole === 'clinician' || userRole === 'doctor' 
      ? `### 🩺 Clinical Information\nBased on your question about "**${query}**":\n\n`
      : `### ℹ️ Health Information\nHere's helpful information about "**${query}**":\n\n`;
    
    responseText += prefix;
    
    responseText += results.map(r => {
      return `#### 📋 ${r.Dataset_Name}\n${r.Description}\n`;
    }).join('\n\n');
    
    responseText += `\n\n---\n\n`;
    
    responseText += `**Medical Disclaimer:** This information is for educational purposes only. Always consult with a qualified healthcare professional for personalized medical advice, diagnosis, or treatment.`;
  }

  return {
    response: responseText,
    sources: results.map((r, i) => ({
      id: `corpus-${i}`,
      type: r.Category,
      title: r.Dataset_Name,
      excerpt: r.Description.substring(0, 120) + (r.Description.length > 120 ? '...' : ''),
      date: r.License_Type,
    })),
    confidence: results.length > 0 ? 0.8 : 0.15,
    timestamp: new Date().toISOString(),
  };
}

export function registerMedicalRagRoutes(app: express.Express) {
  const handleLocalRag = async (req: express.Request, res: express.Response) => {
    const normalized = normalizeMedicalRagRequestBody(req.body ?? {});

    if (!normalized.query) {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    try {
      const result = await executeLocalRagQuery({
        query: normalized.query,
        patientId: normalized.patientId,
        userRole: normalized.userRole,
      });
      res.json(result);
    } catch (error) {
      console.error('Local RAG Error:', error);
      res.status(500).json({
        error: 'Failed to query local corpus',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleAiRag = async (req: express.Request, res: express.Response) => {
    const normalized = normalizeMedicalRagRequestBody(req.body ?? {});

    if (!normalized.query) {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    try {
      const result = await executeAiRagQuery({
        query: normalized.query,
        patientId: normalized.patientId,
        userRole: normalized.userRole,
      });
      res.json(result);
    } catch (error) {
      console.error('AI RAG Error, returning fallback:', error);
      const corpus = await loadCorpusData();
      const fallback = createHumanFriendlyResponse(
        normalized.query,
        corpus,
        normalized.userRole,
        error instanceof Error ? error.message : 'Unknown error',
        normalized.patientId
      );
      res.json(fallback);
    }
  };

  app.post('/api/local-rag/query', handleLocalRag);
  app.post('/api/ai-rag/query', handleAiRag);
  app.post('/api/medical-rag/query', handleAiRag);
  app.post('/api/rag/query', handleAiRag);
}
