# App 4: Document Q&A (RAG)

Upload PDFs/documents. Background pipeline chunks, embeds, and stores vectors in pgvector. Ask questions, get grounded answers with source citations.

## Key AI pattern

RAG: chunking → embedding → vector search → grounded prompt assembly → streaming answer with citations. The chunking module (`packages/common/chunker/`) is reused in apps 5 and 7.

## Stack

- Monorepo: `packages/api`, `packages/worker`, `packages/web`, `packages/common`
- Next.js on Vercel, Express + BullMQ worker on Railway
- PostgreSQL + pgvector on Neon, Redis on Railway
- Cloudflare R2 for document storage
- Voyage AI or OpenAI for embeddings, Anthropic Claude for completions

## Spec

Read `FULL_APPLICATION_SPEC.md` for full system design, DB schema, and task breakdown.

## Build order

POC → upload one PDF, process it, ask one question, get streaming answer with a citation → then pipeline robustness → then frontend polish.

## Shared convention files

Read the relevant file in `.claude/bottomlessmargaritas/` **before writing code** in that layer:

- **Backend:** `.claude/bottomlessmargaritas/CLAUDE-BACKEND.md`
- **Frontend:** `.claude/bottomlessmargaritas/CLAUDE-FRONTEND.md`
- **Database:** `.claude/bottomlessmargaritas/CLAUDE-DATABASE.md`
- **Styling:** `.claude/bottomlessmargaritas/CLAUDE-STYLING.md`
- **Deployment:** `.claude/bottomlessmargaritas/CLOUD-DEPLOYMENT.md`
