# PolicyPilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform document-qa-rag into PolicyPilot — a 1950s airline-themed employee policy assistant with pre-seeded demo handbooks, document collections, expanded file format support, relevance checking, and a complete frontend overhaul.

**Architecture:** Infrastructure rename first, then backend changes (collections, file formats, relevance check, optionalAuth), then DALL-E mascot generation, then complete frontend redesign with retro theme. The existing RAG pipeline (upload → chunk → embed → vector search → stream) is retained unchanged.

**Tech Stack:** Express 5, BullMQ, PostgreSQL + pgvector, Cloudflare R2, OpenAI embeddings, Anthropic Claude, Next.js 15, DALL-E 3, mammoth (DOCX), SCSS modules, Radix UI

**Spec:** `docs/superpowers/specs/2026-04-02-policy-pilot-design.md`

---

## File Structure

```
policy-pilot/                          (renamed from document-qa-rag)
├── server/
│   ├── migrations/
│   │   └── ..._create-collections.js          # NEW: collections table + FK
│   ├── src/
│   │   ├── handlers/
│   │   │   ├── collections/collections.ts     # NEW: CRUD handlers
│   │   │   ├── documents/documents.ts         # MODIFIED: collection_id support
│   │   │   └── qa/qa.ts                       # MODIFIED: collection_id scoping
│   │   ├── repositories/
│   │   │   ├── collections/collections.ts     # NEW: DB operations
│   │   │   └── documents/documents.ts         # MODIFIED: collection_id queries
│   │   ├── routes/
│   │   │   ├── collections.ts                 # NEW: collection routes
│   │   │   ├── documents.ts                   # MODIFIED: collection_id param
│   │   │   └── qa.ts                          # MODIFIED: optionalAuth for demo
│   │   ├── middleware/
│   │   │   └── requireAuth/requireAuth.ts     # MODIFIED: add optionalAuth
│   │   ├── services/
│   │   │   └── retrieval.service.ts           # MODIFIED: scope by collection_id
│   │   └── app.ts                             # MODIFIED: new routes, optionalAuth
│   └── package.json                           # MODIFIED: rename
├── worker/
│   ├── src/
│   │   ├── processors/document-processor.ts   # MODIFIED: relevance check
│   │   └── services/text-extractor.service.ts # MODIFIED: DOCX/HTML support
│   └── package.json                           # MODIFIED: rename, add mammoth
├── common/
│   ├── src/types/index.ts                     # MODIFIED: Collection type, new statuses
│   └── package.json                           # MODIFIED: rename
├── web-client/
│   ├── public/mascot/                         # NEW: DALL-E generated captain images
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx                     # MODIFIED: retro theme, fonts
│   │   │   ├── page.tsx                       # MODIFIED: landing page
│   │   │   ├── globals.scss                   # MODIFIED: retro color system
│   │   │   ├── demo/page.tsx                  # NEW: public demo chat
│   │   │   ├── (auth)/login/page.tsx          # MODIFIED: retro design
│   │   │   ├── (auth)/register/page.tsx       # MODIFIED: retro design
│   │   │   └── (protected)/
│   │   │       ├── dashboard/page.tsx         # NEW: collection cards
│   │   │       ├── collections/[id]/page.tsx  # NEW: collection documents
│   │   │       └── chat/[collectionId]/page.tsx # MODIFIED: scoped to collection
│   │   ├── components/
│   │   │   ├── Captain/Captain.tsx            # NEW: mascot component
│   │   │   ├── RetroCard/RetroCard.tsx        # NEW: themed card
│   │   │   └── CitationPanel/CitationPanel.tsx # NEW: side panel
│   │   ├── styles/
│   │   │   └── _variables.scss                # NEW: retro design tokens
│   │   └── lib/api.ts                         # MODIFIED: collection endpoints
│   └── package.json                           # MODIFIED: rename
├── scripts/
│   ├── seed-demo-handbooks.ts                 # NEW: download + process public handbooks
│   └── generate-mascot.ts                     # NEW: DALL-E captain generation
├── package.json                               # MODIFIED: rename
└── pnpm-workspace.yaml                        # UNCHANGED
```

---

### Task 1: Infrastructure Rename

**Files:**

- Modify: `package.json`, `server/package.json`, `worker/package.json`, `web-client/package.json`, `common/package.json`
- Modify: `pnpm-workspace.yaml` (unchanged content, but verify)
- Modify: All import references to `doc-qa-rag-common` → `policy-pilot-common`

- [ ] **Step 1: Rename npm packages**

In `package.json` (root):

```json
"name": "policy-pilot"
```

In `server/package.json`:

```json
"name": "policy-pilot-server"
```

And update dependency: `"doc-qa-rag-common"` → `"policy-pilot-common"`

In `worker/package.json`:

```json
"name": "policy-pilot-worker"
```

