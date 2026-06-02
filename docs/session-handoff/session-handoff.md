# Session Handoff

## 1. Last commit

`b774376` chore: remove bottomlessmargaritas tooling, deps, and unused DocBar
(local `main` == `origin/main`, clean tree)

## 2. Production state

Live on Railway project `policy-pilot` (workspace "Ian Greenough's Projects"), all services SUCCESS at `b774376`:

- **web**: `https://policy-pilot.iangreenoughdeveloper.com` (Cloudflare-proxied, cert VALID) and `https://web-production-48486.up.railway.app` (`Dockerfile.web`, Next standalone)
- **server**: `https://server-production-c183.up.railway.app` (`Dockerfile.server`); `/health` 200, `/health/ready` -> `db + r2 connected`
- **worker**: `Dockerfile.worker`, Redis-connected
- **redis**: `Redis-o5eF` (the one in use)
- DB: reused Neon (doc-qa-rag). R2 bucket: reused `doc-qa-rag`.
- GitHub Actions on `b774376`: CI success, Post-Deploy Health Check success.
- Full RAG smoke verified end-to-end on the shipped commit (upload -> process -> retrieve -> cited streaming answer).

## 3. What shipped

- Monorepo restructured to Voyager layout: `apps/server`, `apps/worker`, `apps/client/web`, `packages/common` (pnpm-workspace, eslint project paths, next tracing roots, playwright/CI/smoke working dirs, seed-script paths, lockfile importer keys).
- Railway-only Docker: `Dockerfile.server`/`.worker` path fixes, new `Dockerfile.web` (standalone), `.dockerignore`; removed duplicate `Dockerfile` and Vercel config.
- Per-service Railway config via API (`dockerfilePath`, `healthcheckPath`); `railway.toml` holds only restart policy (a `dockerfilePath` there overrides per-service settings).
- 4 services provisioned; secrets piped from `.env`; custom domain + Cloudflare CNAME + `_railway-verify` TXT.
- Lint/format configs renamed to standard names. (Parallel session removed the `bottomlessmargaritas` codename entirely + added an R2 runbook.)

## 4. Pending (by urgency)

- **Low / 2 min (dashboard):** delete 3 unused Redis services `Redis`, `Redis-qQFt`, `Redis-1yhH` (CLI cannot delete services).
- **Low / 1 min:** update `apps/server/.env` `ANTHROPIC_API_KEY` to the working key for local dev (the file still has the revoked key).
- **Security / now:** rotate the Anthropic key and Cloudflare token (both pasted in chat in plaintext).
- **Optional / 30 min:** split `railway.toml` into `railway.server.toml` etc. per service (see `ISSUES.md`).

## 5. Next session

- Read `ISSUES.md` (deploy follow-ups, railway.server.toml plan) and `.claude/bottomlessmargaritas/CLOUD-DEPLOYMENT.md`.
- Railway custom-domain gotchas (cost hours this session): domains need a `_railway-verify.<sub>` TXT record (API `verificationToken`, not in the visible DNS list); keep DNS-only until cert `certificateStatus` is `VALID`, then enable Cloudflare proxy; Railway GraphQL writes need a non-default `User-Agent` (Cloudflare WAF 403s `python-urllib`).
- Railway env-var changes need a redeploy to take effect on the running instance.
