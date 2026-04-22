# ============================================================================
# ENVIRONMENT CONFIGURATION
# ============================================================================

# .env.example (Frontend)
# Copy this to .env and fill in your values
# ----------------------------------------------------------------------------

# Firebase Configuration (from Firebase Console)
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# Backend API URL
# Empty = use Vite proxy in dev (http://localhost:3001 -> /api)
# Production = your deployed backend URL (e.g., https://api.yourdomain.com)
VITE_API_URL=

# Optional: Compliance labels (comma-separated)
VITE_COMPLIANCE_LABELS=HIPAA,ISO 27001,GDPR

# ============================================================================

# .env (Backend)
# ----------------------------------------------------------------------------

# Gemini API Key (from Google AI Studio)
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Admin
GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json
FIREBASE_STORAGE_BUCKET=your-medical-records-bucket

# Server Configuration
PORT=3001
NODE_ENV=development

# ============================================================================
# VITE PROXY CONFIGURATION (vite.config.ts)
# ============================================================================

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})

# ============================================================================
# PACKAGE.JSON SCRIPTS
# ============================================================================

# Add these to your package.json:

# Frontend (package.json)
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}

# Backend (server/package.json)
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest"
  }
}

# ============================================================================
# INSTALLATION STEPS
# ============================================================================

# 1. Install Frontend Dependencies
# ----------------------------------------------------------------------------
cd your-medical-app
pnpm install
# or: npm install / yarn install

# Key dependencies to verify:
# - react ^18.2.0
# - firebase ^10.7.0
# - lucide-react ^0.300.0
# - @google/generative-ai ^0.1.0

# 2. Install Backend Dependencies
# ----------------------------------------------------------------------------
cd server
pnpm install

# Required packages:
pnpm add express cors dotenv
pnpm add @google/generative-ai
pnpm add firebase-admin
pnpm add -D @types/express @types/cors @types/node tsx

# ============================================================================
# FIREBASE SETUP
# ============================================================================

# 1. Create Firestore Collections
# ----------------------------------------------------------------------------

# medical_embeddings collection structure:
{
  "patientId": "string",
  "fileName": "string",
  "chunkIndex": "number",
  "text": "string",
  "embedding": "array<number>",  // 768 dimensions for text-embedding-004
  "createdAt": "timestamp"
}

# query_logs collection structure:
{
  "userId": "string",
  "patientId": "string",
  "query": "string",
  "response": "string (truncated)",
  "timestamp": "timestamp"
}

# 2. Set Firestore Security Rules
# ----------------------------------------------------------------------------

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Medical embeddings - read only for authenticated users
    match /medical_embeddings/{document} {
      allow read: if request.auth != null && 
        (resource.data.patientId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'doctor' ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow write: if false; // Only Cloud Functions can write
    }
    
    // Query logs - admin only
    match /query_logs/{document} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow create: if request.auth != null;
      allow update, delete: if false;
    }
  }
}

# 3. Set Cloud Storage Rules
# ----------------------------------------------------------------------------

rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /patients/{patientId}/{allPaths=**} {
      // Patients can read their own files
      allow read: if request.auth != null && 
        (request.auth.uid == patientId || 
         firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role in ['doctor', 'admin']);
      
      // Only authenticated users can upload (further checks in Cloud Function)
      allow write: if request.auth != null;
    }
  }
}

# ============================================================================
# GOOGLE CLOUD SETUP
# ============================================================================

# 1. Enable Required APIs
# ----------------------------------------------------------------------------

gcloud services enable firestore.googleapis.com
gcloud services enable storage-api.googleapis.com
gcloud services enable generativelanguage.googleapis.com
gcloud services enable aiplatform.googleapis.com

# 2. Create Service Account
# ----------------------------------------------------------------------------

gcloud iam service-accounts create medical-rag-service \
  --display-name="Medical RAG Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:medical-rag-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:medical-rag-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

# Download service account key
gcloud iam service-accounts keys create serviceAccountKey.json \
  --iam-account=medical-rag-service@YOUR_PROJECT_ID.iam.gserviceaccount.com

# 3. Create Storage Bucket
# ----------------------------------------------------------------------------

gsutil mb -l us-central1 -c STANDARD gs://your-medical-records-bucket

# Set lifecycle policy (optional - delete old files after 7 years)
cat > lifecycle.json << 'EOF'
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 2555}
      }
    ]
  }
}
EOF

gsutil lifecycle set lifecycle.json gs://your-medical-records-bucket

# ============================================================================
# DEVELOPMENT WORKFLOW
# ============================================================================

# Terminal 1: Backend Server
# ----------------------------------------------------------------------------
cd server
pnpm run dev
# Server should start on http://localhost:3001
# Check: curl http://localhost:3001/health

# Terminal 2: Frontend Dev Server
# ----------------------------------------------------------------------------
cd your-medical-app
pnpm run dev
# Vite should start on http://localhost:5173
# Proxy will forward /api/* to http://localhost:3001

# Terminal 3: Testing
# ----------------------------------------------------------------------------
pnpm run test
# or
pnpm run test:ui  # for Vitest UI

# ============================================================================
# TESTING THE COMPLETE FLOW
# ============================================================================