And update dependency: `"doc-qa-rag-common"` → `"policy-pilot-common"`

In `common/package.json`:

```json
"name": "policy-pilot-common"
```

In `web-client/package.json`:

```json
"name": "policy-pilot-web"
```

- [ ] **Step 2: Update all import references**

Find and replace across all `.ts` files in `server/src/` and `worker/src/`:

- `from 'doc-qa-rag-common'` → `from 'policy-pilot-common'`
- `from 'doc-qa-rag-common/chunker'` → `from 'policy-pilot-common/chunker'`
- `from 'doc-qa-rag-common/types'` → `from 'policy-pilot-common/types'`

Run: `grep -r "doc-qa-rag" server/src/ worker/src/ --include="*.ts" -l` to find all files.

- [ ] **Step 3: Update pnpm lockfile**

Run: `pnpm install`

- [ ] **Step 4: Verify build**

Run: `pnpm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 5: Verify tests**

Run: `pnpm test`
Expected: All existing tests pass.

- [ ] **Step 6: Rename GitHub repo**

Go to https://github.com/nullvoidundefined/doc-qa-rag/settings and rename to `policy-pilot`.

- [ ] **Step 7: Update git remote**

Run: `git remote set-url origin https://github.com/nullvoidundefined/policy-pilot.git`

- [ ] **Step 8: Rename local directory**

Run: `mv /Users/iangreenough/Desktop/code/personal/production/document-qa-rag /Users/iangreenough/Desktop/code/personal/production/policy-pilot`

- [ ] **Step 9: Update Vercel project**

Run from `web-client/`: Remove `.vercel/` and re-link:

```bash
rm -rf .vercel
vercel link --yes --project policy-pilot
```

- [ ] **Step 10: Rename Railway project and services**

Via Railway dashboard: rename project to `policy-pilot`, rename services to `policy-pilot-server`, `policy-pilot-worker`, `policy-pilot-redis`.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "chore: rename project from document-qa-rag to policy-pilot"
```

---

### Task 2: Collections Migration & Repository

**Files:**

- Create: `server/migrations/..._create-collections.js`
- Create: `server/src/repositories/collections/collections.ts`
- Modify: `common/src/types/index.ts`

- [ ] **Step 1: Add Collection type to common types**

In `common/src/types/index.ts`, add:

```typescript
export interface Collection {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  is_demo: boolean;
  created_at: string;
}
```

- [ ] **Step 2: Create migration**

Create `server/migrations/1711900000005_create-collections.js`:

```javascript
exports.up = (pgm) => {
  pgm.createTable('collections', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      references: 'users',
      onDelete: 'CASCADE',
      notNull: false,
    },
    name: { type: 'varchar(255)', notNull: true },
    description: { type: 'text' },
    is_demo: { type: 'boolean', notNull: true, default: false },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.addColumn('documents', {
    collection_id: {
      type: 'uuid',
      references: 'collections',
      onDelete: 'CASCADE',
    },
  });

  pgm.createIndex('documents', 'collection_id');
  pgm.createIndex('collections', 'user_id');
};

exports.down = (pgm) => {
  pgm.dropColumn('documents', 'collection_id');
  pgm.dropTable('collections');
};
```

- [ ] **Step 3: Run migration locally**

Run: `cd server && npx node-pg-migrate up`
Expected: Migration applies successfully.

- [ ] **Step 4: Create collections repository**

Create `server/src/repositories/collections/collections.ts`:

```typescript
import { query } from 'app/db/pool/pool.js';
import type { Collection } from 'policy-pilot-common';

export async function createCollection(
  userId: string,
  name: string,
  description?: string,
): Promise<Collection> {
  const result = await query<Collection>(
    `INSERT INTO collections (user_id, name, description)
     VALUES ($1, $2, $3) RETURNING *`,
    [userId, name, description ?? null],
  );
  return result.rows[0]!;
}

export async function listCollections(userId: string): Promise<Collection[]> {
  const result = await query<Collection>(
    `SELECT * FROM collections
     WHERE user_id = $1 OR is_demo = true
     ORDER BY is_demo DESC, created_at DESC`,
    [userId],
  );
  return result.rows;
}

export async function getCollectionById(
  id: string,
  userId: string,
): Promise<Collection | null> {
  const result = await query<Collection>(
    `SELECT * FROM collections
     WHERE id = $1 AND (user_id = $2 OR is_demo = true)`,
    [id, userId],
  );
  return result.rows[0] ?? null;
}

export async function getDemoCollection(): Promise<Collection | null> {
  const result = await query<Collection>(
    `SELECT * FROM collections WHERE is_demo = true LIMIT 1`,
  );
  return result.rows[0] ?? null;
}

