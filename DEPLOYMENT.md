# GridGuard Deployment Guide

This document provides step-by-step instructions for deploying GridGuard to production using Vercel (frontend) and Railway (backend).

---

## Pre-Deployment Checklist

Before deploying, verify everything works locally:

- [ ] Frontend builds without errors: `npm run build`
- [ ] Backend starts without errors: `uvicorn main:app --reload`
- [ ] Database migrations run successfully: `python migrate.py`
- [ ] Test data seeds correctly: `python seed_transformers.py`
- [ ] API endpoints respond: `python test_all_endpoints.py`
- [ ] AI summary endpoint works: `python test_ai_summary.py`
- [ ] All environment variables are documented in `.env.example`

---

## 1. Set Up Supabase Project

### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Sign in or create account
3. Click "New Project"
4. Fill in:
   - Project name: `gridguard`
   - Database password: (choose strong password)
   - Region: (choose closest region)
5. Wait for project to initialize (2-3 minutes)

### Step 2: Get Credentials

From Supabase Dashboard:

1. **Project URL** → Settings > API
   - Copy: `SUPABASE_URL`

2. **Service Role Key** → Settings > API
   - Copy: `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ **Keep this secret!** Never commit to repo.

3. **Anon Key** → Settings > API
   - Copy: `VITE_SUPABASE_ANON_KEY`
   - This is safe to expose in frontend

4. **JWT Secret** → Settings > API > JWT Settings
   - Copy: `SUPABASE_JWT_SECRET`

5. **Database Connection String** → Settings > Database
   - Copy URI format (not psql): `DATABASE_URL`

### Step 3: Enable Auth (Optional, if using Supabase Auth)

1. In Supabase Dashboard → Authentication
2. Enable desired auth methods (Email/Password, Google OAuth, etc.)
3. Configure email templates if needed

### Step 4: Run Migrations

Connect to your Supabase database and run:

```bash
cd backend
export DATABASE_URL="your-connection-string-here"
python migrate.py
python seed_transformers.py
```

Verify tables are created:
- `public.users`
- `public.transformers`
- `public.telemetry`
- `public.alerts`

---

## 2. Get Anthropic API Key (Optional, for Real AI Summaries)

1. Go to https://console.anthropic.com
2. Sign in to Anthropic account
3. Navigate to "API Keys"
4. Click "Create Key"
5. Copy the key (starts with `sk-ant-`)
6. Save to password manager (can't retrieve later)

**Note:** This is optional. The backend has a graceful fallback if the API key is missing.

---

## 3. Deploy Backend to Railway

### Prerequisites

- Railway account (https://railway.app)
- GitHub repository with GridGuard code
- All backend environment variables ready

### Step 1: Create Railway Project

1. Go to https://railway.app
2. Click "New Project"
3. Choose "Deploy from GitHub"
4. Select GridGuard repository

### Step 2: Configure Environment Variables

In Railway Dashboard:

1. Click on the project
2. Go to "Variables"
3. Add each variable from `.env`:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_JWT_SECRET=your-jwt-secret
DATABASE_URL=postgresql://postgres:password@...
CLAUDE_API_KEY=sk-ant-...
```

### Step 3: Configure Build & Deploy Settings

In Railway Settings:

1. **Root Directory:** `backend`
2. **Start Command:** (Leave blank — Railway auto-detects Procfile)
3. **Build Command:** (Leave blank — Railway auto-detects Python)

### Step 4: Deploy

1. Railway automatically detects changes to GitHub
2. Click "Deploy" or push to `main` branch
3. Watch deployment logs
4. Once deployed, Railway shows your backend URL: `https://your-railway-app.railway.app`

### Step 5: Verify Deployment

Test the live backend:

```bash
curl https://your-railway-app.railway.app/transformers \
  -H "Authorization: Bearer <your-jwt-token>"
```

Or check API docs: `https://your-railway-app.railway.app/docs`

---

## 4. Deploy Frontend to Vercel

### Prerequisites

