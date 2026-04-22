# Medical RAG Integration Guide

## Overview

VitalsEdge now includes an integrated **Medical RAG (Retrieval-Augmented Generation)** system that enables AI-powered querying of patient medical history. The system uses Google's Gemini API to provide role-based medical insights from historical patient data.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                       Dashboard UI                          │
│             MedicalRAGAssistant Component                    │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│            RAG Query Processing Layer                        │
│         (medicalRAG.ts Service Module)                       │
├─────────────────────────────────────────────────────────────┤
│ • Query Validation                                           │
│ • Context Building & Retrieval                               │
│ • Relevance Scoring                                          │
│ • Medical Text Simplification (Patient mode)                 │
└────┬──────────────────────────────────────────────────┬──────┘
     │                                                  │
     ▼                                                  ▼
┌──────────────────────────┐             ┌──────────────────────────┐
│  Firestore Medical       │             │   Gemini API             │
│  Records Collection      │             │   (Google AI)            │
│                          │             │                          │
│ • Diagnoses              │             │ • Embedding Generation   │
│ • Lab Results            │             │ • Response Generation    │
│ • Medications            │             │ • Context Awareness      │
│ • Clinical Notes         │             │ • Role-Based Prompting   │
└──────────────────────────┘             └──────────────────────────┘
```

### Data Flow

1. **User Query** → Dashboard input
2. **Retrieve Context** → Search Firestore for relevant medical records
3. **Score Relevance** → Rank by date recency and keyword match
4. **Build Prompt** → Format context based on user role
5. **Call Gemini** → Send prompt to AI for response generation
6. **Return Response** → Display answer with source citations
7. **Log Interaction** → Store for audit trail

## Features

### Role-Based Responses

#### Clinician Mode
- Full clinical terminology preserved
- Technical lab values and measurements
- Detailed clinical implications
- Recommendations for monitoring/evaluation
- Support for clinical decision-making

#### Patient Mode
- Simplified medical explanations
- Accessible language
- Emotional support tone
- Reassurance when appropriate
- Emphasis on when to contact healthcare provider

### Medical Record Types Supported

```typescript
type MedicalRecord = {
  type: 'diagnosis' | 'lab_result' | 'medication' | 'procedure' | 'clinical_note'
  title: string
  content: string
  date: string
  patientId: string
}
```

### Automatic Context Extraction

- **Relevance Scoring**: Keywords + recency weighting
- **Deduplication**: Prevents redundant document inclusion
- **Top-K Selection**: Returns 5 most relevant documents
- **Date Boost**: Recent records weighted higher

### Audit Logging

Every RAG query is logged with:
- Query text and user role
- Response length and confidence
- Source document count
- Timestamp and user ID
- For HIPAA compliance

## Setup Instructions

### 1. Enable Gemini API

```bash
# Go to Google Cloud Console
# Enable the "Generative Language API"
# Create an API key

# Add to your environment
export REACT_APP_GEMINI_API_KEY="your-api-key-here"
```

### 2. Create Firestore Collections

Create a collection called `medical_records` with the following schema:

```typescript
// medical_records collection
{
  patientId: string      // Reference to patient
  type: string          // diagnosis | lab_result | medication | procedure | clinical_note
  title: string         // Record title
  content: string       // Full text/description
  date: string          // Date of record (ISO format)
  createdAt: timestamp  // When added to system
}
```

### 3. Configure Dashboard

Update your `.env.local`:

```env
REACT_APP_GEMINI_API_KEY=your-gemini-api-key
```

### 4. Access RAG Assistant

**In Dashboard**: Click "AI Medical Assistant" tab in the sidebar

## Usage Examples

### Example 1: Clinician Query

**Input:**
```
What are this patient's recent glucose trends and how do they correlate with medication adjustments?
```

**Response Type:**
- Full lab values
- Clinical interpretations
- Recommendations for insulin adjustment
- Reference to specific dates and values

### Example 2: Patient Query

**Input:**
```
What do my recent blood pressure readings mean?
```

**Response Type:**
- Simple explanation of normal range
- Reassuring tone
- Suggestion to discuss with doctor
- Information about lifestyle factors

## API Reference

### Main Query Function

```typescript
async function queryMedicalRAG(
  ragQuery: RAGQuery,
  apiKey: string
): Promise<RAGResponse>

interface RAGQuery {
  query: string              // User's question
  patientId?: string         // For patient-specific context
  userRole: 'clinician' | 'patient' | 'admin'
  context?: string           // Optional additional context
}

interface RAGResponse {
  response: string           // AI-generated response
  sources: SourceInfo[]     // Documents used
  confidence: number        // 0-1 confidence score
  timestamp: string         // Response time
}
```

### Store Medical Record

```typescript
async function storeMedicalRecord(record: MedicalRecord): Promise<string>
```

### Validate Vitals

Uses the `vitalsValidation.ts` utility to check vital signs:

```typescript
export function validateVitals(
  vitals: VitalSigns,
  thresholds?: Record<string, { min: number; max: number }>
): ValidationResult
```

## Component Integration

### Using in Dashboard

The RAG Assistant is automatically integrated as a tab:

```typescript
// Access at: Dashboard → "AI Medical Assistant" tab
// Routes to activeTab === 'rag_assistant'
```

### Using Standalone

```typescript
import { MedicalRAGAssistant } from '@/components';