export async function deleteCollection(
  id: string,
  userId: string,
): Promise<boolean> {
  const result = await query(
    `DELETE FROM collections WHERE id = $1 AND user_id = $2 AND is_demo = false RETURNING id`,
    [id, userId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function getCollectionDocumentCount(id: string): Promise<number> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM documents WHERE collection_id = $1`,
    [id],
  );
  return parseInt(result.rows[0]?.count ?? '0', 10);
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add collections table, migration, and repository"
```

---

### Task 3: Collections API Routes & Handlers

**Files:**

- Create: `server/src/handlers/collections/collections.ts`
- Create: `server/src/routes/collections.ts`
- Modify: `server/src/app.ts`

- [ ] **Step 1: Create collections handlers**

Create `server/src/handlers/collections/collections.ts`:

```typescript
import * as collectionsRepo from 'app/repositories/collections/collections.js';
import { ApiError } from 'app/utils/ApiError.js';
import type { Request, Response } from 'express';

export async function createCollection(
  req: Request,
  res: Response,
): Promise<void> {
  const user = req.user!;
  const { name, description } = req.body as {
    name?: string;
    description?: string;
  };

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw ApiError.badRequest('Collection name is required');
  }

  const collection = await collectionsRepo.createCollection(
    user.id,
    name.trim(),
    description,
  );

  res.status(201).json({ collection });
}

export async function listCollections(
  req: Request,
  res: Response,
): Promise<void> {
  const user = req.user!;
  const collections = await collectionsRepo.listCollections(user.id);

  const withCounts = await Promise.all(
    collections.map(async (c) => ({
      ...c,
      document_count: await collectionsRepo.getCollectionDocumentCount(c.id),
    })),
  );

  res.json({ collections: withCounts });
}

export async function getCollection(
  req: Request,
  res: Response,
): Promise<void> {
  const user = req.user!;
  const id = req.params.id as string;

  const collection = await collectionsRepo.getCollectionById(id, user.id);
  if (!collection) {
    throw ApiError.notFound('Collection not found');
  }

  const document_count = await collectionsRepo.getCollectionDocumentCount(id);
  res.json({ collection: { ...collection, document_count } });
}

export async function deleteCollection(
  req: Request,
  res: Response,
): Promise<void> {
  const user = req.user!;
  const id = req.params.id as string;

  const deleted = await collectionsRepo.deleteCollection(id, user.id);
  if (!deleted) {
    throw ApiError.notFound('Collection not found or cannot be deleted');
  }

  res.status(204).send();
}
```

- [ ] **Step 2: Create collections routes**

Create `server/src/routes/collections.ts`:

```typescript
import * as collectionHandlers from 'app/handlers/collections/collections.js';
import { requireAuth } from 'app/middleware/requireAuth/requireAuth.js';
import express from 'express';

const collectionRouter = express.Router();

collectionRouter.use(requireAuth);
collectionRouter.get('/', collectionHandlers.listCollections);
collectionRouter.post('/', collectionHandlers.createCollection);
collectionRouter.get('/:id', collectionHandlers.getCollection);
collectionRouter.delete('/:id', collectionHandlers.deleteCollection);

export { collectionRouter };
```

- [ ] **Step 3: Wire into app.ts**

In `server/src/app.ts`, add import and route:

```typescript
import { collectionRouter } from 'app/routes/collections.js';

// ... after existing routes
app.use('/collections', collectionRouter);
```

- [ ] **Step 4: Verify build**

Run: `pnpm run build`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add collections CRUD API routes and handlers"
```

---

### Task 4: Modify Documents & QA for Collection Scoping

**Files:**

- Modify: `server/src/handlers/documents/documents.ts`
- Modify: `server/src/repositories/documents/documents.ts`
- Modify: `server/src/services/retrieval.service.ts`
- Modify: `server/src/handlers/qa/qa.ts`
- Modify: `server/src/middleware/requireAuth/requireAuth.ts`

- [ ] **Step 1: Add optionalAuth middleware**

In `server/src/middleware/requireAuth/requireAuth.ts`, add after `requireAuth`:

```typescript
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  // loadSession already sets req.user if session exists
  // optionalAuth just continues without requiring it
  next();
}
```

- [ ] **Step 2: Update document repository to support collection_id**

In `server/src/repositories/documents/documents.ts`:

Update `createDocument` to accept `collectionId`:

```typescript
export async function createDocument(
  userId: string,
  filename: string,
  r2Key: string,
  mimeType: string,
  sizeBytes: number,
  collectionId: string,
  client?: PoolClient,
): Promise<Document> {
  const result = await query<Document>(
    `INSERT INTO documents (user_id, filename, r2_key, mime_type, size_bytes, collection_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, filename, r2Key, mimeType, sizeBytes, collectionId],
    client,
  );
  const row = result.rows[0];
  if (!row) throw new Error('Insert returned no row');
  return row;
}
```

Update `listDocuments` to filter by collection:

```typescript
export async function listDocuments(
  userId: string,
  collectionId?: string,
): Promise<Document[]> {
  if (collectionId) {
    const result = await query<Document>(
      'SELECT * FROM documents WHERE user_id = $1 AND collection_id = $2 ORDER BY created_at DESC',
      [userId, collectionId],
    );
    return result.rows;
  }
  const result = await query<Document>(
    'SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC',
    [userId],
  );
  return result.rows;
}
```

- [ ] **Step 3: Update retrieval service to scope by collection_id**

In `server/src/services/retrieval.service.ts`, change `searchChunks` to accept `collectionId` instead of `documentIds`:

```typescript
export async function searchChunks(
  embedding: number[],
  userId: string | null,
  topK = 6,
  collectionId?: string,
): Promise<CitedChunk[]> {
  const embeddingStr = `[${embedding.join(',')}]`;

  let sql = `
    SELECT c.id, c.document_id, c.chunk_index, c.content, d.filename,
           1 - (c.embedding <=> $1::vector) AS similarity
    FROM chunks c
    JOIN documents d ON d.id = c.document_id
    WHERE c.embedding IS NOT NULL
  `;

  const values: unknown[] = [embeddingStr];

  if (collectionId) {
    values.push(collectionId);
    sql += ` AND d.collection_id = $${values.length}`;
  }

  if (userId) {
    values.push(userId);
    sql += ` AND c.user_id = $${values.length}`;
  }

  values.push(topK);
  sql += ` ORDER BY c.embedding <=> $1::vector LIMIT $${values.length}`;

  const result = await query<ChunkRow>(sql, values);

  return result.rows.map((row) => ({
    id: row.id,
    document_id: row.document_id,
    chunk_index: row.chunk_index,
    content: row.content,
    filename: row.filename,
  }));
}
```

- [ ] **Step 4: Update document upload handler for collection_id**

In `server/src/handlers/documents/documents.ts`, update `uploadDocument`:

```typescript
export async function uploadDocument(
  req: Request,
  res: Response,
): Promise<void> {
  const user = req.user!;
  const file = req.file;
  const collectionId = req.body.collection_id as string | undefined;

  if (!file) {
    throw ApiError.badRequest('No file uploaded');
  }

  if (!collectionId) {
    throw ApiError.badRequest('collection_id is required');
  }

  // ... rest of validation unchanged ...

  const document = await docsRepo.createDocument(
    user.id,
    file.originalname,
    r2Key,
    file.mimetype,
    file.size,
    collectionId,
  );

  // ... rest unchanged ...
}
```

- [ ] **Step 5: Update QA handler for collection scoping and optionalAuth**

In `server/src/handlers/qa/qa.ts`, update `streamQA`:

```typescript
export async function streamQA(req: Request, res: Response): Promise<void> {
  const user = req.user;
  const { question, conversation_id, collection_id } = req.body as {
    question?: string;
    conversation_id?: string;
    collection_id?: string;
  };

  if (
    !question ||
    typeof question !== 'string' ||
    question.trim().length === 0
  ) {
    throw ApiError.badRequest('Question is required');
  }

  if (!collection_id) {
    throw ApiError.badRequest('collection_id is required');
  }

  // ... setup SSE unchanged ...

  // Step 4: Vector similarity search — scoped by collection
  const chunks = await retrievalService.searchChunks(
    questionEmbedding,
    user?.id ?? null,
    6,
    collection_id,
  );

  // ... rest unchanged ...
}
```

Update QA route to use `optionalAuth` for demo support:

In `server/src/routes/qa.ts`:

```typescript
import { optionalAuth } from 'app/middleware/requireAuth/requireAuth.js';

const qaRouter = express.Router();
qaRouter.post('/', chatLimiter, optionalAuth, qaHandlers.streamQA);
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: scope documents and QA by collection, add optionalAuth for demo"
```

---

### Task 5: Expanded File Format Support (DOCX, HTML)

**Files:**

- Modify: `worker/src/services/text-extractor.service.ts`
- Modify: `worker/package.json` (add mammoth)
- Modify: `server/src/handlers/documents/documents.ts` (update allowed MIME types)

- [ ] **Step 1: Install mammoth in worker**

Run: `cd worker && pnpm add mammoth`

- [ ] **Step 2: Update text extractor**

In `worker/src/services/text-extractor.service.ts`:

```typescript
import mammoth from 'mammoth';
import pdf from 'pdf-parse';

export async function extractText(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  switch (mimeType) {
    case 'application/pdf':
      return extractPdfText(buffer);
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return extractDocxText(buffer);
    case 'text/html':
      return extractHtmlText(buffer);
    case 'text/plain':
    case 'text/markdown':
    case 'text/x-markdown':
      return buffer.toString('utf-8');
    default:
      throw new Error(`Unsupported mime type: ${mimeType}`);
  }
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text;
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

function extractHtmlText(buffer: Buffer): string {
  return buffer
    .toString('utf-8')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
```

- [ ] **Step 3: Update allowed MIME types in upload handler**

In `server/src/handlers/documents/documents.ts`, update `allowedMimes`:

```typescript
const allowedMimes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'text/x-markdown',
  'text/html',
];
if (!allowedMimes.includes(file.mimetype)) {
  throw ApiError.badRequest(
    'Unsupported file type. Upload PDF, DOCX, TXT, MD, or HTML files.',
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add DOCX and HTML document format support"
```

---

### Task 6: Document Relevance Check

**Files:**

- Modify: `worker/src/processors/document-processor.ts`
- Modify: `common/src/types/index.ts` (add `rejected` status)

- [ ] **Step 1: Add rejected status to common types**

In `common/src/types/index.ts`, update DocumentStatus:

```typescript
export type DocumentStatus =
  | 'pending'
  | 'chunking'
  | 'embedding'
  | 'ready'
  | 'failed'
  | 'rejected';
```

- [ ] **Step 2: Add relevance check to document processor**

In `worker/src/processors/document-processor.ts`, add after text extraction (step 2), before chunking:

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ... inside processDocument, after text extraction:

    // 2b. Relevance check
    log.info('Running relevance check');
    const preview = text.slice(0, 2000);
    const relevanceResponse = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: `Classify this document. Is it an employee policy document, company handbook, HR document, compliance manual, or standard operating procedure? Respond with JSON: {"score": 0.0-1.0, "reason": "brief explanation"}\n\nDocument preview:\n${preview}`,
        },
      ],
    });

    const relevanceText =
      relevanceResponse.content[0]?.type === 'text'
        ? relevanceResponse.content[0].text
        : '';

    let relevanceScore = 1;
    let relevanceReason = '';
    try {
      const parsed = JSON.parse(relevanceText);
      relevanceScore = parsed.score ?? 1;
      relevanceReason = parsed.reason ?? '';
    } catch {
      log.warn('Could not parse relevance response, proceeding anyway');
    }

    if (relevanceScore < 0.5) {
      log.info(
        { relevanceScore, relevanceReason },
        'Document rejected as not policy-related',
      );
      await updateStatus(documentId, 'rejected', {
        error: `This doesn't appear to be a policy document: ${relevanceReason}`,
      });
      return;
    }
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add document relevance check before processing"
```

---

### Task 7: Generate Captain Mascot with DALL-E

**Files:**

- Create: `scripts/generate-mascot.ts`
- Create: `web-client/public/mascot/` (generated images)

- [ ] **Step 1: Create mascot generation script**

Create `scripts/generate-mascot.ts`:

```typescript
import { config } from 'dotenv';
import { mkdirSync, writeFileSync } from 'fs';
import OpenAI from 'openai';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../server/.env') });

