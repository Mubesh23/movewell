# BridgeWell 🏡✨

> **A calmer path forward.**  
> BridgeWell is a collaborative transition workspace designed to help families coordinate the housing, safety, and care transitions of aging parents.

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.js.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-emerald?logo=supabase)](https://supabase.com/)
[![Vitest](https://img.shields.io/badge/Vitest-3.0-green?logo=vitest)](https://vitest.dev/)

---

## 📖 Overview

When an aging parent faces a sudden health event (such as a fall resulting in hospitalization) or a planned move, families are forced to navigate movers, senior move managers, donation services, estate sales, home modifications, and elder care across scattered phone calls and spreadsheets.

There is rarely a single system that answers:
1. **What needs to happen first?**
2. **What depends on something else?**
3. **What will everything cost, and what is the basis for those estimates?**
4. **Who in the family is responsible?**

**BridgeWell** turns that fragmented process into a structured, dependency-aware transition plan with conversational intake led by Nora, an attention-first command center dashboard, external market evidence and quote tracking, Open Referral resource matching, and shared family coordination.

---

## 🌟 Core Architecture & Flow

### 1. Conversational Intake with Nora (`/get-started`)
- Multi-turn conversational consultation guided by **Nora**, an empathetic AI transition planner.
- Interactive vertical **Nora's Notes** accordion continuously organizes senior profile, discharge timeline, mobility/stairs constraints, coordinator identity, local care circle, and budget preferences.
- Zero forced synthetic presets — every plan begins from real family context.

### 2. Proposal Review & Draft Activation (`/draft/[draftId]`)
- Editorial proposal previewing the recommended sequenced transition plan, initial timeline, care circle roles, and cost expectations.
- Requires authentication (Google OAuth or Magic Link) to review and activate the draft into a shared family workspace.

### 3. Family Workspace Hub (`/home`)
- Multi-case family dashboard showing active and shared transitions, progress metrics, and outstanding tasks.

### 4. Attention-First Transition Command Center (`/plan/[caseId]`)
- **Focus Hero Card**: Highlights today's single most critical priority task (*Confirm safe discharge destination*) with direct action buttons.
- **Transition Pulse**: Real-time metrics tracking decision health, velocity, and budget assessment.
- **What Changed**: Transparent, chronological audit log capturing every plan mutation, timeline adjustment, task reassignment, and completion note.
- **Task Sequencer**: Real-time dependency engine recalculating downstream readiness whenever prerequisites are fulfilled.

### 5. Honest Cost Engine & Evidence Grounding (`/plan/[caseId]/budget`)
- Clear separation between `WORKFLOW_PLANNING_RANGE`, `EXTERNAL_EVIDENCE`, `VENDOR_QUOTE`, and `USER_ADJUSTED`.
- Grounded in external public rate sheets, agency rate guides, and industry benchmarks with explicit source citation and source-check dates.
- Preserves confirmed vendor quotes across location changes and avoids double-counting against workflow planning ranges.

### 6. Open Referral / HSDS Community Resource Directory (`/plan/[caseId]/resources` & `/resources`)
- Open Referral HSDS schema (`organizations`, `services`, `locations`, `resource_verifications`).
- Curated pilot resources for Harris County / Greater Houston with honest provenance badges (`Public agency`, `Nonprofit`, `Directory listing`, `Nearby option`).

### 7. Family & Care Circle Coordination (`/plan/[caseId]/family`)
- Staged and live email invitations for family members, local helpers, and professional coordinators.

### 8. Printable Transition Plan (`/plan/[caseId]/print`)
- High-contrast, clean `@media print` formatted view for offline family sharing and discharge planning.

---

## 🏗️ Technical Stack & Project Structure

```text
src/
├── app/                  # Next.js App Router pages & API endpoints
│   ├── page.tsx          # Landing page
│   ├── get-started/      # Conversational intake with Nora
│   ├── draft/[draftId]/  # Proposal review & workspace activation
│   ├── home/             # Authenticated family case dashboard
│   ├── plan/[caseId]/    # Command center, budget, family, resources, print
│   ├── resources/        # Public community directory
│   └── api/              # Secure endpoints for cases, tasks, drafts, AI
├── components/           # UI components, layout shells, Nora assistant
├── domain/ & types/      # Pure TypeScript domain interfaces
├── db/                   # Repository pattern, Supabase client & in-memory fallback
├── services/             # Task service, planning engine, cost engine, evidence service
└── __tests__/            # Comprehensive Vitest test suite
```

- **Framework**: Next.js 14+ (App Router), React 18, TypeScript (Strict)
- **Styling**: Tailwind CSS (custom Warm Sand, Sage & Evergreen palette)
- **Database**: Supabase PostgreSQL with SQL migrations & in-memory fallback store
- **Authentication**: Supabase Auth (Google OAuth)
- **AI Synthesis**: Google Gemini via `@google/genai`
- **Testing**: Vitest test runner with unit and integration coverage

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

1. **Clone repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/movewell.git
   cd movewell
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env.local` file based on `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
   Add your Supabase and Gemini API credentials.

4. **Run development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 🧪 Testing & Verification

Run the automated test suite:
```bash
npm run test
```

Run TypeScript typecheck:
```bash
npm run typecheck
```

Run ESLint:
```bash
npm run lint
```

Run production build:
```bash
npm run build
```

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.
