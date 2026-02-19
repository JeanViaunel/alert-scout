# 🚀 Vercel Production Deployment Guide

Complete guide for deploying Alert Scout to Vercel with GitHub integration.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Migration Strategy](#database-migration-strategy)
3. [Vercel Project Setup](#vercel-project-setup)
4. [GitHub Secrets Configuration](#github-secrets-configuration)
5. [Environment Variables](#environment-variables)
6. [Deployment Workflows](#deployment-workflows)
7. [Post-Deployment Checklist](#post-deployment-checklist)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Node.js 20+
- Vercel account (Pro recommended for production)
- GitHub repository connected to Vercel
- Database service (see options below)
- Redis service (Upstash recommended)

---

## Database Migration Strategy

### ⚠️ Critical: SQLite Limitations on Vercel

Your app currently uses `better-sqlite3` with a local SQLite file. **This won't work on Vercel's serverless platform** because:

1. Functions are stateless - data is lost on each invocation
2. No shared filesystem between function instances
3. 50MB function size limit

### Recommended Migration Options

#### Option 1: Vercel Postgres (Easiest)

```bash
# 1. Install Vercel Postgres
npm install @vercel/postgres

# 2. Create database in Vercel Dashboard
# Storage → Postgres → Create

# 3. Update lib/db.ts to use @vercel/postgres
```

**Pros:** Native Vercel integration, connection pooling included  
**Cons:** Vendor lock-in, requires schema migration

#### Option 2: Turso (SQLite-Compatible)

```bash
# 1. Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# 2. Create database
turso auth login
turso db create alert-scout

# 3. Install client
npm install @libsql/client

# 4. Update lib/db.ts
```

**Pros:** SQLite-compatible (minimal code changes), edge-distributed  
**Cons:** Slightly different SQL dialect

#### Option 3: PlanetScale (MySQL)

```bash
# 1. Sign up at planetscale.com
# 2. Create database
# 3. Install Prisma (recommended) or mysql2
npm install @prisma/client prisma
```

**Pros:** Branching per deploy preview, excellent DX  
**Cons:** Requires ORM migration

#### Option 4: Docker/Standalone (Keep SQLite)

If you want to keep SQLite, deploy as a standalone container:

```bash
# Build standalone output
DEPLOYMENT_TYPE=docker npm run build

# Deploy to Railway, Fly.io, or VPS with persistent volume
```

### Migration Script Example (Turso)

```typescript
// scripts/migrate-to-turso.ts
import { createClient } from '@libsql/client';
import Database from 'better-sqlite3';

async function migrate() {
  const sqlite = new Database('./data/app.db');
  const turso = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  // Export SQLite schema and data
  const tables = sqlite.prepare(
    "SELECT name FROM sqlite_master WHERE type='table'"
  ).all();

  for (const { name } of tables) {
    const rows = sqlite.prepare(`SELECT * FROM ${name}`).all();
    for (const row of rows) {
      const columns = Object.keys(row);
      const values = Object.values(row);
      const placeholders = values.map(() => '?').join(',');
      
      await turso.execute({
        sql: `INSERT INTO ${name} (${columns.join(',')}) VALUES (${placeholders})`,
        args: values,
      });
    }
  }
}
```

---

## Vercel Project Setup

### 1. Create New Project

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project (run in repo root)
vercel link
```

### 2. Configure Build Settings

In Vercel Dashboard → Project Settings:

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js |
| Build Command | `npm run build` |
| Output Directory | `.next` |
| Install Command | `npm ci` |
| Node Version | `20.x` |

### 3. Configure Git Integration

Settings → Git:

- **Production Branch:** `main`
- **Deploy Hooks:** Create for external CI/CD
- **Ignored Build Step:** Enable "Don't build if no changes"

### 4. Configure Domains

Settings → Domains:

1. Add your custom domain
2. Configure DNS (A record → 76.76.21.21, CNAME → cname.vercel-dns.com)
3. Enable SSL (automatic)

### 5. Configure Functions

Settings → Functions:

| Setting | Recommended Value |
|---------|-------------------|
| Function Region | `iad1` (US East) or closest to your users |
| Function Max Duration | 60s (for scraping) |
| Memory | 1024 MB |

---

## GitHub Secrets Configuration

Add these secrets in GitHub → Settings → Secrets and variables → Actions:

### Required Secrets

| Secret | Description | How to Get |
|--------|-------------|------------|
| `VERCEL_TOKEN` | Vercel API token | Vercel Dashboard → Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel Organization ID | Run `vercel team list` or in .vercel/project.json |
| `VERCEL_PROJECT_ID` | Vercel Project ID | Run `vercel project list` or in .vercel/project.json |

### Optional Secrets (Monitoring)

| Secret | Description |
|--------|-------------|
| `SENTRY_AUTH_TOKEN` | Error tracking |
| `SENTRY_ORG` | Sentry organization |
| `SENTRY_PROJECT` | Sentry project name |

### Getting Vercel IDs

```bash
# After running vercel link, check:
cat .vercel/project.json

# Or get from Vercel CLI
vercel project list
vercel team list
```

---

## Environment Variables

### Production Environment

Add in Vercel Dashboard → Settings → Environment Variables:

#### Required

```
JWT_SECRET=<generate: openssl rand -base64 32>
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

#### Database (Choose One)

**Vercel Postgres:**
```
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_HOST=
POSTGRES_DATABASE=
```

**Turso:**
```
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
```

#### Redis (Upstash)

```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### Environment-Specific Variables

| Variable | Production | Preview | Development |
|----------|------------|---------|-------------|
| `DATABASE_URL` | Production DB | Preview DB | ./data/app.db |
| `JWT_SECRET` | Strong secret | Different secret | dev-secret |
| `NEXT_PUBLIC_APP_URL` | https://prod.com | https://preview.vercel.app | http://localhost:3000 |

---

## Deployment Workflows

### Automatic Deployments

| Trigger | Environment | Branch |
|---------|-------------|--------|
| Push to `main` | Production | main |
| Pull Request | Preview | PR branch |
| Push to `staging` | Preview (staging) | staging |

### Manual Deployment

```bash
# Production
vercel --prod

# Preview
vercel

# With specific env
vercel --prod -e KEY=value
```

### GitHub Actions Flow

```
Pull Request Created
        ↓
  ┌─────────────┐
  │  CI Checks  │ (lint, typecheck, build)
  └─────────────┘
        ↓
  ┌─────────────┐
  │ Deploy to   │ (creates preview URL)
  │   Preview   │
  └─────────────┘
        ↓
  PR Comment with URL

Merge to main
        ↓
  ┌─────────────┐
  │  CI Checks  │
  └─────────────┘
        ↓
  ┌─────────────┐
  │ Deploy to   │
  │ Production  │
  └─────────────┘
```

---

## Post-Deployment Checklist

### Functional Tests

- [ ] Homepage loads
- [ ] Login works
- [ ] Registration works
- [ ] Create alert works
- [ ] Scraper runs without errors
- [ ] Notifications display
- [ ] Map loads correctly

### Performance Checks

```bash
# Run Lighthouse
npx lighthouse https://yourdomain.com --view

# Check Core Web Vitals in Vercel Analytics
```

### Security Verification

- [ ] HTTPS enforced
- [ ] Security headers present (check at securityheaders.com)
- [ ] JWT secret is strong
- [ ] Environment variables not exposed in client

### Monitoring Setup

- [ ] Vercel Analytics enabled
- [ ] Error tracking (Sentry) configured
- [ ] Uptime monitoring (Pingdom/UptimeRobot)
- [ ] Log drains configured (if needed)

---

## Troubleshooting

### Build Failures

```bash
# Check build logs in Vercel Dashboard

# Common issues:
# 1. better-sqlite3 native module
# Solution: Add to next.config.js externals

# 2. Playwright browser download
# Solution: Skip in build
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# 3. Node version mismatch
# Solution: Set in package.json
"engines": { "node": ">=20.0.0" }
```

### Runtime Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `better-sqlite3` not found | Missing native bindings | Use serverless database instead |
| `Cannot find module` | Missing dependency | Check imports, run `npm ci` |
| `Function invocations timeout` | Scraping too slow | Increase maxDuration, optimize scrapers |
| `Redis connection failed` | Invalid Redis URL | Check UPSTASH_REDIS_REST_URL |

### Database Connection Issues

```bash
# Test connection locally
npx @vercel/postgres@latest db pull  # For Vercel Postgres

# Or with Turso
turso db shell your-db "SELECT 1"
```

---

## Best Practices

### 1. Preview Deployments

- Each PR gets its own URL
- Use preview databases to avoid polluting production
- Share preview URLs for stakeholder review

### 2. Environment Isolation

```
Production  → Production DB + Redis
Preview     → Preview DB + Redis prefix
Development → Local SQLite + Local Redis
```

### 3. Secrets Management

- Never commit `.env` files
- Rotate secrets regularly
- Use different secrets for each environment
- Enable "Secret Scanning" in GitHub

### 4. Monitoring

- Set up alerts for 5xx errors
- Monitor function duration
- Track database connections
- Use Vercel Analytics for Web Vitals

### 5. Backup Strategy

```bash
# For Turso
turso db dump your-db > backup.sql

# For Vercel Postgres
# Use Vercel's automated backups

# Schedule in GitHub Actions
```

---

## Useful Commands

```bash
# Local production build test
npm run build && npm start

# Vercel CLI
vercel dev          # Local dev with Vercel env
vercel --prod       # Deploy to production
vercel env ls       # List env variables
vercel logs         # View logs

# Database
npx prisma migrate deploy  # Run migrations
npx prisma studio          # Open DB GUI
```

---

## Support & Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Turso Documentation](https://docs.turso.tech)
- [Upstash Redis](https://docs.upstash.com/redis)

---

*Last updated: 2024*
