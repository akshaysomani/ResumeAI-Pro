# ResumeAI Pro — Enterprise AI Career Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-blue)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-SSR-emerald)](https://supabase.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://www.postgresql.org/)
[![Turbopack](https://img.shields.io/badge/Turbopack-Enabled-orange)](https://turbo.build/pack)
[![Tests](https://img.shields.io/badge/Tests-18%20Passed-green)](tests/runner.ts)

**ResumeAI Pro** is a state-of-the-art, enterprise-grade AI-powered Career Suite built with **Next.js 16 App Router**, **React 19**, and **Supabase SSR**. Designed for high performance, reliability, and security, it enables job seekers to generate ATS-optimized resumes, write high-impact cover letters, prepare for mock interviews, map career goals, and organize documents.

---

## 🏛️ Architecture Overview

The application features a modern client-server layout utilizing Next.js Server Actions, a unified AI integration layer, and a resilient database integration layer.

```mermaid
graph TD
    subgraph Client [Client UI & Providers]
        UI[React 19 Components]
        Auth[Auth Provider]
        Sync[Offline Sync & local-db]
        Theme[Theme Provider]
    end

    subgraph API [Next.js App Server Actions]
        RA[Resume Actions]
        DocA[Document Actions]
        IntelA[Career Intel Actions]
        AdminA[Admin Actions]
    end

    subgraph Services [Service Layer]
        AIService[AI Service Layer / ai-provider]
        DBService[Database Service / dbService]
    end

    subgraph Data [Storage & DB]
        PG[PostgreSQL Pool / pg]
        MockDB[(In-Memory Mock DB Fallback)]
        Supa[(Supabase SSR auth.users)]
    end

    UI --> Auth
    UI --> Sync
    UI --> Theme
    UI --> RA
    UI --> DocA
    UI --> IntelA
    UI --> AdminA

    RA --> DBService
    DocA --> DBService
    IntelA --> DBService
    AdminA --> DBService

    DBService --> AIService
    DBService --> PG
    PG -- Connection Fail? --> MockDB
    Auth --> Supa
```

---

## 🚀 Key Features

*   **ATS Resume Builder & Analyzer**: Visual interactive editor canvas (`resume-preview-canvas.tsx`) with PDF/Docx generation capabilities.
*   **AI Writing Assistant**: Real-time streaming generation of cover letters, SOPs, networking emails, and client proposals.
*   **Career Intelligence Suite**: Interactive mock interviews with STAR-method feedback, career goal roadmap generators, and salary estimators.
*   **Self-Healing Database Pool**: Resilient Pg Pool integration that automatically catches connection refused errors and routes operations to an in-memory database mock.
*   **Collaboration & Recruiter Mode**: Multi-tenant organization support, recruiter presence trackers, document lock mechanisms, and feedback logs.
*   **Offline-First Sync**: Background synchronization worker (`sw.js`) that persists mutations inside IndexedDB and syncs upon reconnection.

---

## 🗄️ Database Schema

The platform maintains a highly normalized PostgreSQL schema across 15 migrations, secured with strict **Row-Level Security (RLS)** rules.

| Table | Description | Primary Key | Foreign Keys |
| ----- | ----------- | ----------- | ------------ |
| `public.profiles` | User profile details | `id (uuid)` | `auth.users.id` |
| `public.resumes` | Resume documents metadata | `id (uuid)` | `user_id -> profiles.id` |
| `public.resume_sections` | Section-level resume content | `id (uuid)` | `resume_id -> resumes.id` |
| `public.career_documents` | AI career documents (CLs, SOPs) | `id (uuid)` | `user_id -> profiles.id` |
| `public.career_document_versions` | Version checkpoint snapshots | `id (uuid)` | `document_id -> career_documents.id` |
| `public.career_document_shares` | Password-gated share links | `id (uuid)` | `document_id -> career_documents.id` |
| `public.organizations` | Multi-tenant groups | `id (uuid)` | — |
| `public.organization_members` | Membership & RBAC mappings | `id (uuid)` | `org_id -> organizations.id`, `user_id -> profiles.id` |
| `public.audit_logs` | Security and compliance logs | `id (bigint)`| `user_id -> profiles.id` |

---

## 🛠️ Technology Stack

*   **Framework**: [Next.js 16.2.9](https://nextjs.org/) (App Router, Turbopack, Server Actions)
*   **UI Library**: [React 19.2.4](https://react.dev/)
*   **Database**: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side-rendering) & [PostgreSQL 15](https://www.postgresql.org/)
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & Vanilla CSS variables
*   **Animations**: [Framer Motion](https://www.framer.com/motion/)
*   **Testing**: Native Node.js test runner (`node:test`)
*   **Types**: Strict [TypeScript 5](https://www.typescriptlang.org/)

---

## 📦 Installation & Setup

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/ResumeAI-Pro.git
cd ResumeAI-Pro
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:password@localhost:5432/AI_resume_Builder
AI_PROVIDER=gemini # options: gemini, openai, anthropic, openrouter
GEMINI_API_KEY=your-api-key
```

### 3. Database Initialization
Run the schema setup script from the Supabase dashboard or locally:
```sql
\i supabase_schema.sql
```

### 4. Running the Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🧪 Testing

We leverage Node's native test runner to certify production readiness. To execute the 18 automated suites:
```bash
npm test
```

---

## 🗺️ Future Roadmap

1.  **Browser PDF Rendering**: Move document parsing to client-side canvas engines to reduce server overhead.
2.  **LinkedIn Auto-Sync Chrome Extension**: Parse experience from profile page DOM elements directly into ResumeAI.
3.  **Real-Time Collaborative Editing**: Operational Transformation (OT) or CRDT sync for multi-user resume review.

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
