# PolicyPilot — Design Spec

**Date:** 2026-04-02
**Status:** Approved
**Repo:** document-qa-rag → policy-pilot

## Overview

PolicyPilot is an AI-powered employee policy assistant. Upload your company's handbook, HR policies, or compliance documents, then ask questions in plain English. Get instant, cited answers grounded in your actual policies.

**Tagline:** "Ask your company handbook anything."

This is a rebrand and feature enhancement of the existing document-qa-rag application. The underlying RAG pipeline (upload → chunk → embed → vector search → LLM streaming response) is retained. The changes are: product identity, visual overhaul, document collections, demo experience with pre-seeded public handbooks, and citation UX improvements.

## Visual Identity

**Theme:** 1950s airline poster aesthetic, inspired by Fallout/Vault-Tec optimism. Retro-futuristic, earnest, approachable. Pan Am brochure energy.

**Color palette:** Cream/ivory backgrounds, navy and amber accents. Warm, sunny, optimistic. No dark mode.

**Typography:** Rounded, friendly sans-serif. Retro but readable.

**Captain mascot:** A warm, enthusiastic figure in a classic captain's uniform with Fallout Vault-Tec poster energy. Non-Caucasian (South Asian or Pacific Islander). Big confident smile, various poses for different contexts. Generated via DALL-E 3 in mid-century illustration style. Stored as static assets in `/public`, not generated at runtime.

**Mascot usage:**

- Landing page hero
- Empty states ("No documents yet — let's get you loaded up, co-pilot!")
- Error states ("Turbulence! Let's try that again.")
- Loading states ("Scanning the flight manual...")
- Auth pages

**Tone of voice:** Wholesome, enthusiastic, competent. Mid-century training film narrator. Earnest without being corny.

Examples:

- "Your policy documents are all loaded up and ready for takeoff!"
- "Cleared for takeoff — let me check the handbook for you."
- "Attention passengers: here's what the policy manual says..."

## Naming & Infrastructure Rename

All infrastructure renamed for consistency:

| What              | Current                                          | New                                                                |
| ----------------- | ------------------------------------------------ | ------------------------------------------------------------------ |
| Directory         | `production/document-qa-rag`                     | `production/policy-pilot`                                          |
| GitHub repo       | `nullvoidundefined/doc-qa-rag`                   | `nullvoidundefined/policy-pilot`                                   |
| Vercel project    | `document-qa-rag`                                | `policy-pilot`                                                     |
| Railway project   | `document-qa-rag`                                | `policy-pilot`                                                     |
| Railway services  | `doc-qa-server`, `doc-qa-worker`, `doc-qa-redis` | `policy-pilot-server`, `policy-pilot-worker`, `policy-pilot-redis` |
| npm package names | `doc-qa-rag-*`                                   | `policy-pilot-*`                                                   |

The rename is the first implementation task, done before any feature work.

## Core Features

### Retained from document-qa-rag (no changes)

- Document upload → R2 storage → worker chunking → OpenAI embeddings → pgvector storage
- Chat interface → vector similarity search → Claude streaming response with citations
- Conversations with persistent history
- Auth (register/login/logout)
- Worker pipeline (BullMQ)

### New: Document Collections

Documents are grouped into collections (e.g., "GitLab Handbook", "My Company Policies"). Each collection represents one organization's policy set.

**Database:**

- New `collections` table: `id`, `user_id` (nullable for demo), `name`, `description`, `is_demo` (boolean), `created_at`
- Add `collection_id` foreign key to `documents` table (nullable initially; migration creates a default collection per user for existing documents)
- Vector search scoped by `collection_id`

**API:**

- `GET /collections` — list user's collections + demo collections
- `POST /collections` — create a collection
- `GET /collections/:id` — get collection with document count
- `DELETE /collections/:id` — delete collection and all documents

### New: Pre-Seeded Demo Handbooks

2-3 publicly available company handbooks pre-loaded and processed:

- GitLab Handbook (remote work, engineering practices)
- Valve Employee Handbook (flat structure, self-direction)
- Basecamp Employee Handbook (benefits, ethics)

These exist in a shared demo collection accessible without authentication. A seed script (`scripts/seed-demo-handbooks.ts`) downloads the handbooks, creates the demo collection, and processes them through the existing pipeline.

### New: Public Demo Experience

Visitors can try PolicyPilot without signing up by chatting with the pre-seeded demo handbooks.

**Implementation:**

- New `optionalAuth` middleware: loads session if present, but doesn't require it
- Demo chat route uses the demo collection
- Banner prompts signup: "This is a demo — sign up to upload your own policies."

### New: Citation Side Panel