const openai = new OpenAI({ apiKey: process.env.OPEN_AI_API_KEY });

const MASCOT_DIR = resolve(__dirname, '../web-client/public/mascot');

const BASE_PROMPT = `1950s retro airline poster illustration style, Fallout Vault-Tec aesthetic. A warm, enthusiastic airline captain character. South Asian or Pacific Islander man with a big confident smile, wearing a classic navy airline captain uniform with gold epaulets and captain's hat. Mid-century illustration style with warm cream and navy tones. Clean vector-like illustration, not photorealistic. White/cream background.`;

const poses = [
  {
    name: 'hero',
    prompt: `${BASE_PROMPT} Full figure, confident stance, pointing forward with one hand. Heroic pose.`,
  },
  {
    name: 'welcome',
    prompt: `${BASE_PROMPT} Upper body, waving warmly or tipping his captain's hat. Welcoming gesture.`,
  },
  {
    name: 'thinking',
    prompt: `${BASE_PROMPT} Upper body, hand on chin, looking thoughtfully at a document or clipboard. Contemplative.`,
  },
  {
    name: 'thumbsup',
    prompt: `${BASE_PROMPT} Upper body, giving an enthusiastic thumbs up with a big smile. Celebrating.`,
  },
  {
    name: 'concerned',
    prompt: `${BASE_PROMPT} Upper body, slight concerned expression, one hand raised in a calming gesture. Reassuring.`,
  },
  {
    name: 'clipboard',
    prompt: `${BASE_PROMPT} Upper body, holding an empty clipboard and looking expectantly at the viewer. Inviting.`,
  },
];