<MedicalRAGAssistant
  patientId="patient-123"
  userRole="clinician"
  userName="Dr. Smith"
  geminiApiKey={apiKey}
  onClose={() => handleClose()}
/>
```

## Security & Compliance

### HIPAA Considerations

✅ **Implemented:**
- Access control by role
- Audit logging for all queries
- Encrypted data transmission (HTTPS)
- Server-side query logging
- Patient-specific data isolation

⚠️ **For Production:**
- Enable Firestore encryption at rest
- Implement rate limiting on API
- Add IP whitelisting
- Regular security audits
- Compliance monitoring

### Data Privacy

- Medical records NOT sent to third parties
- Gemini API calls include only necessary context
- No patient names in API calls
- Responses stored only for audit trail
- GDPR/HIPAA compliant logging

## Performance Optimization

### Current Optimizations

- **Vector Search Alternative**: Currently uses keyword matching. For production scale:
  - Implement Vertex AI Vector Search
  - Pinecone or Weaviate for embeddings
  - Semantic similarity scoring

- **Caching**: Consider caching common queries
  - Redis for query results
  - TTL: 1 hour
  - Keyed by: `${patientId}:${query_hash}`

- **Background Processing**: For large datasets
  - Move embedding generation to Cloud Tasks
  - Pre-compute embeddings nightly
  - Store as vectors in collection

### Suggested Improvements

1. **Vector Embeddings**
   ```typescript
   // Generate embeddings for all records
   const embedding = await genAI.getGenerativeModel({
     model: 'embedding-001'
   }).embedContent(text);
   
   // Store with record
   await storeMedicalRecord({
     ...record,
     embeddings: embedding.embedding.values
   });
   ```

2. **Semantic Search**
   ```typescript
   function cosineSimilarity(a: number[], b: number[]): number {
     const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
     const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
     const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
     return dotProduct / (magA * magB);
   }
   ```

## Troubleshooting

### Issue: "API Key Error"

**Solution:**
```bash
# Verify API key is set
echo $REACT_APP_GEMINI_API_KEY

# Check it's accessible to frontend
# (Should be in .env.local, NOT .env)
```

### Issue: "No Records Found"

**Check:**
1. Medical records collection exists
2. Records have correct `patientId`
3. Query matches record content
4. Date format is ISO string

### Issue: "Slow Response"

**Optimize:**
1. Reduce number of records retrieved (change `limit: 5` in code)
2. Implement vector search
3. Add Firestore indexes for patientId + date
4. Cache common queries

### Issue: "CORS Error"

**Solution:**
- This should not occur (backend cloud function)
- If using direct API: add CORS headers to function

## Monitoring & Analytics

### Log Structure

```typescript
{
  userId: string          // Who ran query
  query: string          // The question asked
  patientId: string      // Which patient
  userRole: string       // clinician|patient
  responseLength: number // Characters in response
  sourcesCount: number   // Documents used
  confidence: number     // 0-1 score
  timestamp: Timestamp   // When executed
}
```

### Dashboard Metrics

- Queries per day
- Average response time
- Top queried topics
- Error rate
- By role breakdown

## Advanced Configuration

### Custom Medical Terminology Dictionary

```typescript
// In medicalRAG.ts
const MEDICAL_SIMPLIFICATIONS: Record<string, string> = {
  'myocardial infarction': 'heart attack',
  'atrial fibrillation': 'irregular heartbeat',
  'dyspnea': 'difficulty breathing',
  // Add more as needed
};
```

### Adjust Relevance Scoring

```typescript
function scoreRelevance(record: MedicalRecord, query: string): number {
  // Modify scoring weights:
  const KEYWORD_WEIGHT = 1;
  const RECENT_HEAVY = 3;    // Change these
  const RECENT_MEDIUM = 2;
  const RECENT_LIGHT = 1;
  
  // ... implement custom logic
}
```

### Customize Prompts

```typescript
// For clinicians - modify buildClinicianPrompt()
// For patients - modify buildPatientPrompt()

// Add organization-specific guidelines
// Include local protocols
// Reference internal standards
```

## Next Steps

1. **Deploy to Production**
   ```bash
   firebase deploy --only functions
   ```

2. **Enable Analytics**
   - Set up Firestore Analytics
   - Create dashboards for metrics

3. **User Training**
   - How to ask effective questions
   - Understanding limitations
   - When to contact physicians

4. **Scale Implementation**
   - Migrate to vector search
   - Add more record types
   - Integrate with EHR systems

## Support & Documentation

- **Medical Accuracy**: Always review AI responses
- **Legal/Compliance**: Not a substitute for clinical judgment
- **Feedback**: Report issues for model improvement
- **Security**: Report vulnerabilities responsibly

## References

- [Gemini API Documentation](https://ai.google.dev/)
- [Firebase Firestore Best Practices](https://firebase.google.com/docs/firestore)
- [HIPAA Compliance Checklist](https://www.hhs.gov/hipaa/)
- [Vector Search Documentation](https://cloud.google.com/vertex-ai/docs/vector-search)
