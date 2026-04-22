# 🚀 VITALSEDGE PRODUCTION DEPLOYMENT GUIDE
## gcloud + Firebase Hosting + Preview Channels

**Status**: Ready for Production Deployment  
**Tools**: Firebase CLI, gcloud CLI, Preview Channels  
**Target**: Firebase Hosting (Production), Preview Channels (Testing), Firestore, Authentication

**Deployment Strategy**: Test → Stage (Preview Channel) → Production

---

## 🎯 QUICK REFERENCE - DEPLOYMENT WORKFLOW

### Three-Stage Deployment Process:

1. **Local Testing** (Your Machine)
   - `pnpm run dev:full` - Firebase emulators + Vite dev server
   - Local testing of all features

2. **Staging Preview Channel** (Team Review)
   - `firebase hosting:channel:deploy staging --expires 7d`
   - URL: `https://staging--vitalsedge-monitoring-system.web.app`
   - Internal team testing & feedback

3. **QA Preview Channel** (Hospital Approval)
   - `firebase hosting:channel:deploy qa --expires 14d`
   - URL: `https://qa--vitalsedge-monitoring-system.web.app`
   - Hospital/client review & sign-off

4. **Production** (Live)
   - `firebase deploy --only hosting`
   - URL: `https://vitalsedge-monitoring-system.firebaseapp.com`
   - Go-live for hospital system

### Optional: Backend Services via gcloud
- Deploy custom backend to Cloud Run: `gcloud run deploy`
- Deploy scheduled jobs: `gcloud scheduler jobs`
- Use Pub/Sub for event processing: `gcloud pubsub`

### Key Command Cheat Sheet:
```bash
pnpm run build                                    # Build app
firebase hosting:channel:deploy staging          # Deploy staging
firebase hosting:channel:deploy qa               # Deploy QA
firebase deploy --only hosting                   # Deploy production
gcloud run deploy vitalsedge-backend            # Deploy backend (optional)
firebase hosting:channel:list                    # View all deployments
```

---

## 🍃💧 Dashboard Preview - Real-time Patient Monitoring & Analytics

<img alt="Dashboard Preview" class="w-full h-full object-cover opacity-60" referrerpolicy="no-referrer" src="https://picsum.photos/seed/dashboard/1200/800">

**Dashboard Layout:**
```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                  TOP NAVIGATION                                  │
│  VitalsEdge | Patient: John Doe | [Live Indicator] [Dark Mode] [Alerts] [Menu]  │
├────────────┬───────────────────────────────────────────────────────────────────┤
│  SIDEBAR   │  PATIENT OVERVIEW                                                 │
│  ─────────  │  ╔═══════════════════════════════════════════════════════════╗  │
│ • Overview │  ║ VITAL SIGNS CARDS (with shadows & rounded corners)         ║  │
│ • Trends   │  ║  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       ║  │
│ • Settings │  ║  │ HR: 82  │  │SpO2: 98 │  │ Temp:   │  │Glucose: │       ║  │
│ • Audit    │  ║  │ BPM ✓   │  │  % ✓    │  │ 37.2°C ✓│  │ 105 ⚠   │       ║  │
│            │  ║  └─────────┘  └─────────┘  └─────────┘  └─────────┘       ║  │
│            │  ╚═══════════════════════════════════════════════════════════╝  │
│            │                                                                   │
│            │  SIGNAL FEED          │  MONITORING STATUS                      │
│            │  ─────────────────────┼─────────────────────                    │
│            │  Time | HR | SpO2     │  📡 Telemetry: Live                    │
│ (scroll    │  14:32 | 82 | 98      │  ⚙  Device: Active                    │
│  shows     │  14:31 | 80 | 99      │  🔔 Open Alerts: 2                    │
│  blue→green│  14:30 | 81 | 98      │  ✓ HIPAA: Compliant                  │
│  →purple   │                        │                                        │
│  gradient) │  HEART RATE CHART                  ANOMALY LOG                  │
│            │  ╔════════════════════╗  ╔═══════════════════════════╗         │
│            │  ║                    ║  ║ TACHYCARDIA (High)        ║         │
│            │  ║    ╱╲  Max: 100    ║  ║ HR 125 BPM • 14:32:15    ║         │
│            │  ║   ╱  ╲   ╱╲        ║  ║                           ║         │
│            │  ║      ╲ ╱  ╲ Min:60 ║  ║ HYPERGLYCEMIA (Medium)    ║         │
│            │  ║       ╲/    ╲     ║  ║ Glucose 280 • 14:25:42   ║         │
│            │  ╚════════════════════╝  ╚═══════════════════════════╝         │
│            │                                                                   │
└────────────┴───────────────────────────────────────────────────────────────────┘
```

