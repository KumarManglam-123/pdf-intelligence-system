# PDF Intelligence & Collaboration System

A full-stack, production-grade Next.js 14+ web application for uploading PDF documents, generating grounded AI summaries via Groq LLM, chatting with long documents using Vector RAG (Retrieval-Augmented Generation), and collaborating in real-time with invited guests via secure shareable links.

- **Live Deployed Application**: `https://pdf-intelligence-system.vercel.app`
- **Demo Owner Account**: `demo@example.com` / `Password123!`



---

## Features

- **Authentication**: Email/Password signup and login powered by NextAuth Credentials Provider and `bcryptjs` password hashing.
- **PDF Upload & Storage**: Upload PDF documents with MIME type and extension validation; stored securely using `@vercel/blob` (with offline dev fallback).
- **Instant AI Summaries**: Synchronous summary generation using Groq API (`openai/gpt-oss-120b`) producing 3–5 concise sentences grounded strictly in the document's extracted text.
- **RAG AI Document Chat**: Ask questions about long documents. Context is dynamically retrieved via vector embeddings (`@xenova/transformers` with `Xenova/all-MiniLM-L6-v2`) and cosine similarity before calling Groq. Streaming responses provide a real-time typing effect.
- **Secure File Sharing**: PDF owners can generate unique random share links. Anyone with the link can view the document and chat/comment without needing an account.
- **Guest & Owner Commenting**: Threaded comment replies with guest display name support and a markdown-lite formatter (`**bold**`, `*italic*`, `` `code` ``, `- bullet lists`).
- **Dashboard & Semantic Search**: Grid view of owned PDFs with real-time text and semantic vector similarity search.
- **Server-Side Security**: Every API route and Server Component validates PDF access authorization server-side (checking owner ID or share token). Secrets are strictly server-only.

---

## Tech Stack

- **Framework**: Next.js 14+ (App Router, TypeScript)
- **Database**: PostgreSQL (via Neon DB) accessed via Prisma ORM
- **Auth**: NextAuth.js (Auth.js v4) with Credentials provider
- **File Storage**: Vercel Blob (`@vercel/blob`)
- **PDF Extraction**: `pdf-parse`
- **LLM Provider**: Groq API (`openai/gpt-oss-120b`)
- **Vector Embeddings**: `@xenova/transformers` (`Xenova/all-MiniLM-L6-v2`)
- **Styling**: Tailwind CSS & Lucide Icons

---

## RAG Chunking & Retrieval Strategy

For long PDF document handling, the system splits extracted document text into overlapping chunks (~1,000 characters per chunk with a 200-character overlap) to preserve semantic boundaries across sentence breaks. Upon upload, each chunk is passed through `@xenova/transformers` (running the 384-dimensional `Xenova/all-MiniLM-L6-v2` feature-extraction model) to compute its vector embedding, which is stored as a JSON float array in the `PdfChunk` database table.

At query time, when a user asks a question in the AI Chat panel:
1. The user's query is converted into a vector embedding using the same model.
2. Cosine similarity is computed between the query vector and all chunk embeddings for that PDF.
3. The top-3 highest-scoring chunks are extracted and injected into the Groq system prompt as grounding context alongside the last 5 conversation history turns.
4. Groq (`openai/gpt-oss-120b`) is instructed to answer strictly using the provided context excerpts or reply *"I cannot find the answer to that in the provided document."* if the information is absent, eliminating hallucinations.

---

## Local Setup Instructions

### 1. Prerequisites
- Node.js 18+ or 20+
- PostgreSQL database (or Neon PostgreSQL instance)

### 2. Installation & Environment Configuration
Clone the repository and install dependencies:

```bash
git clone https://github.com/KumarManglam-123/pdf-intelligence-system.git
cd pdf-intelligence-system
npm install
```

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your environment variables in `.env`:

```env
# Database connection string (PostgreSQL via Neon)
DATABASE_URL="postgresql://user:password@ep-sample.us-east-2.aws.neon.tech/neondb?sslmode=require"

# NextAuth configuration
NEXTAUTH_SECRET="your-nextauth-secret-key-at-least-32-characters"
NEXTAUTH_URL="http://localhost:3000"

# Groq API Configuration
GROQ_API_KEY="gsk_your_groq_api_key"
GROQ_MODEL="openai/gpt-oss-120b"

# Vercel Blob Storage token
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_token"
```

### 3. Database Setup & Migration
Run Prisma database migrations to create the required tables (`User`, `Pdf`, `PdfChunk`, `Share`, `Comment`, `ChatMessage`):

```bash
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment to Vercel

1. Push your repository to GitHub.
2. Import project into Vercel.
3. In Vercel Project Settings -> Environment Variables, add:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (Set to your production Vercel URL, e.g. `https://your-app.vercel.app`)
   - `GROQ_API_KEY`
   - `GROQ_MODEL` (`openai/gpt-oss-120b`)
   - `BLOB_READ_WRITE_TOKEN` (Create Vercel Blob store in Vercel dashboard and connect it)
4. Deploy! Next.js will automatically run `prisma generate` during `npm run build`.

---

## Scope Trade-offs & Known Limitations

- **Email-on-Share**: Email notifications when generating or sharing a link were scoped out due to time constraints in favor of instant copyable share links.
- **File Upload Limits & Scanned PDFs**: Uploads are restricted to 15MB. Text extraction relies on `pdf-parse`; scanned image-only PDFs without text layers will prompt an explicit error asking for text-selectable PDFs.
- **Synchronous RAG Ingestion**: Chunks and vector embeddings are generated synchronously on upload. For documents over 100 pages, background job queueing (e.g. Ingest/Inngest) can be added for async background processing.
- **Embedding Model**: Local ONNX model loading via `@xenova/transformers` (`Xenova/all-MiniLM-L6-v2`) provides zero-cost embeddings with a deterministic character/ngram fallback vectorizer if native binaries are restricted.

