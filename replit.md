# COSIRI & GMP Unified Platform

## Overview

A unified enterprise sustainability management platform that merges two assessment tools — COSIRI (Consumer Sustainability Industry Readiness Index) and GMP (Good Manufacturing Practice) — into a single application. Companies register once, select their modules, and get dedicated dashboards for each.

## Architecture

- **Monorepo (pnpm workspaces)**
- **Frontend**: React + Vite (`artifacts/platform/`) — served on port 23633 at path `/`
- **Backend**: Express.js API server (`artifacts/api-server/`) — served on port 8080 at `/api`
- **Database**: PostgreSQL via Drizzle ORM (`lib/db/`)
- **AI**: OpenAI via Replit AI Integrations (for COSIRI insight generation)

## Key Features

### Registration
- Companies register with name, industry, email, and module selection (COSIRI, GMP, or Full Platform)
- Company context stored in localStorage + PostgreSQL `companies` table
- Route: `/` → Registration page

### Hub
- Central dashboard showing active modules
- Route: `/hub`

### COSIRI Module (`/cosiri/*`)
- 24 sustainability dimensions across 4 building blocks (D1-D24, Band 0-5 scoring)
- Building blocks: Strategy & Risk Management, Sustainable Business Processes, Technology, Organisation & Governance
- Radar chart visualization of maturity profile
- AI-powered insights: executive summary, gap analysis, 3-5 year roadmap
- Routes: `/cosiri`, `/cosiri/assessment`, `/cosiri/results/:id`, `/cosiri/report/:id`

### GMP Module (`/gmp/*`)
- Audit checklist across 4 sections: Leadership & Culture, Workforce & Safety, Operations & Quality, Information Security
- Response tracking: Compliant / Partial / Noncompliant / N/A per item
- Findings & CAPA tracking with severity levels (critical/major/minor)
- Routes: `/gmp`, `/gmp/assessments`, `/gmp/assessments/new`, `/gmp/assessments/:id`, `/gmp/findings`

## Database Schema

- `companies` — company registration and module selection
- `cosiri_assessments` — COSIRI assessment records
- `cosiri_answers` — per-dimension scores
- `cosiri_ai_insights` — AI-generated reports (executive summary, gap analysis, roadmap)
- `cosiri_usage_counters` — AI usage tracking
- `gmp_assessments` — GMP audit records with JSONB responses
- `gmp_findings` — findings and CAPA records

## API Endpoints

- `POST /api/companies` — register company
- `GET /api/companies/:id` — get company
- `POST /api/cosiri/assessments` — create assessment
- `GET /api/cosiri/assessments/:id` — get assessment with answers
- `POST /api/cosiri/assessments/:id/answers` — save dimension scores
- `POST /api/cosiri/assessments/:id/ai/generate` — generate AI insight (type: executive_summary | gap_analysis | roadmap)
- `GET /api/cosiri/assessments/:id/ai/insights/latest` — get latest AI insights
- `PUT /api/cosiri/ai/insights/:id` — update insight
- `GET /api/gmp/assessments` — list assessments
- `POST /api/gmp/assessments` — create assessment
- `GET /api/gmp/assessments/:id` — get assessment
- `PUT /api/gmp/assessments/:id/responses` — save checklist responses
- `GET /api/gmp/findings` — list findings
- `POST /api/gmp/findings` — create finding

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, shadcn/ui, Tailwind CSS, wouter, React Query, Recharts, Framer Motion, react-markdown, react-hook-form
- **Backend**: Express.js, TypeScript, Drizzle ORM, PostgreSQL
- **AI**: OpenAI GPT-4o via Replit AI Integrations (uses AI_INTEGRATIONS_OPENAI_API_KEY and AI_INTEGRATIONS_OPENAI_BASE_URL)

## File Structure

```
artifacts/
  platform/          # React frontend
    src/
      pages/
        Registration.tsx
        Hub.tsx
        cosiri/
          CosiriHome.tsx
          CosiriAssessment.tsx
          CosiriResults.tsx
          CosiriReport.tsx
        gmp/
          GmpDashboard.tsx
          GmpAssessmentList.tsx
          GmpNewAssessment.tsx
          GmpAssessmentRunner.tsx
          GmpFindings.tsx
      components/
        layout/Sidebar.tsx
        layout/AppLayout.tsx
        CosiriRadar.tsx
      contexts/CompanyContext.tsx
      lib/cosiri-data.ts  # 24 COSIRI dimensions data
      lib/gmp-data.ts     # GMP checklist template data
  api-server/        # Express API
    src/routes/
      companies.ts
      cosiri.ts      # COSIRI routes + AI generation
      gmp.ts
lib/
  db/src/schema/
    companies.ts
    cosiri.ts
    gmp.ts
  api-spec/openapi.yaml  # OpenAPI spec for all endpoints
```