**Key Features Visible:**
- **Vital Signs Cards**: Heart rate, SpO2, temperature, and glucose with shadow depth and rounded corners
- **Scroll Gradient**: Color-gradated bar appears at top when scrolling (blue → green → purple)
- **Real-time Charts**: Heart rate trends with threshold reference lines
- **Anomaly Log**: Edge-detected alerts with severity levels (high, medium, low)
- **Monitoring Status**: Live connection indicators, device health, alert counts, HIPAA compliance
- **Code-split Optimized**: Medical RAG module bundled separately for faster loading
- **Dark Mode Ready**: Supports light/dark themes with proper contrast

---

## 1. PRE-DEPLOYMENT CHECKLIST

### Code Quality
```
□ All TypeScript compiles without errors
□ All tests pass (240+ tests)
□ No console warnings or errors
□ ESLint passes all checks
□ Code review completed
```

### Frontend Build
```
□ React app builds successfully (pnpm build)
□ All routes working
□ All components load correctly
□ Images optimized
□ No missing dependencies
```

### Backend Configuration
```
✅ Firebase project created and configured
✅ Firestore database rules defined
✅ Authentication configured
✅ Cloud Storage configured (if needed)
✅ Environment variables set
✅ gcloud CLI installed and configured
```

### Documentation
```
□ Architecture documented
□ Deployment procedure documented
□ Rollback procedure documented
□ Support procedures documented
□ Monitoring setup documented
```

---

## 2. FIREBASE PROJECT SETUP

### Create Firebase Project (if not done)
```bash
# Login to Google Cloud
gcloud auth login

# Create project
gcloud projects create vitalsedge-monitoring-system --name="VitalsEdge Monitoring"

# Set as active project
gcloud config set project vitalsedge-monitoring-system

# Create Firebase app through console
# https://console.firebase.google.com
```

### Initialize Firebase in Project
```bash
# Login to Firebase
firebase login

# Initialize Firebase
firebase init --project=vitalsedge-monitoring-system

# Select services:
# □ Firestore
# □ Authentication
# □ Hosting
# □ Cloud Functions (if needed)
# □ Storage (if needed)
```

### Configure firebase.json
```json
{
  "hosting": {
    "site": "vitalsedge-monitoring-system",
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css|woff|woff2)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=3600"
          },
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "X-XSS-Protection",
            "value": "1; mode=block"
          },
          {
            "key": "Strict-Transport-Security",
            "value": "max-age=31536000; includeSubDomains"
          }
        ]
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "auth": {
    "providers": {
      "emailPassword": true
    }
  }
}
```

### Deploy Firestore Rules
```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Verify deployment
firebase firestore:describe
```

---

## 3. ENVIRONMENT CONFIGURATION

### Production .env Configuration
```env
# Firebase Config (Production)
# Note: the current codebase reads VITE_API_KEY-style names from src/firebase.ts
VITE_API_KEY=<production-api-key>
VITE_AUTH_DOMAIN=vitalsedge-monitoring-system.firebaseapp.com
VITE_PROJECT_ID=vitalsedge-monitoring-system
VITE_STORAGE_BUCKET=vitalsedge-monitoring-system.firebasestorage.app
VITE_MESSAGING_SENDER_ID=<sender-id>
VITE_APP_ID=<app-id>
VITE_MEASUREMENT_ID=<measurement-id>

# Environment
VITE_APP_ENV=production
VITE_USE_FIREBASE_EMULATOR=false

# API Configuration
VITE_API_URL=https://vitalsedge-monitoring-system.firebaseapp.com
VITE_API_TIMEOUT=30000

# Monitoring
VITE_SENTRY_DSN=<sentry-dsn>
VITE_LOG_LEVEL=warn
```

