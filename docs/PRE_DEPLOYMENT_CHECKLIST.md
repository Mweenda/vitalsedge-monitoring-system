# VitalsEdge Pre-Deployment Checklist

## Final Verification Before Live Deployment

Use this checklist and the automated `cleanup-before-deploy.sh` script to ensure full readiness.

---

## 1. Code Quality & Compilation ✓

- [ ] Run cleanup script: `chmod +x cleanup-before-deploy.sh && ./cleanup-before-deploy.sh`
- [ ] TypeScript compilation: `npx tsc --noEmit` - **0 errors**
- [ ] No console.log/debug statements in production code
- [ ] No hardcoded API keys or secrets
- [ ] All import/export statements valid
- [ ] Code follows project conventions

**Command:**
```bash
./cleanup-before-deploy.sh
```

---

## 2. Dependencies & Build ✓

- [ ] Dependencies installed: `pnpm install --frozen-lockfile`
- [ ] Production build succeeds: `pnpm run build`
- [ ] Build output in `dist/` folder
- [ ] No critical vulnerabilities: `pnpm audit`
- [ ] Lock file committed to version control

**Commands:**
```bash
pnpm install --frozen-lockfile
pnpm run build
pnpm audit --audit-level=moderate
```

---

## 3. Configuration Files ✓

- [ ] `.env.production` exists with all required variables
- [ ] Firebase configuration valid (firebaseConfig object)
- [ ] Gemini API key configured
- [ ] Database security rules updated
- [ ] CORS properly configured
- [ ] Environment variables not committed to git

**Required `.env.production` variables:**
```env
VITE_FIREBASE_API_KEY=***
VITE_FIREBASE_AUTH_DOMAIN=***
VITE_FIREBASE_PROJECT_ID=***
VITE_FIREBASE_STORAGE_BUCKET=***
VITE_FIREBASE_MESSAGING_SENDER_ID=***
VITE_FIREBASE_APP_ID=***
VITE_FIREBASE_BUILD_NAME=vitalsedge-monitoring-system
REACT_APP_GEMINI_API_KEY=***
```

---

## 4. Firebase Preparation ✓

- [ ] Production Firebase project selected
- [ ] Firestore collections created:
  - `users`
  - `patients`
  - `vitals`
  - `anomalies`
  - `audit_logs`
  - `medical_records`
  - `rag_query_logs`
- [ ] Security rules deployed and tested
- [ ] Firestore indexes created for common queries
- [ ] Cloud Storage bucket configured
- [ ] Backup strategy in place

**Deploy security rules:**
```bash
firebase deploy --only firestore:rules,storage
```

---

## 5. Database & Data ✓

- [ ] Test data cleaned up (no mock patients)
- [ ] Database backup created
- [ ] Retention policies set (24-month medical data)
- [ ] Test users removed
- [ ] Audit trail initialized

**Backup command:**
```bash
firebase firestore:export gs://your-bucket/backup
```

---

## 6. Security & Compliance ✓

- [ ] HIPAA compliance verified:
  - [ ] Encryption at rest enabled
  - [ ] Encryption in transit (HTTPS only)
  - [ ] Access logs enabled
  - [ ] Audit trail configured
- [ ] Role-based access control working
- [ ] Sensitive data masked in logs
- [ ] GDPR compliance check (if EU users)
- [ ] Data retention policies documented

---

## 7. Performance & Optimization ✓

- [ ] Images optimized (< 100KB max)
- [ ] Fonts minified
- [ ] Code splitting configured
- [ ] Lazy loading enabled for routes
- [ ] Cache headers configured
- [ ] ServiceWorker for offline support
- [ ] Lighthouse score >= 90 (Performance section)

**Check Lighthouse:**
```bash
npm install -g lighthouse
lighthouse https://yourdomain.com --view
```

---

## 8. Testing & QA ✓

- [ ] All critical user flows tested
  - [ ] Login (Clinician)
  - [ ] Login (Patient)
  - [ ] View Patient Data
  - [ ] Query Medical Assistance
  - [ ] Upload Records
  - [ ] View Alerts
- [ ] Mobile responsiveness verified
  - [ ] iPhone (iOS)
  - [ ] Android devices
  - [ ] iPad/Tablets
- [ ] Cross-browser testing (Chrome, Safari, Firefox, Edge)
- [ ] Error handling tested
- [ ] Fallback UI displays correctly

---

## 9. Monitoring & Logging ✓

