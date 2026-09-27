# MoveWell 🏡✨

> **A calmer path forward.**  
> MoveWell is a responsive Progressive Web App (PWA) designed to help families coordinate the housing transition of an aging parent.

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.js.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-emerald?logo=supabase)](https://supabase.com/)
[![Vitest](https://img.shields.io/badge/Vitest-3.0-green?logo=vitest)](https://vitest.dev/)

---

## 📖 Overview

When an aging parent faces a sudden health event (such as a fall resulting in hospitalization) or a planned move, families are forced to independently navigate movers, senior move managers, donation services, estate sales, junk removal, home modifications, and elder care. 

There is rarely a single place that answers:
1. **What needs to happen first?**
2. **What depends on something else?**
3. **What will everything cost?**
4. **Who in the family is responsible?**

**MoveWell** turns that fragmented process into a structured, dependency-aware transition plan with an attention-first command center dashboard, local resource matching, deterministic cost models, and a conversational AI transition assistant.

---

## 🌟 Core Features

### 1. Guided Intake & Golden Scenario
- Progressive intake flow (`/start`) capturing senior mobility constraints, hospital discharge timelines, stairs hazards, ZIP codes, and family roles.
- **1-Click Golden Demo Scenario**: Instant load preset for **Maria Thompson** (age 78, Houston TX, hospitalized after a fall, 5 days to discharge, two-story house, $8,000 budget, daughter Sarah coordinating remotely from Chicago, sister Jennifer supporting locally).

### 2. Attention-First Transition Command Center
- Responsive command center dashboard (`/plan/[caseId]`) showing:
  - **Urgency Alert Banner** (`URGENT` / `IMMEDIATE` / `PLANNED`)
  - **Metric Pills**: Days until discharge, overall progress %, cost range vs budget, target transition date.
  - **"Guided Calm" Focus Hero Card**: Highlights today's single most critical priority task (*Confirm safe discharge destination*) with direct action buttons.
  - **Family Team Summary**: Assigned task counts for remote coordinators and local helpers.
  - **Budget Overview Widget**: Cost range vs family budget with clear planning disclaimers.
  - **Case Activity Log**: Chronological audit trail of user and AI actions.

### 3. Deterministic Task Dependency Engine
- Workflow templates in code (`src/workflows/post-hospital.ts`) categorized into ordered phases:
  - **Right now**: Discharge destination, accessibility needs, housing decisions.
  - **This week**: Return feasibility, belongings inventory, moving estimates.
  - **Next**: Belongings strategy, booking movers.
  - **Move week**: Home preparation & move execution.
  - **After move**: Final cleanout & settling in.
- **Real-Time Readiness Shifts**: Completing a blocking task automatically shifts downstream tasks from `BLOCKED` to `READY`.

### 4. Deterministic Cost Engine & Quote Intelligence
- Calculates min/max planning cost ranges across transition phases.
- **Moving Quote Intelligence**: Extracts vendor quotes from PDF/text documents via Gemini without altering the family's total available budget.
- Confirmed vendor quotes (`CostItem`) cleanly substitute for estimated task ranges in cost calculations to avoid double-counting.
- Mandatory product disclaimer:
  > *"Planning estimates, not vendor quotes."*

### 5. Open Referral / HSDS Resource Directory
- Open Referral HSDS schema (`organizations`, `services`, `locations`, `resource_verifications`).
- Seed data for verified Houston providers (senior move managers, moving services, donation centers, junk removal, home accessibility modifications, climate storage).
- Directory view (`/plan/[caseId]/resources`) with category filter pills and **Verified listing** trust badges.

### 6. Conversational AI Assistant (Nora)
- Multi-turn transition companion powered by Gemini Flash:
  - Grounded 2-pass architecture (Pass 1 tool calling -> Service execution -> Pass 2 synthesis).
  - Explicit mutation policies (only mutates case state on explicit user command or confirmed real-world decision).
  - Strict grounding discipline: Never fabricates partnerships, certifications, or unverified claims.
  - Understands context, pronouns, and follow-ups.
  - Proactive next-step proposals and action chips.

### 7. Printable Transition Plan
- Clean `@media print` formatted view (`/plan/[caseId]/print`) for printing or PDF export.

---

## 🏗️ Architecture & Stack

MoveWell is built as a clean **Modular Monolith**:

```text
src/
├── app/                  # Next.js App Router pages & API endpoints
│   ├── page.tsx          # Landing page & Golden Scenario launcher
│   ├── start/            # Multi-step Guided Intake wizard
│   ├── plan/[caseId]/    # Dashboard, Tasks, Resources, Budget, Family, Print
│   └── api/              # Cases, Tasks, Resources, AI Chat endpoints
├── components/           # UI components, layout shell, AIAssistant
├── domain/ & types/      # Pure TypeScript domain models
├── workflows/            # Deterministic transition templates
├── services/             # Planning Engine, Task Service, Cost Engine, AI Orchestrator
├── db/                   # Repositories, memory store fallback, SQL migrations
└── __tests__/            # Vitest unit test suite
```

- **Framework**: Next.js 14+ (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS (custom Sand & Deep Forest palette)
- **Database**: Supabase PostgreSQL with SQL migrations & in-memory fallback store
- **Testing**: Vitest test runner

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

3. **Run local development server**:
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

Run Linter:
```bash
npx eslint src --ext .ts,.tsx
```

Run production build:
```bash
npm run build
```

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.