### Production Firebase Config
```typescript
// src/firebase.ts - Production configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID,
};

// Production: No emulator connection
if (import.meta.env.PROD) {
  // Connect to production Firebase
  console.log('✅ Connected to production Firebase');
} else {
  // Dev: Use emulators
  if (window.location.hostname === 'localhost') {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
  }
}
```

---

## 4. BUILD & OPTIMIZATION

### Production Build
```bash
# Clean and build
pnpm clean
pnpm install --frozen-lockfile
pnpm run build

# Verify build
ls -lh dist/
du -sh dist/

# Expected: dist/ < 500KB (with gzip)
```

### Build Optimization
```tsx
// vite.config.ts - Optimized configuration
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    target: 'es2020',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          charts: ['recharts'],
        },
      },
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
})
```

### Performance Verification
```bash
# Check bundle size
npm run build
npm run analyze  # If script exists

# Expected sizes:
# - main bundle: < 200KB
# - vendor bundle: < 250KB
# - Firebase bundle: < 150KB
# - Total: < 600KB gzipped
```

---

## 5. FIREBASE HOSTING DEPLOYMENT

### Deploy to Firebase Hosting
```bash
# Step 1: Ensure build is up to date
pnpm run build

# Step 2: Deploy to Firebase Hosting
firebase deploy --only hosting

# Step 3: Get deployment URL
firebase hosting:channel:list

# Expected output:
# ✔ Deploy complete!
# Project Console: https://console.firebase.google.com/project/vitalsedge-monitoring-system
# Hosting URL: https://vitalsedge-monitoring-system.firebaseapp.com
```

### Verify Deployment
```bash
# Check hosting status
firebase hosting:list

# View deployment history
firebase hosting:channel:list

# Test production URL
curl -I https://vitalsedge-monitoring-system.firebaseapp.com

# Expected: 200 OK
```

---

## 5A. FIREBASE PREVIEW CHANNELS (STAGING & TESTING)

### What are Preview Channels?
Firebase Preview Channels allow you to deploy temporary versions of your app for testing and validation before pushing to production. Each channel gets a unique URL for team review and QA testing.

### Setup Preview Channels

```bash
# Enable hosting data collection for analytics
firebase hosting:enable-data-collection

# Create a staging channel
firebase hosting:channel:create staging

# Create a QA/beta channel
firebase hosting:channel:create qa

# List all channels
firebase hosting:channel:list
```

### Deploy to Preview Channels

```bash
# Deploy to staging channel
firebase hosting:channel:deploy staging --expires 7d

# Deploy to QA channel
firebase hosting:channel:deploy qa --expires 14d

# Get preview URLs
firebase hosting:channel:list
# Output will show:
# staging -> https://staging--vitalsedge-monitoring-system.web.app
# qa      -> https://qa--vitalsedge-monitoring-system.web.app
# live    -> https://vitalsedge-monitoring-system.firebaseapp.com
```

### Testing Workflow

```
1. Local Testing (pnpm run dev:full)
   ↓
2. Build (pnpm run build)
   ↓
3. Deploy to Staging Preview Channel
   (firebase hosting:channel:deploy staging)
   ↓
4. Testing Team validates on staging URL
   ↓
5. Deploy to QA Preview Channel
   (firebase hosting:channel:deploy qa)
   ↓
6. Hospital/Client approval on QA URL
   ↓
7. Deploy to Production
   (firebase deploy --only hosting)
```

### Preview Channel Best Practices