- [ ] Firebase Analytics enabled
- [ ] Error tracking configured (Sentry or similar)
- [ ] Performance monitoring set up
- [ ] Log retention policy set
- [ ] Alerts configured for:
  - [ ] High error rates (> 5%)
  - [ ] Slow response times (> 2s)
  - [ ] Quota exceeded
  - [ ] Unauthorized access attempts
- [ ] Dashboard created for key metrics

**Firebase Console Settings:**
- Authentication → Sign-in method → Enable required providers
- Firestore → Monitoring → Create alerts
- Storage → Monitoring → Quota alerts

---

## 10. Documentation ✓

- [ ] README.md updated with deployment info
- [ ] MEDICAL_RAG_INTEGRATION.md complete
- [ ] API documentation current
- [ ] Runbooks created for common issues
- [ ] Team trained on deployment
- [ ] Incident response plan documented

---

## 11. Infrastructure ✓

- [ ] SSL certificate valid and renewed
- [ ] DNS configured correctly
- [ ] CDN cache headers set
- [ ] Load balancing configured (if needed)
- [ ] Auto-scaling enabled
- [ ] Backup plan documented
- [ ] Disaster recovery tested

---

## 12. Final Pre-Deployment ✓

- [ ] All team members notified
- [ ] Maintenance window scheduled (if needed)
- [ ] Rollback plan documented
- [ ] Communication channel open during deployment
- [ ] Status page updated
- [ ] Customer notification drafted

---

## Deployment Commands

### Full automated deployment flow:

```bash
# 1. Run cleanup
chmod +x cleanup-before-deploy.sh
./cleanup-before-deploy.sh

# 2. Build production
pnpm run build

# 3. Deploy to Firebase Hosting
firebase deploy --only hosting

# 4. Deploy security rules (optional)
firebase deploy --only firestore:rules,storage

# 5. Verify deployment
firebase hosting:channel:list
```

### Alternative: Docker deployment

```bash
# Build Docker image
docker build -t vitalsedge:latest .

# Tag for registry
docker tag vitalsedge:latest gcr.io/PROJECT_ID/vitalsedge:latest

# Push to registry
docker push gcr.io/PROJECT_ID/vitalsedge:latest

# Deploy to Cloud Run
gcloud run deploy vitalsedge \
  --image gcr.io/PROJECT_ID/vitalsedge:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## Post-Deployment Verification

After deployment, immediately check:

```bash
# Check if site is accessible
curl -I https://yourdomain.com

# Verify login works
# Test clinician login flow manually

# Verify medical data loading
# Check RAG assistant functionality

# Monitor error logs
firebase functions:log --follow

# Check Firebase metrics
firebase use --add  # select production project
firebase functions:config:get  # verify config
```

---

## Rollback Procedure

If critical issues found post-deployment:

```bash
# Option 1: Previous Firebase Hosting release
firebase hosting:rollback

# Option 2: Docker - deploy previous image
docker pull gcr.io/PROJECT_ID/vitalsedge:previous
gcloud run deploy vitalsedge --image gcr.io/PROJECT_ID/vitalsedge:previous

# Option 3: Manual rollback (if needed)
git revert HEAD
pnpm run build
firebase deploy --only hosting
```

---

## Communication Template

**Email to stakeholders (Pre-deployment):**
```
Subject: VitalsEdge Deployment - [DATE] [TIME]

We will deploy VitalsEdge updates on [DATE] at [TIME] [TZ].

Expected downtime: [X minutes]
Expected completion: [X+10 minutes]

Features:
- Medical RAG assistant for querying patient history
- Enhanced profile picture upload
- Responsive design improvements
- Theme consistency across app

Contact: [TEAM] if issues arise during deployment.
```

---

## Troubleshooting Guide

| Issue | Cause | Resolution |
|-------|-------|-----------|
| TypeScript compile error | Code change not committed | Run cleanup script before build |
| Build fails | Missing dependencies | `pnpm install --frozen-lockfile` |
| Firebase auth fails | Config not loaded | Verify `.env.production` variables |
| Slow page load | Large bundle | Check CDN cache, enable code splitting |
| 500 errors | Cloud functions issue | Check `firebase functions:log` |

---

## Sign-off

- [ ] Code review completed: ______________________ Date: _______
- [ ] QA approval: ______________________ Date: _______
- [ ] Product approval: ______________________ Date: _______
- [ ] Deployment approved: ______________________ Date: _______

**Deployed by:** ______________________ **Date:** _______ **Time:** _______

---

**Last Updated:** April 2, 2026  
**Next Review:** After each major release