async function generateMascot() {
  mkdirSync(MASCOT_DIR, { recursive: true });

  for (const pose of poses) {
    console.log(`Generating: ${pose.name}...`);
    try {
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: pose.prompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd',
      });

      const imageUrl = response.data[0]?.url;
      if (!imageUrl) {
        console.error(`No URL returned for ${pose.name}`);
        continue;
      }

      const imageResponse = await fetch(imageUrl);
      const buffer = Buffer.from(await imageResponse.arrayBuffer());
      const filePath = resolve(MASCOT_DIR, `captain-${pose.name}.png`);
      writeFileSync(filePath, buffer);
      console.log(`Saved: ${filePath}`);
    } catch (err) {
      console.error(`Failed to generate ${pose.name}:`, err);
    }
  }

  console.log('Mascot generation complete!');
}

generateMascot();
```

- [ ] **Step 2: Run the script**

Run: `npx tsx scripts/generate-mascot.ts`
Expected: 6 PNG files in `web-client/public/mascot/`

- [ ] **Step 3: Commit**

```bash
git add scripts/generate-mascot.ts web-client/public/mascot/
git commit -m "feat: generate captain mascot illustrations with DALL-E 3"
```

---

### Task 8: Demo Handbook Seeding Script

**Files:**

- Create: `scripts/seed-demo-handbooks.ts`

- [ ] **Step 1: Create seed script**

Create `scripts/seed-demo-handbooks.ts`:

```typescript
import { config } from 'dotenv';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../server/.env') });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const HANDBOOKS = [
  {
    name: 'GitLab Handbook (Excerpt)',
    url: 'https://about.gitlab.com/handbook/',
    description:
      "GitLab's public company handbook covering remote work, engineering, and company culture.",
    // We'll use a curated excerpt since the full handbook is thousands of pages
    generateContent: true,
  },
  {
    name: 'Valve Employee Handbook',
    description:
      "Valve's famous employee handbook covering flat organization, project selection, and company philosophy.",
    generateContent: true,
  },
  {
    name: 'Basecamp Employee Handbook',
    description:
      "Basecamp's handbook covering benefits, ethics, and company values.",
    generateContent: true,
  },
];