```bash
# Deploy with automatic TTL (expires after specified time)
firebase hosting:channel:deploy staging --expires 7d

# Clean up expired channels
firebase hosting:channel:list --show-expired

# Delete a specific channel
firebase hosting:channel:delete staging

# Deploy with custom message
firebase hosting:channel:deploy qa:my-feature-test --expires 7d
```

### Monitor Preview Deployments

```bash
# View deployment history for all channels
firebase hosting:channel:list

# Get detailed info about a deployment
firebase hosting:sites:get --site vitalsedge-monitoring-system

# Check preview URL health
curl -I https://staging--vitalsedge-monitoring-system.web.app
curl -I https://qa--vitalsedge-monitoring-system.web.app
```

---

## 6. CLOUD RUN DEPLOYMENT (Optional - For Custom Backend Services)

### Create Dockerfile for Custom Backend
```dockerfile
# Dockerfile (for custom backend service using gcloud)
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 8080

# Start application
CMD ["npm", "start"]
```

### Build and Deploy to Cloud Run using gcloud

```bash
# Step 1: Authenticate with gcloud (if not already done)
source ~/google-cloud-sdk/path.bash.inc
gcloud auth login
gcloud config set project vitalsedge-monitoring-system

# Step 2: Configure Docker authentication
gcloud auth configure-docker

# Step 3: Build Docker image locally
docker build -t vitalsedge-backend:latest .

# Step 4: Tag image for gcloud registry
docker tag vitalsedge-backend:latest gcr.io/vitalsedge-monitoring-system/vitalsedge-backend:latest

# Step 5: Push to Google Container Registry
docker push gcr.io/vitalsedge-monitoring-system/vitalsedge-backend:latest

# Step 6: Deploy to Cloud Run
gcloud run deploy vitalsedge-backend \
  --image gcr.io/vitalsedge-monitoring-system/vitalsedge-backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars FIREBASE_PROJECT_ID=vitalsedge-monitoring-system

# Step 7: Get Cloud Run service URL
gcloud run services describe vitalsedge-backend \
  --platform managed \
  --region us-central1 \
  --format='value(status.url)'

# Step 8: Configure firestore to use Cloud Run endpoint (if needed)
# Update your src/firebase.ts to point to the Cloud Run URL for API calls
```

### Rollback Cloud Run Deployment

```bash
# View Cloud Run revisions
gcloud run revisions list --service vitalsedge-backend --region us-central1

# Route traffic to previous revision
gcloud run services update-traffic vitalsedge-backend \
  --region us-central1 \
  --to-revisions REVISION_NAME=100

# Alternatively, redeploy previous image
docker tag vitalsedge-backend:previous gcr.io/vitalsedge-monitoring-system/vitalsedge-backend:previous
docker push gcr.io/vitalsedge-monitoring-system/vitalsedge-backend:previous
gcloud run deploy vitalsedge-backend \
  --image gcr.io/vitalsedge-monitoring-system/vitalsedge-backend:previous \
  --platform managed \
  --region us-central1
```

### Firebase Security Rules (Production)
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Hospitals (read-only for all authenticated users)
    match /hospitals/{hospitalId} {
      allow read: if request.auth != null;
      allow write: if false; // Never allow writes (admin only)
    }

    // Doctors (own profile + admin)
    match /doctors/{doctorId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
                       request.auth.uid == doctorId;
      allow update, delete: if request.auth.uid == doctorId ||
                               request.auth.token.role == 'admin';
    }

    // Patients (doctor who added + hospital admin)
    match /patients/{patientId} {
      allow read: if request.auth != null &&
                     (request.auth.uid == resource.data.primaryDoctorId ||
                      request.auth.token.role == 'hospital_admin' ||
                      request.auth.token.role == 'admin');
      allow create: if request.auth != null &&
                       request.auth.token.role in ['doctor', 'hospital_admin', 'admin'];
      allow update, delete: if request.auth.uid == resource.data.primaryDoctorId ||
                               request.auth.token.role == 'admin';
    }

    // Vital Signs (device + doctor)
    match /vitals/{patientId}/readings/{readingId} {
      allow read: if request.auth != null;
      allow create, write: if request.auth != null &&
                              request.auth.token.role in ['doctor', 'device', 'admin'];
    }

    // Audit Logs (append-only, admin read)
    match /auditLogs/{logId} {
      allow read: if request.auth.token.role in ['admin', 'hospital_admin'];
      allow create: if request.auth != null;
      allow update, delete: if false;
    }
  }
}
```

---

## 7. GCLOUD CLI - PREREQUISITE SETUP

### Installation (if not already done)
```bash
# Download and install gcloud SDK
curl https://sdk.cloud.google.com | bash