When the AI cites a source, clicking the citation opens a side panel showing the relevant passage highlighted in context. Shows document name, page/section, and the surrounding text.

### New: Expanded File Format Support

Policy documents come in many formats. The worker's text extraction step is extended to support:

- **PDF** (existing) — via `pdf-parse`
- **DOCX** — via `mammoth` (extracts text + structure from Word documents)
- **TXT / Markdown** — plain text, read directly
- **HTML** — strip tags, extract text content

The upload endpoint accepts these MIME types. The worker detects the format and routes to the appropriate text extractor before chunking. Unsupported formats are rejected with a clear error message.

### New: Document Relevance Check

When a user uploads a document, the worker runs a quick relevance check before full processing. After extracting the first ~2000 characters of text, it sends them to Claude with a classification prompt: "Is this an employee policy document, company handbook, HR document, or compliance manual? Respond with a confidence score (0-1) and a brief reason."

**Behavior:**

- Score >= 0.5: process normally
- Score < 0.5: mark document as `rejected`, store the reason, notify the user: "This doesn't look like a policy document. PolicyPilot works best with employee handbooks, HR policies, and compliance documents."
- User can override the rejection and force-process if they want

This is a lightweight guardrail, not a hard block. It demonstrates product thinking (domain-appropriate validation) without being annoying.

### Modified: QA Endpoint

The `/qa` endpoint accepts `collection_id` to scope retrieval. When using the demo collection, no auth is required.

## Page Structure

1. **Landing page** (`/`) — Hero with captain mascot, tagline, "Try the demo" CTA (no auth), "Upload your own" CTA (leads to register). Pre-seeded handbook previews.

2. **Demo chat** (`/demo`) — Public, no auth. Pre-loaded demo handbooks. Full chat with citations. Signup banner.

3. **Login / Register** (`/login`, `/register`) — Retro-themed auth pages with captain mascot.

4. **Dashboard** (`/dashboard`) — User's document collections as cards. Document count, last updated. "New Collection" button. Demo collection shown as read-only.

5. **Collection view** (`/collections/:id`) — Documents in a collection. Upload, document list with status (processing/ready/failed), delete.

6. **Chat** (`/chat/:collectionId`) — QA interface scoped to a collection. Conversation sidebar (left), chat (center), citation panel (right, expands on click).

7. **Profile** (`/profile`) — Account settings.

## Frontend Design

The entire frontend is reskinned with the 1950s airline theme. Use the frontend-design skill during implementation for high design quality.

Key design principles:

- Warm, inviting, zero intimidation
- Retro illustration style for decorative elements
- Clean information hierarchy despite the playful theme
- Accessible (WCAG AA, Radix UI primitives)
- Responsive

## DALL-E Mascot Generation

Generate the captain mascot using DALL-E 3 in multiple poses:

1. **Hero pose** — full figure, confident stance, pointing forward. For landing page.
2. **Welcome pose** — waving or tipping cap. For auth pages.
3. **Thinking pose** — hand on chin, looking at a document. For loading/processing states.
4. **Thumbs up** — celebrating. For success states.
5. **Concerned pose** — slight frown, hand raised. For error states.
6. **Empty clipboard** — holding an empty clipboard, looking expectant. For empty states.

All generated at project start and stored as static PNGs in `/public/mascot/`.

## Technical Summary

**Backend changes:**

- New `collections` table + migration
- New `/collections` CRUD routes
- `collection_id` foreign key on `documents`
- `/qa` scoped by `collection_id`
- `optionalAuth` middleware for demo routes
- `scripts/seed-demo-handbooks.ts`
- Explicit `apiKey` in Anthropic constructor (already done)

**Worker changes:**

- None — pipeline processes documents identically regardless of collection

**Frontend changes:**

- Complete visual overhaul (1950s airline / Fallout theme)
- Landing page with DALL-E captain mascot
- Demo chat route (public, no auth)
- Collection management UI (dashboard, collection view)
- Citation side panel with passage highlighting
- Retro copy throughout
- Responsive design

**Infrastructure:**

- Rename all services, repos, and projects
- New R2 bucket or rename existing
- Update Railway and Vercel env vars with new names
- Update CORS origins

## Success Criteria

- A visitor can land on PolicyPilot, ask a question about GitLab's remote work policy, and get a cited answer without signing up
- A signed-in user can create a collection, upload their company handbook, and chat with it
- Citations link to highlighted source passages in a side panel
- The visual design is distinctive, polished, and immediately communicates "this is a real product, not a tutorial project"
- The captain mascot appears in contextually appropriate places throughout the app
- All existing tests pass, new features have integration and E2E coverage
