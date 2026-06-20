This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## 📄 Module 10: Enterprise AI Career Documents Suite

ResumeAI Pro includes a comprehensive workspace to generate, refine, organize, version, share, and export various career development documents.

### 🏛️ Architecture & Data Schema
The platform persists document information using normalized PostgreSQL tables:
- **`public.document_folders`**: Holds folder metadata (custom names, color tags) assigned per user profile.
- **`public.career_documents`**: Manages document types, titles, body content, configuration parameters (tone, length scale), and flags (`is_pinned`, `is_favorite`, `is_archived`, `tags` array).
- **`public.career_document_versions`**: Maintains a chronological list of snapshots for each document, allowing users to capture history checkpoints and restore content.
- **`public.career_document_shares`**: Configures sharing link settings (slug strings, visibilities, SHA-256 password hashes, print/download permissions).

### 🤖 AI Workflow & Streaming
Career document generation leverages our unified AI Service Layer:
1. **Context Collection**: If a resume link is set, the API reads personal details, experience lists, education, projects, and skills to construct a plaintext resume context.
2. **Daily Billing Checks**: Free plan users are restricted to 3 document generations per UTC day (enforced via database logs on `ai_generations`), while Pro subscribers have unlimited queries.
3. **Prompt Composition**: Adapts system guidelines and custom input fields depending on the target document category.
4. **Streaming Response**: Invokes `getAIStream` to stream character chunks back to the client editor interface in real-time, logging credit consumption asynchronously on stream completion.

### 📝 Prompt Library Templates
Supported document categories utilize dedicated prompting patterns defined in `lib/ai-prompts.ts`:
- **Outreach & Networking Emails**: Writes high-impact, short templates incorporating subject lines and clear calls to action.
- **Statement of Purpose (SOP) / Personal Statements**: Focuses on academic highlights, research focus areas, and institutional alignment.
- **Cover Letters & Application Letters**: Tailors professional narrative to match specific job descriptions and target role requirements.
- **Proposals & Client Introductions**: Highlights budget terms, timelines, and business scope variables.

### ⏱️ Document Versioning Snapshotting
Every major update or manual user save logs a row in `career_document_versions`. Users can view historical snapshots via a drawer side-panel in the Editor workspace and click **Restore** to roll back content instantly.

### 📁 Organizing Folders & Tagging
Users can organize files into custom, color-coded folders (Indigo, Violet, emerald, Amber, etc.). Search bars support indexing title strings, tags array, or text keywords.

### 🛡️ Security & Row Level Security (RLS)
The database enforces security at the PostgreSQL layer:
- **Folders, Documents, and Versions**: Guarded by RLS rules that compare `auth.uid() = user_id`, preventing any unauthorized access.
- **Public Sharing Landing Pages**: Share links (`/documents/share/[slug]`) check visibility properties. If set to `password`, access is gated by matching SHA-256 password hash checks in the API tier.

