---
name: deployer
description: >
  Full deployment assistant for projects using Supabase (database) + Vercel (hosting) + GitHub (version control).
  Use this skill whenever the user wants to: deploy their project to Vercel, connect a Supabase database to Vercel,
  push code changes to GitHub, update environment variables on Vercel, redeploy a Vercel project, rotate or update
  a Supabase password, set up their .env or .env.local file, or troubleshoot connection issues between Supabase and Vercel.
  Also trigger when the user says things like "I want to deploy", "push my changes", "update my env vars",
  "redeploy my project", "my database isn't connecting", or "I need to update my Supabase password on Vercel".
  This skill covers the FULL workflow end to end — from local code to live production URL.
---

# Vercel + Supabase + GitHub Deployment Skill

This skill guides the full deployment lifecycle for a project that uses:
- **Supabase** — PostgreSQL database (with connection strings, passwords, and project URLs)
- **Vercel** — Frontend/fullstack hosting (with environment variables and deployments)
- **GitHub** — Version control and CI/CD trigger

## The Core Workflow

### WORKFLOW A — Full Deploy (First Time or Major Update)

**Step 1: Prepare Local Code**
```bash
# Make sure you're in your project folder
cd your-project-name

# Check what changed
git status

# Stage everything
git add .

# Commit with a clear message
git commit -m "feat: describe what you changed"
```

**Step 2: Push to GitHub**
```bash
git push origin main
# or: git push origin master (if your branch is called master)
```
> If Vercel is connected to your GitHub repo, this automatically triggers a deployment.

**Step 3: Verify on Vercel**
- Go to [vercel.com/dashboard](https://vercel.com/dashboard)
- Click your project → "Deployments" tab
- Wait for ✅ "Ready" status
- Click the deployment URL to test it live

### WORKFLOW B — Update Environment Variables on Vercel

Use this when you:
- Changed your Supabase password
- Added a new API key
- Updated your database URL

**Step 1: Get your Supabase credentials**
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings → Database**
4. Scroll to **Connection String** → choose **URI** format
5. Copy the string — it looks like:
   `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres`
6. Replace `[YOUR-PASSWORD]` with your actual password

**Step 2: Update on Vercel**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click your project → **Settings** → **Environment Variables**
3. Find the variable you want to update (e.g. `DATABASE_URL`, `SUPABASE_URL`)
4. Click the **pencil/edit icon** → paste the new value → **Save**

**Step 3: Redeploy**
Vercel does NOT automatically redeploy on env var changes. You must trigger it via the **Deployments** tab by clicking the three dots `...` on the latest deployment and selecting **Redeploy**.

## Troubleshooting Common Problems

- **❌ "Environment variable not found" or DB connection fails after deploy**
  - Did you save the env var on Vercel?
  - Did you **redeploy** after saving? (Required)
  - Is the variable set for the right environment? (Production / Preview / Development)

- **❌ Vercel build fails after push**
  - Click the failed deployment in Vercel dashboard and read the **Build Logs**.
  - Check for missing env variables or lint errors.

## Reference Files

- [supabase-credentials-guide.md](references/supabase-credentials-guide.md) — Finding Supabase credentials
- [vercel-env-guide.md](references/vercel-env-guide.md) — Vercel environment variable management