- Vercel account (https://vercel.com)
- GitHub repository with GridGuard code
- Backend URL from Railway (e.g., `https://your-railway-app.railway.app`)

### Step 1: Connect GitHub to Vercel

1. Go to https://vercel.com
2. Click "New Project"
3. Select GridGuard repository from GitHub
4. Vercel auto-detects Vite configuration

### Step 2: Configure Build Settings

In Vercel Settings:

1. **Framework:** Vite
2. **Build Command:** `npm run build`
3. **Output Directory:** `frontend/dist`
4. **Root Directory:** (Leave blank — auto-detected)

### Step 3: Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

**Note:** These are safe to expose in frontend code (Supabase anon key has read-only access).

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Vercel shows deployment status and URL: `https://your-project.vercel.app`

### Step 5: Update Frontend API Client

After backend is deployed, update the frontend to use the production backend URL:

**File:** `frontend/src/services/api.ts` (or wherever API client is defined)

```typescript
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-railway-app.railway.app'
  : 'http://localhost:8000'
```

Then push to GitHub:

```bash
git add .
git commit -m "chore: update API endpoint for production"
git push origin main
```

Vercel automatically redeploys on push.

---

## 5. Post-Deployment Verification

### Frontend (Vercel)

- [ ] App loads at https://your-project.vercel.app
- [ ] Login page appears
- [ ] No console errors in browser DevTools

### Backend (Railway)

- [ ] API docs available at https://your-railway-app.railway.app/docs
- [ ] GET /transformers returns 200 OK
- [ ] POST /alerts/{id}/evaluate returns valid response
- [ ] POST /alerts/{id}/ai-summary returns AI summary

### End-to-End

- [ ] Log in with Supabase credentials
- [ ] Dashboard loads with transformers
- [ ] Can view transformer details
- [ ] Can generate AI summaries for critical alerts
- [ ] No network errors in browser console

### Database

- [ ] Data persists after backend restarts
- [ ] New alerts are saved and retrievable
- [ ] Telemetry updates are stored

---

## 6. Monitoring & Troubleshooting

### Backend Logs (Railway)

In Railway Dashboard:

1. Click on the backend service
2. Go to "Logs"
3. Watch for errors and warnings

Common issues:
```
ERROR: DATABASE_URL not configured
  → Add DATABASE_URL to Railway environment variables

ERROR: CLAUDE_API_KEY invalid
  → Check API key format (should start with sk-ant-)
  → Or leave empty for fallback mode

ERROR: Connection refused
  → Check SUPABASE_URL is correct
  → Verify database is running in Supabase
```

### Frontend Logs (Vercel)

In Vercel Dashboard:

1. Click on the project
2. Go to "Deployments"
3. Click on latest deployment
4. View build/deployment logs

Common issues:
```
ERROR: Cannot find module '@supabase/supabase-js'
  → Run npm install before deploying

ERROR: VITE_SUPABASE_URL is undefined
  → Add environment variables to Vercel Settings
  → Redeploy after setting variables
```

### Browser Console

Open browser DevTools (F12) and check:
- [ ] No 401/403 errors (authentication issues)
- [ ] No 404 errors (missing API endpoints)
- [ ] No CORS errors (cross-origin issues)
- [ ] Network tab shows successful API calls

---

## 7. Domain Setup (Optional)

### Connect Custom Domain to Vercel

1. In Vercel Dashboard → Settings → Domains
2. Add your custom domain (e.g., `gridguard.example.com`)
3. Follow Vercel's instructions to point your DNS registrar

### Connect Custom Domain to Railway (Optional)

Railway supports custom domains via paid plan.

---

## 8. Maintenance

### Regular Tasks

- [ ] Monitor Railway logs for errors
- [ ] Check Vercel deployment status
- [ ] Review Supabase quota usage
- [ ] Update Claude API limits if needed

### Database Backups

Supabase automatically backs up data. To manually export:

1. Supabase Dashboard → Backups
2. Download backup or restore from snapshot

### Updating Code

To deploy changes:

```bash
# Make changes locally
git add .
git commit -m "feat: add new feature"
git push origin main

# Vercel & Railway auto-detect push and redeploy
```

---

## 9. Rollback & Emergency

### If Deployment Fails

**Backend (Railway):**
1. Go to Railway Dashboard
2. Click "Deployments" tab
3. Find previous successful deployment
4. Click "Revert to this deployment"

**Frontend (Vercel):**
1. Go to Vercel Dashboard → Deployments
2. Find previous successful build
3. Click "..." → "Promote to Production"

### If Database is Corrupted

1. In Supabase Dashboard → Backups
2. Restore from previous snapshot
3. Run migrations: `python migrate.py`
4. Reseed data if needed: `python seed_transformers.py`

---

## Deployment Checklist Summary

```bash
# Local verification
[ ] npm run build (frontend)
[ ] uvicorn main:app (backend)
[ ] python migrate.py (database)
[ ] python test_all_endpoints.py (API tests)

# Supabase setup
[ ] Create project
[ ] Get credentials (4: URL, Key, JWT Secret, DB Connection)
[ ] Run migrations
[ ] Verify tables exist

# Claude API (optional)
[ ] Create account at console.anthropic.com
[ ] Get API key
[ ] Store securely in password manager

# Railway (backend)
[ ] Create project
[ ] Connect to GitHub
[ ] Set environment variables (5: SUPABASE_*, CLAUDE_*)
[ ] Deploy
[ ] Verify with curl/API docs

# Vercel (frontend)
[ ] Create project
[ ] Connect to GitHub
[ ] Set environment variables (2: VITE_SUPABASE_*)
[ ] Update frontend API endpoint for production
[ ] Deploy
[ ] Verify loads in browser

# Post-deployment
[ ] Test login
[ ] Check dashboard
[ ] View transformer details
[ ] Generate AI summary
[ ] Monitor logs for errors
```

---

## Support

If deployment fails:

1. Check logs in Railway/Vercel dashboards
2. Verify all environment variables are set correctly
3. Ensure Supabase database is running
4. Test locally first to isolate issues
5. Review README.md troubleshooting section

---

**GridGuard is now running in production! 🎉**
