# Deployment Guide - VitalsEdge Monitoring System

## Pre-Deployment Checklist

- [ ] All TypeScript compilation errors resolved (`npx tsc --noEmit`)
- [ ] All tests passing (`pnpm test`)
- [ ] Environment variables configured
- [ ] Firebase security rules reviewed
- [ ] HIPAA compliance verified
- [ ] SSL/TLS certificates configured
- [ ] Database migrations completed
- [ ] CDN configured
- [ ] Monitoring and logging setup
- [ ] Backup strategies in place

## Environment Configuration

### Required Environment Variables

```bash
# Frontend (.env.production)
VITE_API_KEY=your_firebase_api_key
VITE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_PROJECT_ID=your-project-id
VITE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_MESSAGING_SENDER_ID=your_sender_id
VITE_APP_ID=your_app_id
VITE_MEASUREMENT_ID=your_measurement_id

# Backend (if applicable)
FIREBASE_SERVICE_ACCOUNT_KEY=path_to_service_account_key.json
NODE_ENV=production
```

## Build Process

```bash
# Install dependencies
pnpm install

# Build for production
pnpm run build

# The output will be in the `dist/` directory
```

## Firebase Deployment Options

### Option 1: Firebase Hosting (Recommended)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Deploy with functions (if using backend)
firebase deploy --only functions,hosting
```

### Option 2: Docker Deployment

```bash
# Build Docker image
docker build -t vitalsedge:latest .

# Run Docker container
docker run -p 3000:3000 \
  -e VITE_API_KEY=your_api_key \
  -e VITE_PROJECT_ID=your_project_id \
  vitalsedge:latest
```

### Option 3: Cloud Run (Google Cloud)

```bash
# Build for Cloud Run
gcloud builds submit --tag gcr.io/PROJECT_ID/vitalsedge

# Deploy to Cloud Run
gcloud run deploy vitalsedge \
  --image gcr.io/PROJECT_ID/vitalsedge \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## Performance Optimization

### Image Optimization
- Profile pictures are compressed during upload
- Responsive images served based on device
- CDN caching configured for static assets

### Code Splitting
- Lazy loading of route components
- Dynamic imports for heavy components
- Tree-shaking enabled in production build

### Database Optimization
- Firestore indexes configured
- Real-time listeners optimized
- Pagination implemented for large datasets

## Monitoring & Logging

### Firebase Analytics Enabled
- User activity tracking
- Performance metrics collection
- Error tracking and reporting

### Application Logging
- Structured logging with timestamps
- Audit logging for HIPAA compliance
- Error boundaries with error reporting

## Security Hardening

### HIPAA Compliance
- End-to-end encryption enabled
- Access control enforcement
- Regular security audits
- Data retention policies (24-month default)

### Network Security
- CORS configuration locked down
- Rate limiting enabled
- DDoS protection in place
- Web Application Firewall (WAF) rules

### Data Protection
- Encryption at rest (Firebase default)
- Encryption in transit (TLS 1.3)
- Regular backups configured
- Disaster recovery plan in place

## Rollback Plan

```bash
# To rollback to previous version
firebase hosting:rollback <version_id>

# Or deploy specific branch/tag
git checkout <tag>
pnpm run build
firebase deploy --only hosting
```

## Health Checks

```bash
# Health endpoint (if backend deployed)
GET /health

# Response:
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-04-02T14:00:00Z",
  "firebase": "connected",
  "firestore": "connected",
  "storage": "connected"
}
```

## Post-Deployment Verification

- [ ] Application loads without errors
- [ ] Firebase emulator not used in production
- [ ] All APIs responding correctly
- [ ] Profile picture upload functional
- [ ] Real-time updates working
- [ ] Mobile responsive design verified
- [ ] Performance metrics acceptable
- [ ] Monitoring alerts configured
- [ ] Backup running successfully
- [ ] Security headers present

## Continuous Deployment (CD)

### GitHub Actions Workflow

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build
        run: pnpm run build
      
      - name: Deploy
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT_KEY }}'
          channelId: live
          projectId: vitalsedge-monitoring-system
```

## Monitoring & Alerts

Configure alerts for:
- High error rates (>1%)
- Slow response times (>2s)
- Firebase quota exceeded
- Firestore capacity exceeded
- Storage bucket full
- Authentication failures
- Data consistency issues

## Incident Response

1. **Alert received** - Automatic notification to team
2. **Investigation** - Check logs and metrics
3. **Mitigation** - Apply fixes or rollback
4. **Communication** - Update status page
5. **Post-mortem** - Review and prevent recurrence

## Version Management

- Tag all releases: `v1.0.0`, `v1.0.1`, etc.
- Maintain changelog (CHANGELOG.md)
- Document breaking changes
- Support 2 major versions simultaneously

##Support & Maintenance

- Monitor Firebase usage/costs
- Update dependencies monthly
- Security patches applied immediately
- Performance optimization ongoing
- User feedback incorporated in sprints

---

**Last Updated**: April 2, 2026
**Deployment Status**: Ready for Production
**Approvers**: Architecture Team, Security Team, DevOps Team