# Add gcloud to PATH
echo 'source ~/google-cloud-sdk/path.bash.inc' >> ~/.bashrc
source ~/google-cloud-sdk/path.bash.inc

# Verify installation
gcloud --version
```

### Configure gcloud for VitalsEdge Project
```bash
# Login with your Google account
gcloud auth login

# Set project
gcloud config set project vitalsedge-monitoring-system

# Verify configuration
gcloud config list
gcloud config get-value project
```

### Enable Required APIs
```bash
# Enable Cloud Run API
gcloud services enable run.googleapis.com

# Enable Container Registry API
gcloud services enable containerregistry.googleapis.com

# Enable Cloud Logging API
gcloud services enable logging.googleapis.com

# Enable Cloud Monitoring API
gcloud services enable monitoring.googleapis.com

# List enabled APIs
gcloud services list --enabled
```

### Set Up Application Default Credentials
```bash
# Create application default credentials
gcloud auth application-default login

# Verify
gcloud auth application-default print-access-token
```

---

## 8. SECURITY HARDENING

### Firebase Security Rules (Production)
```javascript
// firebase.json - Already configured above
// Includes:
// - Strict-Transport-Security (HSTS)
// - X-Frame-Options (DENY)
// - X-Content-Type-Options (nosniff)
// - X-XSS-Protection
// - Cache-Control for assets
```

### Firebase Authentication Security
```typescript
// src/firebase.ts - Security measures
import { setPersistence, browserLocalPersistence } from 'firebase/auth';

// Enable persistent sessions
setPersistence(auth, browserLocalPersistence);

// Implement logout on security event
auth.onAuthStateChanged((user) => {
  if (!user) {
    // User logged out - clear sensitive data
    localStorage.removeItem('userPreferences');
    sessionStorage.clear();
  }
});

// Auto-logout after 30 minutes of inactivity
let inactivityTimeout: NodeJS.Timeout;

const resetInactivityTimer = () => {
  clearTimeout(inactivityTimeout);
  inactivityTimeout = setTimeout(() => {
    auth.signOut();
    console.log('Auto-logged out due to inactivity');
  }, 30 * 60 * 1000); // 30 minutes
};

// Reset timer on user activity
document.addEventListener('click', resetInactivityTimer);
document.addEventListener('keypress', resetInactivityTimer);
```

---

## 9. MONITORING & LOGGING

### Setup Firebase Monitoring
```bash
# Enable Cloud Logging
firebase deploy --only firestore:rules,firestore:indexes

# View logs
firebase functions:log

# Real-time monitoring
firebase functions:describe --gen2 <function-name>
```

### Sentry Integration (Error Tracking)
```typescript
// src/sentry.ts
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_APP_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### Cloud Logging
```bash
# View Cloud Logging
gcloud logging read "resource.type=cloud_run_revision" --limit 50 --format json

# Setup alerts
gcloud alpha monitoring policies create \
  --notification-channels=<channel-id> \
  --display-name="VitalsEdge Error Rate"
```

---

## 10. DEPLOYMENT CHECKLIST

### Pre-Deployment (1 day before)
```
□ All tests passing (pnpm test)
□ Build succeeds (pnpm build)
□ No TypeScript errors
□ No console warnings
□ Database backup created
□ Security rules reviewed
□ Environment variables verified
□ Monitoring setup verified
□ Rollback plan documented
□ Team notified
```