# 1. Test Backend Directly
# ----------------------------------------------------------------------------

# Health check
curl http://localhost:3001/health

# RAG query (replace with actual patientId after uploading docs)
curl -X POST http://localhost:3001/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the patient'\''s current medications?",
    "patientId": "test-patient-123",
    "userRole": "doctor"
  }'

# Expected: { "answer": "...", "sources": [...] }

# 2. Test Frontend Integration
# ----------------------------------------------------------------------------

# Open browser: http://localhost:5173
# 1. Login with test user
# 2. Navigate to Dashboard
# 3. Click "AI Assistant" button
# 4. Type query: "Hello, can you help me?"
# 5. Check browser console for:
#    - Network request to /api/rag/query
#    - Response with answer and sources

# ============================================================================
# PRODUCTION DEPLOYMENT
# ============================================================================

# 1. Build Frontend
# ----------------------------------------------------------------------------
cd your-medical-app
pnpm run build
# Output: dist/ folder

# 2. Build Backend
# ----------------------------------------------------------------------------
cd server
pnpm run build
# Output: dist/ folder

# 3. Deploy to Cloud Run (Backend)
# ----------------------------------------------------------------------------

# Create Dockerfile for backend
cat > Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --prod

COPY dist ./dist
COPY serviceAccountKey.json ./

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "dist/index.js"]
EOF

# Build and deploy
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/medical-rag-api
gcloud run deploy medical-rag-api \
  --image gcr.io/YOUR_PROJECT_ID/medical-rag-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your_key,FIREBASE_STORAGE_BUCKET=your-bucket

# Get deployed URL
BACKEND_URL=$(gcloud run services describe medical-rag-api --region us-central1 --format 'value(status.url)')
echo "Backend deployed to: $BACKEND_URL"

# 4. Deploy Frontend to Firebase Hosting
# ----------------------------------------------------------------------------

# Update .env.production
echo "VITE_API_URL=$BACKEND_URL" > .env.production
cat .env.example | grep VITE_FIREBASE >> .env.production
echo "VITE_COMPLIANCE_LABELS=HIPAA,ISO 27001,GDPR" >> .env.production

# Rebuild with production env
pnpm run build

# Deploy
firebase deploy --only hosting

# ============================================================================
# MONITORING & MAINTENANCE
# ============================================================================

# 1. View Logs
# ----------------------------------------------------------------------------

# Backend logs (Cloud Run)
gcloud run services logs read medical-rag-api --region us-central1

# Frontend logs (Firebase Hosting)
firebase hosting:channel:deploy preview
firebase hosting:channel:list

# 2. Monitor API Usage
# ----------------------------------------------------------------------------

# Gemini API usage
# Visit: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas

# Cloud Run metrics
gcloud run services describe medical-rag-api --region us-central1

# 3. Set Up Alerts
# ----------------------------------------------------------------------------

# Create alert for high error rate
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="High RAG Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=0.05

# ============================================================================
# TROUBLESHOOTING CHECKLIST
# ============================================================================

# ☐ Backend server running? (curl http://localhost:3001/health)
# ☐ Gemini API key set? (echo $GEMINI_API_KEY)
# ☐ Firebase Admin initialized? (check logs for "Firebase initialized")
# ☐ CORS enabled? (check backend has cors() middleware)
# ☐ Frontend proxy configured? (check vite.config.ts)
# ☐ VITE_API_URL correct? (empty for dev, backend URL for prod)
# ☐ Medical embeddings exist? (check Firestore collection)
# ☐ Network tab shows 200 response? (check DevTools)
# ☐ No CORS errors in console? (should show in red)
# ☐ Component renders correctly? (check React DevTools)

# ============================================================================
# SECURITY BEST PRACTICES
# ============================================================================

# 1. Never commit API keys to git
echo "*.env" >> .gitignore
echo "serviceAccountKey.json" >> .gitignore

# 2. Use environment-specific configs
# .env.development
# .env.production
# .env.test

# 3. Implement rate limiting (backend)
# pnpm add express-rate-limit
# See: https://www.npmjs.com/package/express-rate-limit

# 4. Add request authentication
# Verify Firebase ID tokens on backend

# 5. Enable HTTPS only in production
# Cloud Run automatically provides HTTPS

# 6. Set up HIPAA compliance logging
# Log all data access for audit trail

# 7. Encrypt sensitive data at rest
# Use Google Cloud KMS for encryption keys

# ============================================================================
# COST OPTIMIZATION
# ============================================================================

# 1. Cache frequent queries
# Implement Redis or Memcached for caching

# 2. Batch embedding operations
# Process multiple documents in single API call

# 3. Use Firestore query limits
# Limit to 100 documents per vector search

# 4. Monitor Gemini API usage
# Set up billing alerts in Google Cloud Console

# 5. Optimize Cloud Run scaling
# Set min instances to 0, max to reasonable limit

# 6. Use Cloud Storage lifecycle policies
# Auto-delete old files to save storage costs

echo "Setup complete! 🎉"
echo "Next steps:"
echo "1. Start backend: cd server && pnpm run dev"
echo "2. Start frontend: cd .. && pnpm run dev"
echo "3. Open http://localhost:5173"
echo "4. Test AI Assistant integration"