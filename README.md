# VitalsEdge Monitoring

React + Vite clinician portal with Firebase Auth and Firestore. Local development targets the Firebase emulators.

## Setup

```bash
pnpm install
cp .env.example .env   # fill VITE_* values for your Firebase project
```

Optional: comma-separated `VITE_ADMIN_EMAILS` in `.env` grants the `ADMIN` role for those accounts.

## Run the app (with emulators)

1. Start Auth (9099) and Firestore (8080), for example:

   ```bash
   firebase emulators:start --only auth,firestore --project=vitalsedge-monitoring-system
   ```

   Or use `pnpm run emulators` / `./emulators-start.sh` if that matches your workflow.

2. Start the frontend:

   ```bash
   pnpm run dev:frontend
   ```

The app connects to emulators when opened from `http://localhost:5173` or `http://127.0.0.1:5173` in dev mode.

## End-to-end tests (Playwright)

Requires the same Auth + Firestore emulators running. Playwright starts Vite automatically unless a server is already listening.

```bash
pnpm run test:e2e:install   # once: install Chromium
pnpm run test:e2e
```

The doctor registration spec creates an account and asserts navigation to the clinician dashboard.

## Other scripts

| Script | Purpose |
|--------|---------|
| `pnpm run build` | Production build |
| `pnpm run test` | Vitest unit tests |
| `pnpm run lint` | `tsc --noEmit` |
