# Cloudflare R2 Runbook

PolicyPilot stores uploaded documents in a Cloudflare R2 bucket via the S3-compatible API. This runbook covers the one-time setup, the exact env vars, and verification.

## What R2 is used for

The server uploads documents to R2 (`apps/server/src/services/r2.service.ts`) and the worker downloads them for processing (`apps/worker/src/services/r2.service.ts`). Both build their own S3 client, so both services need the same credentials. The `web` (client) service does not touch R2.

Operations performed: `PutObject`, `GetObject`, `DeleteObject`, `HeadBucket` (the `/health/ready` check). No bucket management, no presigned URLs handed to the browser, so no bucket CORS rule is required.

## Token model (read this first)

Cloudflare has two unrelated token systems. PolicyPilot needs only the second one.

- **Account / zone API tokens** (My Profile > API Tokens): for DNS, Workers, Pages. **Not used by this app.**
- **R2 API tokens** (R2 > Manage R2 API Tokens): produce an S3-style Access Key ID + Secret Access Key. **This is what the app uses.**

Use one R2 API token scoped to this app's bucket only (Object Read & Write). Do not reuse a token that also grants access to other buckets.

## Environment variables

Set these four on both the `server` and `worker` services (Railway in prod, `.env` files locally):

| Var                    | Value                                                                   |
| ---------------------- | ----------------------------------------------------------------------- |
| `R2_ENDPOINT`          | `https://<account-id>.r2.cloudflarestorage.com` (no bucket in the path) |
| `R2_ACCESS_KEY_ID`     | Access Key ID from the R2 API token                                     |
| `R2_SECRET_ACCESS_KEY` | Secret Access Key from the R2 API token                                 |
| `R2_BUCKET_NAME`       | `doc-qa-rag`                                                            |

The client uses `region: 'auto'` (hardcoded). `R2_ACCOUNT_ID` is not read by code; only the full `R2_ENDPOINT` is.

## One-time setup

1. **Bucket.** The bucket `doc-qa-rag` already exists (legacy default name, retained). If recreating from scratch: R2 > Create bucket, name it `doc-qa-rag`, Location Automatic.
2. **Create a scoped R2 API token.** R2 > Manage R2 API Tokens > Create API Token.
   - Permissions: **Object Read & Write**.
   - Specify bucket: **Apply to specific buckets** > `doc-qa-rag`.
   - Create. Copy the **Access Key ID** and **Secret Access Key** immediately (the secret is shown once).
3. **Get the endpoint.** The token page (and the R2 overview) shows the S3 API endpoint `https://<account-id>.r2.cloudflarestorage.com`. Use this as `R2_ENDPOINT`.
4. **Set the four vars** on the `server` and `worker` services in Railway, and in `apps/server/.env` and `apps/worker/.env` for local dev.

## Verify

The API exposes `GET /health/ready` (`apps/server/src/app.ts`), which runs a `HeadBucket` against R2:

- `{"status":"ok","db":"connected","r2":"connected"}` (200): working.
- `"r2":"disconnected"` (503): endpoint, credentials, or bucket name is wrong.

Local: `curl localhost:3001/health/ready`. Prod: hit `/health/ready` on the API service URL.

## Troubleshooting

| Symptom                                | Cause                                                                                        |
| -------------------------------------- | -------------------------------------------------------------------------------------------- |
| `r2: disconnected` but env looks right | Endpoint includes the bucket name in the path (it should not), or bucket name mismatch       |
| 403 / `Access Denied` on upload        | Token not scoped to `doc-qa-rag`, or permission is Read-only                                 |
| `r2: disconnected` while uploads work  | `HeadBucket` blocked by token scope; confirm the token is Object Read & Write on this bucket |
| Worker fails to download               | Worker service missing one of the four vars (set separately from the server)                 |

## Rotation

1. Create a new R2 API token scoped to `doc-qa-rag`.
2. Update `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` on both services.
3. Confirm `/health/ready` is green, then delete the old token.