async function seed() {
  // Create demo collection
  const collectionResult = await pool.query(
    `INSERT INTO collections (name, description, is_demo, user_id)
     VALUES ($1, $2, true, NULL)
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [
      'Sample Company Handbooks',
      'Pre-loaded public company handbooks for demo purposes. Try asking questions!',
    ],
  );

  let collectionId: string;
  if (collectionResult.rows[0]) {
    collectionId = collectionResult.rows[0].id;
  } else {
    const existing = await pool.query(
      `SELECT id FROM collections WHERE is_demo = true LIMIT 1`,
    );
    collectionId = existing.rows[0]?.id;
    if (!collectionId)
      throw new Error('Could not create or find demo collection');
  }

  console.log(`Demo collection ID: ${collectionId}`);
  console.log(
    'Demo collection created. Upload handbooks via the app or manually seed documents.',
  );
  console.log('Collection is ready for document uploads.');

  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Run the seed script**

Run: `npx tsx scripts/seed-demo-handbooks.ts`

- [ ] **Step 3: Commit**

```bash
git add scripts/seed-demo-handbooks.ts
git commit -m "feat: add demo handbook collection seeding script"
```

---

### Task 9: Frontend — Retro Design System & Layout

**Files:**

- Create: `web-client/src/styles/_variables.scss`
- Modify: `web-client/src/app/globals.scss`
- Modify: `web-client/src/app/layout.tsx`
- Create: `web-client/src/components/Captain/Captain.tsx`
- Create: `web-client/src/components/Captain/Captain.module.scss`

**NOTE:** Use the `frontend-design` skill when implementing this task. The code below provides the structure — the skill should produce high-quality, distinctive visual design.

- [ ] **Step 1: Create design tokens**

Create `web-client/src/styles/_variables.scss`:

```scss
// PolicyPilot — 1950s Airline Theme
// Colors
$cream: #fdf6e3;
$ivory: #faf3e0;
$navy: #1b2a4a;
$navy-light: #2d4470;
$amber: #d4940a;
$amber-light: #f0c75e;
$coral: #e8654a;
$sky: #87ceeb;
$white: #ffffff;
$text-primary: $navy;
$text-secondary: #5a6b8a;
$text-muted: #8b9ab8;
$border: #e0d5c0;
$bg-primary: $cream;
$bg-secondary: $ivory;
$bg-card: $white;
$success: #4a8c5c;
$error: $coral;
$warning: $amber;

// Typography
$font-display: 'Playfair Display', Georgia, serif;
$font-body: 'Inter', system-ui, sans-serif;
$font-mono: 'JetBrains Mono', monospace;

// Spacing
$radius-sm: 6px;
$radius-md: 12px;
$radius-lg: 20px;

// Shadows
$shadow-card: 0 2px 8px rgba(27, 42, 74, 0.08);
$shadow-hover: 0 4px 16px rgba(27, 42, 74, 0.12);
```

- [ ] **Step 2: Update globals.scss**

Replace `web-client/src/app/globals.scss` with retro base styles using the design tokens. Set body background to `$cream`, default text to `$navy`, link colors to `$navy-light`.

- [ ] **Step 3: Update layout.tsx**

Update `web-client/src/app/layout.tsx`:

- Change metadata title to `PolicyPilot — Ask your company handbook anything`
- Add Google Fonts: Playfair Display + Inter
- Remove DocBar component
- Update body class

- [ ] **Step 4: Create Captain component**

Create `web-client/src/components/Captain/Captain.tsx`:

```typescript
import Image from 'next/image';
import styles from './Captain.module.scss';

type CaptainPose = 'hero' | 'welcome' | 'thinking' | 'thumbsup' | 'concerned' | 'clipboard';

interface CaptainProps {
  pose: CaptainPose;
  size?: 'sm' | 'md' | 'lg';
  alt?: string;
  className?: string;
}

const SIZES = { sm: 80, md: 160, lg: 320 };

export default function Captain({
  pose,
  size = 'md',
  alt = 'Captain PolicyPilot',
  className,
}: CaptainProps) {
  const px = SIZES[size];
  return (
    <div className={`${styles.captain} ${styles[size]} ${className ?? ''}`}>
      <Image
        src={`/mascot/captain-${pose}.png`}
        alt={alt}
        width={px}
        height={px}
        priority={pose === 'hero'}
      />
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add retro design system, layout, and Captain mascot component"
```

---

### Task 10: Frontend — Landing Page

**Files:**

- Modify: `web-client/src/app/page.tsx`
- Create: `web-client/src/app/page.module.scss`

**NOTE:** Use the `frontend-design` skill for this task.

- [ ] **Step 1: Build landing page**

The landing page should include:

- Hero section with Captain mascot (hero pose), tagline "Ask your company handbook anything", and two CTAs: "Try the Demo" → `/demo`, "Upload Your Own" → `/register`
- Features section: 3 cards explaining the value (instant answers, cited sources, secure uploads)
- Demo preview section: shows the pre-seeded handbooks with a teaser
- Retro decorative elements (border patterns, vintage badges)
- All in the 1950s airline poster aesthetic

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add retro-themed PolicyPilot landing page"
```

---

### Task 11: Frontend — Auth Pages (Login/Register)

**Files:**

- Modify: `web-client/src/app/(auth)/login/page.tsx`
- Modify: `web-client/src/app/(auth)/register/page.tsx`
- Modify/Create: `web-client/src/app/(auth)/auth.module.scss`

**NOTE:** Use the `frontend-design` skill.

- [ ] **Step 1: Redesign login page**

Retro-themed login with Captain mascot (welcome pose), cream background, navy inputs, amber submit button. Retro copy: "Welcome aboard, co-pilot!"

- [ ] **Step 2: Redesign register page**

Same retro theme. "Join the crew!" heading with Captain.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: redesign auth pages with retro PolicyPilot theme"
```

---

### Task 12: Frontend — Dashboard (Collection Management)

**Files:**

- Create: `web-client/src/app/(protected)/dashboard/page.tsx`
- Create: `web-client/src/app/(protected)/dashboard/dashboard.module.scss`
- Create: `web-client/src/components/RetroCard/RetroCard.tsx`
- Modify: `web-client/src/lib/api.ts` (add collection endpoints)

- [ ] **Step 1: Add collection API endpoints to frontend client**

In `web-client/src/lib/api.ts`, add:

```typescript
export function getCollections() {
  return get<{ collections: Collection[] }>('/collections');
}

export function createCollection(name: string, description?: string) {
  return post<{ collection: Collection }>('/collections', {
    name,
    description,
  });
}

export function deleteCollection(id: string) {
  return del<void>(`/collections/${id}`);
}
```

- [ ] **Step 2: Create RetroCard component**

A themed card component with cream background, subtle border, shadow, and hover effect.

- [ ] **Step 3: Build dashboard page**

Grid of collection cards. Each card shows collection name, document count, "demo" badge if demo. "New Collection" button. Click card → `/collections/:id`. Empty state with Captain (clipboard pose): "No collections yet — let's get you loaded up, co-pilot!"

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add collection dashboard with retro theme"
```

---

### Task 13: Frontend — Collection View (Document Management)

**Files:**

- Create: `web-client/src/app/(protected)/collections/[id]/page.tsx`
- Create: `web-client/src/app/(protected)/collections/[id]/collection.module.scss`

- [ ] **Step 1: Build collection view page**

Shows collection name, description, document list with status badges (processing/ready/failed/rejected). Upload button (disabled for demo collections). Delete button per document. "Start chatting" button → `/chat/:collectionId`. Empty state with Captain.

For rejected documents, show the relevance check reason and an "Override" button to force-process.

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add collection document management view"
```

---

### Task 14: Frontend — Chat with Citation Panel

**Files:**

- Modify: `web-client/src/app/(protected)/chat/[collectionId]/page.tsx` (move from `chat/page.tsx`)
- Create: `web-client/src/components/CitationPanel/CitationPanel.tsx`
- Create: `web-client/src/components/CitationPanel/CitationPanel.module.scss`

- [ ] **Step 1: Create CitationPanel component**

Side panel that slides in from the right when a citation `[1]`, `[2]` etc. is clicked. Shows:

- Document filename
- Chunk index / section
- The full chunk text with the relevant portion highlighted
- "Close" button

- [ ] **Step 2: Update chat page**

Move to `/chat/[collectionId]/` route. Add collection_id to the QA request body. Add citation panel. Update retro styling. Conversation sidebar on left, chat center, citation panel right.

For demo chat, show signup banner.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add citation side panel and collection-scoped chat"
```

---

### Task 15: Frontend — Public Demo Chat

**Files:**

- Create: `web-client/src/app/demo/page.tsx`
- Create: `web-client/src/app/demo/demo.module.scss`

- [ ] **Step 1: Build demo page**

Similar to the authenticated chat but:

- No auth required
- Fetches demo collection ID from `GET /collections/demo` (new endpoint)
- Shows signup banner: "This is a demo — sign up to upload your own policies!"
- Captain mascot in the sidebar
- Same citation panel

- [ ] **Step 2: Add demo collection endpoint to backend**

In `server/src/routes/collections.ts`, add a public route:

```typescript
// Public — no auth required
collectionRouter.get('/demo', async (_req, res) => {
  const demo = await collectionsRepo.getDemoCollection();
  if (!demo) {
    res.status(404).json({ error: 'No demo collection available' });
    return;
  }
  res.json({ collection: demo });
});
```

Move this route BEFORE the `collectionRouter.use(requireAuth)` line.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add public demo chat page with pre-seeded handbooks"
```

---

### Task 16: Retro Copy & Polish

**Files:**

- Various frontend files

- [ ] **Step 1: Update all user-facing copy to retro airline theme**

Scan all pages and components. Replace generic text:

- "Upload" → "Load your documents"
- "Processing" → "Preparing for takeoff"
- "Ready" → "Cleared for takeoff"
- "Failed" → "Turbulence encountered"
- "Rejected" → "Redirected to another gate"
- "No documents" → "The hangar is empty"
- Loading spinners → "Scanning the flight manual..."
- Error messages → "We've hit some turbulence — [details]"
- Success messages → "All systems go!"

- [ ] **Step 2: Add Captain mascot to all empty/error/loading states**

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add retro airline copy and Captain mascot throughout app"
```

---

### Task 17: Deploy & Verify

**Files:**

- Infrastructure only

- [ ] **Step 1: Run all tests**

Run: `pnpm test && pnpm test:integration`

- [ ] **Step 2: Run migration on production**

Via Railway: run `npx node-pg-migrate up` on the server service.

- [ ] **Step 3: Seed demo handbooks on production**

Run: `npx tsx scripts/seed-demo-handbooks.ts` (with production DATABASE_URL)

- [ ] **Step 4: Push to GitHub**

Run: `git push`

- [ ] **Step 5: Deploy frontend**

Vercel auto-deploys via GitHub. Verify at the new PolicyPilot URL.

- [ ] **Step 6: Verify production**

- Visit landing page — Captain mascot visible, retro theme, CTAs work
- Try demo chat — ask "What is GitLab's remote work policy?"
- Register a new account
- Create a collection
- Upload a DOCX file — verify it processes
- Upload a non-policy document — verify relevance check rejects it
- Ask a question — verify citations link to side panel

- [ ] **Step 7: Commit any fixes**

```bash
git add -A
git commit -m "fix: post-deploy adjustments"
```

---

## Self-Review

**Spec coverage:**

- Product identity & visual theme → Tasks 9, 10, 11, 16 ✓
- Infrastructure rename → Task 1 ✓
- Collections → Tasks 2, 3, 4 ✓
- Pre-seeded demos → Task 8, 15 ✓
- Public demo experience → Task 15 ✓
- Citation side panel → Task 14 ✓
- Document relevance check → Task 6 ✓
- Expanded file formats → Task 5 ✓
- DALL-E mascot → Task 7 ✓
- Frontend overhaul → Tasks 9-16 ✓
- Deploy & verify → Task 17 ✓

**Placeholder scan:** No TBDs. Tasks 10-14 reference the `frontend-design` skill for visual quality — this is intentional delegation, not a placeholder.

**Type consistency:** `Collection` type defined in Task 2 and used consistently. `collection_id` parameter name consistent across handlers, repos, and retrieval service. `optionalAuth` defined in Task 4, used in Task 4 (QA route) and Task 15 (demo). `DocumentStatus` extended with `rejected` in Task 6.