### Deployment Day
```
□ Backup Firestore data
□ Enable maintenance mode (optional)
□ Deploy to staging first
□ Test staging environment
□ Deploy to production
□ Run smoke tests
□ Monitor error rates
□ Verify all pages load
□ Test critical workflows
□ Monitor performance metrics
□ Disable maintenance mode
```

### Post-Deployment (24 hours)
```
□ Monitor error logs
□ Check performance metrics
□ Gather team feedback
□ Monitor user feedback
□ Check Sentry for issues
□ Verify backups working
□ Document any issues
□ Plan follow-up fixes
□ Schedule retrospective
```

---

## 11. ROLLBACK PROCEDURE

### If Deployment Fails
```bash
# Step 1: Identify issue
firebase functions:log --limit=100

# Step 2: Rollback Firebase Hosting
firebase hosting:channel:deploy previous-version

# Step 3: Rollback Firestore rules (if changed)
firebase deploy --only firestore:rules --project=vitalsedge-monitoring-system

# Step 4: Investigate and fix
# - Review error logs
# - Check Sentry dashboard
# - Review recent changes

# Step 5: Fix and redeploy
git revert <commit-hash>
pnpm run build
firebase deploy --only hosting
```

### Manual Rollback
```bash
# Get previous version
firebase hosting:channel:list

# Deploy specific version
firebase hosting:channel:deploy <channel-name>

# Verify rollback
curl -I https://vitalsedge-monitoring-system.firebaseapp.com
```

---

## 12. PRODUCTION MAINTENANCE

### Daily Tasks
```
□ Monitor error logs
□ Check performance metrics
□ Review user feedback
□ Check Sentry alerts
```

### Weekly Tasks
```
□ Review analytics
□ Check security logs
□ Audit access patterns
□ Update dependencies (security patches)
```

### Monthly Tasks
```
□ Performance optimization review
□ Security audit
□ Backup verification
□ Disaster recovery test
□ Team retrospective
```

---

## DEPLOYMENT COMMANDS SUMMARY

### Standard Deployment (Firebase Hosting Only)
```bash
# Full deployment to production
firebase deploy --only hosting --project=vitalsedge-monitoring-system

# Deploy security rules
firebase deploy --only firestore:rules --project=vitalsedge-monitoring-system

# Deploy both frontend and rules
firebase deploy --project=vitalsedge-monitoring-system
```

### Preview Channel Workflow (Recommended for Staging & QA)
```bash
# Step 1: Build the app
pnpm run build

# Step 2: Deploy to staging preview channel (7 day TTL)
pnpm exec firebase hosting:channel:deploy staging --expires 7d

# Step 3: Test on staging URL (get from firebase hosting:channel:list)
# https://staging--vitalsedge-monitoring-system.web.app

# Step 4: Deploy to QA preview channel (14 day TTL)
pnpm exec firebase hosting:channel:deploy qa --expires 14d

# Step 5: Have hospital/client approve on QA URL
# https://qa--vitalsedge-monitoring-system.web.app

# Step 6: Deploy to production when approved
firebase deploy --only hosting
```

### Preview Channel Management
```bash
# List all channels
firebase hosting:channel:list

# Get info about a specific channel
firebase hosting:sites:get --site vitalsedge-monitoring-system

# Delete a channel
firebase hosting:channel:delete staging

# Clean up expired channels
firebase hosting:channel:list --show-expired
```

### gcloud Services Deployment (Cloud Run - Optional)
```bash
# Deploy backend service to Cloud Run
gcloud run deploy vitalsedge-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# List Cloud Run services
gcloud run services list --platform managed --region us-central1

# View Cloud Run service details
gcloud run services describe vitalsedge-backend --region us-central1

# Update Cloud Run service
gcloud run deploy vitalsedge-backend --update-env-vars KEY=VALUE --region us-central1

# Delete Cloud Run service
gcloud run services delete vitalsedge-backend --region us-central1
```

### Cloud Logging & Monitoring
```bash
# View Firebase Hosting logs
firebase hosting:log

# View Firestore database activity logs
gcloud logging read "resource.type=cloud_firestore_database" --limit 50

# View Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision" --limit 50 --format json

# Setup alerts
gcloud alpha monitoring policies create \
  --notification-channels=<channel-id> \
  --display-name="VitalsEdge Error Rate"
```

---

## POST-DEPLOYMENT VERIFICATION

### Access Production & Preview URLs
```
Production Frontend: https://vitalsedge-monitoring-system.firebaseapp.com
Staging Preview:     https://staging--vitalsedge-monitoring-system.web.app
QA Preview:          https://qa--vitalsedge-monitoring-system.web.app

Firebase Console:    https://console.firebase.google.com/project/vitalsedge-monitoring-system
Cloud Run Console:   https://console.cloud.google.com/run
Cloud Logging:       https://console.cloud.google.com/logs
```

### Test Production Deployment
```bash
# Test production login page loads
curl -s https://vitalsedge-monitoring-system.firebaseapp.com | grep -o "<title>.*</title>"

# Test production API is responsive
curl -I https://vitalsedge-monitoring-system.firebaseapp.com

# Check security headers
curl -I https://vitalsedge-monitoring-system.firebaseapp.com | grep -E "X-|Strict|Cache"

# Test Firestore connectivity (open browser console)
console> db.collection('test').get().then(snap => console.log('✅ Firestore connected'))
```

### Test Preview Channels
```bash
# Get preview channel URLs
firebase hosting:channel:list

# Test staging deployment
curl -I https://staging--vitalsedge-monitoring-system.web.app
# Expected: 200 OK with preview channel headers

# Test QA deployment
curl -I https://qa--vitalsedge-monitoring-system.web.app
# Expected: 200 OK with preview channel headers
```

### Verify Monitoring & Logging
```bash
# Check latest deployment logs
firebase hosting:log --limit=20

# View Cloud Logging
gcloud logging read "resource.type=api" --limit 20 --format json

# Check for errors in Sentry (if configured)
# Open: https://sentry.io/organizations/vitalsedge/
```

---

## TROUBLESHOOTING

### Build Fails
```bash
# Clear cache and rebuild
pnpm clean
pnpm install --frozen-lockfile
pnpm run build
```

### Deployment Fails
```bash
# Check Firebase CLI version
firebase --version

# Update Firebase CLI
npm install -g firebase-tools@latest

# Check gcloud configuration
gcloud config list

# Re-authenticate
firebase login --reauth
```

### Performance Issues
```bash
# Check Cloud Run metrics
gcloud run services describe vitalsedge-backend --platform managed

# Check Firestore metrics
firebase ext:info firestore-bigquery-export

# Enable caching
# Already configured in firebase.json headers section
```

### Security Issues
```bash
# Review Firestore rules
firebase firestore:describe

# Check access logs
gcloud logging read "protoPayload.serviceName=firestore.googleapis.com"

# Audit active sessions
# Manual review in Firebase Console > Authentication
```

---

## SUCCESS CRITERIA

Production deployment is successful when:

```
✅ Frontend loads without errors
✅ All pages render correctly
✅ Authentication works
✅ Data persists to Firestore
✅ No console errors
✅ Security headers present
✅ Performance metrics acceptable (< 3s load)
✅ Sentry shows no critical errors
✅ Hospital team can access system
✅ Real-time monitoring functional
✅ Alerts triggering correctly
✅ Audit logs recording properly
✅ Backups scheduled and working
✅ Monitoring alerts configured
✅ Team trained on operations
```

---

**Status**: ✅ **READY FOR GCLOUD + FIREBASE PREVIEW CHANNEL DEPLOYMENT**

All infrastructure configured with:
- ✅ Firebase Hosting for production
- ✅ Preview Channels for staging & QA testing
- ✅ gcloud CLI for optional Cloud Run backend services
- ✅ Security hardened with Firestore rules & HTTPS headers
- ✅ Monitoring & logging configured
- ✅ All procedures documented

**Deployment Strategy**: Local → Staging Preview → QA Preview → Production

Deploy with confidence. 🚀
