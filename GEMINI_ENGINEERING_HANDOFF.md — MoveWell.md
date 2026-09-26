# MoveWell Engineering Handoff

## Objective

Build a hackathon-ready MVP of **MoveWell**, a responsive web application that coordinates the housing transition of an aging parent.

The engineering priority is:

**functional completeness + clean domain architecture + reliable demo**

rather than production-scale infrastructure.

Use a **modular monolith**, not microservices.

---

# 1. Recommended Stack

## Application

```text
Next.js
TypeScript
React
Tailwind CSS
shadcn/ui
```

Use the App Router.

## Deployment

```text
Vercel
```

GitHub pushes should automatically deploy.

## Database / Storage

```text
Supabase
```

Use:

- PostgreSQL;
- optional Supabase Auth;
- Supabase Storage if uploads are implemented.

## AI

Use a server-side model API supporting:

- structured output;
- tool/function calling.

Model API keys must never be exposed to the browser.

---

# 2. Deployment Architecture

```text
GitHub
   ↓
Vercel

Next.js application
├── React UI
├── server routes/actions
├── domain services
├── planning engine
└── AI orchestrator
        ↓
     Supabase
     ├── PostgreSQL
     ├── Auth
     └── Storage
```

Do not introduce:

- Kubernetes;
- ECS;
- Lambda;
- API Gateway;
- Kafka;
- separate service deployments;
- a standalone mobile backend.

The architecture can preserve logical service boundaries without physically deploying services separately.

---

# 3. Suggested Project Structure

```text
src/

  app/
    page.tsx

    start/

    plan/
      [caseId]/
        page.tsx
        tasks/
        resources/
        budget/
        family/
        print/

    api/
      ai/
      cases/
      resources/

  components/
    dashboard/
    intake/
    tasks/
    resources/
    budget/
    family/
    assistant/
    shared/

  domain/
    cases/
    planning/
    tasks/
    resources/
    budgets/
    family/
    events/

  services/
    case-service.ts
    planning-engine.ts
    task-service.ts
    resource-service.ts
    cost-engine.ts
    event-service.ts
    ai-orchestrator.ts

  workflows/
    planned-downsize.ts
    post-hospital.ts
    age-in-place.ts
    emergency-displacement.ts
    loss-of-spouse.ts

  ai/
    prompts/
    schemas/
    tools/

  db/
    schema/
    repositories/
    seeds/

  lib/
```

---

# 4. Core Domain Model

## TransitionCase

Root aggregate.

```ts
type TransitionCase = {
  id: string;
  seniorProfileId: string;

  transitionType: TransitionType;
  urgency: Urgency;

  zipCode: string;

  targetDate?: Date;

  housingStatus?: HousingStatus;
  destinationStatus?: DestinationStatus;

  budget?: number;

  createdAt: Date;
  updatedAt: Date;
};
```

---

# 5. Transition Types

```ts
type TransitionType =
  | "PLANNED_DOWNSIZE"
  | "POST_HOSPITAL"
  | "AGE_IN_PLACE"
  | "EMERGENCY_DISPLACEMENT"
  | "LOSS_OF_SPOUSE";
```

Urgency:

```ts
type Urgency =
  | "PLANNED"
  | "URGENT"
  | "IMMEDIATE";
```

---

# 6. Senior Profile

Possible MVP fields:

```ts
type SeniorProfile = {
  id: string;
  caseId: string;

  name?: string;

  ageRange?: string;

  livesAlone?: boolean;

  mobilityConstraint?: boolean;

  stairsConstraint?: boolean;

  immediateSafetyConcern?: boolean;

  homeType?: string;

  ownsHome?: boolean;
};
```

Avoid storing unnecessary sensitive medical data.

---

# 7. Case Members

Model family/helper collaboration structurally.

```ts
type CaseMember = {
  id: string;
  caseId: string;

  name: string;

  relationship?: string;

  city?: string;

  isLocal: boolean;

  availability?: string;

  role: CaseMemberRole;
};
```

Possible roles:

```text
OWNER

FAMILY

HELPER

PROFESSIONAL
```

MVP permissions may be simple.

Keep the model extensible.

---

# 8. Task Model

```ts
type TransitionTask = {
  id: string;
  caseId: string;

  templateId?: string;

  title: string;
  description?: string;
  whyItMatters?: string;

  status: TaskStatus;

  priority: number;

  dueDate?: Date;

  assigneeId?: string;

  minEstimatedCost?: number;
  maxEstimatedCost?: number;

  createdAt: Date;
  updatedAt: Date;
};
```

Statuses:

```text
NOT_STARTED

READY

BLOCKED

IN_PROGRESS

COMPLETED

SKIPPED
```

---

# 9. Task Dependencies

```ts
type TaskDependency = {
  taskId: string;
  dependsOnTaskId: string;
};
```

A task is:

```text
BLOCKED
```

when incomplete dependencies remain.

Dependency evaluation should be deterministic.

---

# 10. Workflow Templates

Workflow templates should live in code for the hackathon.

Example:

```ts
const postHospitalWorkflow = {
  type: "POST_HOSPITAL",

  tasks: [
    {
      id: "safe-destination",
      title: "Confirm safe discharge destination"
    },

    {
      id: "accessibility",
      title: "Assess immediate accessibility needs"
    },

    {
      id: "housing-decision",
      title: "Decide temporary vs. permanent housing",
      dependsOn: ["safe-destination"]
    }
  ]
};
```

Do not depend on the LLM to generate these structures from scratch.

---

# 11. Planning Engine

Responsibilities:

```text
select workflow

apply case rules

include/exclude tasks

construct dependency graph

calculate priorities

calculate suggested dates

attach cost categories

attach resource categories
```

Input:

```text
TransitionCase
SeniorProfile
CaseMembers
```

Output:

```text
TransitionPlan
```

---

# 12. Rules Engine

Rules can initially be TypeScript predicates.

Example:

```ts
if (
  caseData.transitionType === "POST_HOSPITAL" &&
  senior.stairsConstraint &&
  caseData.destinationStatus === "RETURN_HOME"
) {
  addTask("home-accessibility-assessment");
}
```

Prefer deterministic logic.

LLM use should not replace business rules.

---

# 13. Case Event Model

Create an event whenever meaningful state changes.

```ts
type CaseEvent = {
  id: string;
  caseId: string;

  type: CaseEventType;

  actorType: "USER" | "AI" | "SYSTEM";

  actorId?: string;

  payload: unknown;

  createdAt: Date;
};
```

Examples:

```text
CASE_CREATED

PLAN_GENERATED

TASK_CREATED

TASK_UPDATED

TASK_COMPLETED

TASK_ASSIGNED

BUDGET_UPDATED

TARGET_DATE_UPDATED

RESOURCE_SAVED

PLAN_REGENERATED
```

Use events to generate the activity timeline.

AI mutations must produce events.

---

# 14. Resource Domain

Model resources using Open Referral / HSDS concepts.

## Organization

```text
id
name
description
website
```

## Service

```text
id
organizationId
name
category
description
costType
```

## Location

```text
id
organizationId
address
city
state
zipCode
latitude
longitude
```

Additional tables/entities:

```text
service_locations

service_areas

contacts

languages

eligibilities

resource_verifications
```

Do not flatten everything into one table unless time constraints absolutely require it.

---

# 15. Resource Search

MVP matching can use normal SQL.

Example query inputs:

```text
category

zipCode

serviceArea

language
```

Do not add a vector database unless a demonstrated need arises.

AI tool:

```text
find_resources(category, zipCode)
```

should call the ResourceService.

---

# 16. Verification

Resource verification fields:

```text
verificationStatus

verificationSource

lastVerifiedAt
```

MVP label:

**Verified listing**

Do not label providers as recommended or trusted without evidence.

---

# 17. Cost Engine

Use deterministic ranges.

Possible cost definitions:

```ts
type CostModel = {
  category: string;

  minimum: number;
  maximum: number;

  unit: string;

  conditions?: Record<string, unknown>;
};
```

Example categories:

```text
LOCAL_MOVE

PACKING

STORAGE

CLEANING

JUNK_REMOVAL

MINOR_REPAIRS

HOME_MODIFICATION
```

Cost engine responsibilities:

```text
select applicable ranges

calculate plan minimum

calculate plan maximum

compare to user budget

calculate gap
```

---

# 18. AI Orchestrator

The AI should operate through explicit tools.

Do not expose database primitives.

Example tools:

```text
get_case

get_plan

update_case_context

assign_task

reschedule_task

complete_task

add_task

remove_task

find_resources

recalculate_budget

regenerate_plan

generate_printable_plan
```

AI responsibilities:

- extract structured information from intake;
- ask necessary follow-up questions;
- explain tasks;
- interpret natural-language modifications;
- call tools.

The AI does NOT own:

- task dependency evaluation;
- arithmetic;
- resource database truth;
- final workflow rules.

---

# 19. Example AI Mutation

User:

> Jennifer can handle packing.

Flow:

```text
User
 ↓
AI Orchestrator
 ↓
identify member = Jennifer
 ↓
identify packing tasks
 ↓
assign_task()
 ↓
Task Service
 ↓
Database
 ↓
CaseEvent:
TASK_ASSIGNED
```

UI response:

```text
Plan updated

3 packing tasks assigned to Jennifer.
```

---

# 20. Intake

Use structured model output.

Example extraction schema:

```json
{
  "transitionType": "POST_HOSPITAL",
  "urgency": "URGENT",
  "livesAlone": true,
  "stairsConstraint": true,
  "targetDate": null,
  "dischargeDate": "2026-10-01",
  "zipCode": "77004",
  "budget": 8000
}
```

Do not persist arbitrary LLM prose as critical case state.

---

# 21. Authentication

For the hackathon:

**authentication is optional.**

Preferred order:

### Simplest

Generate anonymous case ID.

### If needed

Use Supabase magic-link authentication.

Do not spend significant hackathon time on identity flows.

---

# 22. Storage

If implementing uploads:

Use Supabase Storage for:

- optional documents;
- receipts;
- eventual provider photos.

Uploads are not P0.

---

# 23. Printable Export

Simplest implementation:

```text
/plan/:id/print
```

Use print-specific CSS.

Provide:

```text
window.print()
```

Users can select:

**Save as PDF**

Avoid dedicated PDF-generation infrastructure for MVP.

---

# 24. Responsive/PWA Strategy

Build a single responsive application.

Desktop target:

```text
1440×1024
```

Mobile target:

```text
390×844
```

No separate native application.

If time permits:

- PWA manifest;
- installable experience;
- basic offline shell.

Offline behavior is optional for this challenge.

---

# 25. Seed Data

Seed approximately:

```text
40–60 local resources
```

covering:

- Area Agency on Aging;
- movers;
- senior move managers;
- donation services;
- estate-sale services;
- contractors;
- accessibility/home modifications;
- cleaning;
- transportation;
- storage;
- legal resources.

Store source/verification metadata.

---

# 26. Suggested Build Order

## Phase 1

Database schema.

## Phase 2

Workflow templates.

## Phase 3

Planning Engine.

## Phase 4

Case + task APIs.

## Phase 5

Intake UI.

## Phase 6

Transition Dashboard.

## Phase 7

Resource directory.

At this point the core product works.

## Phase 8

Cost engine.

## Phase 9

AI orchestrator.

## Phase 10

Family assignments/activity timeline.

## Phase 11

Printable export.

## Phase 12

Polish/demo data.

---

# 27. Golden Demo Scenario

Seed/demo case:

```text
Maria Thompson
Age 78

Houston

Lives alone

Two-story home

Recently hospitalized after fall

Hospital discharge in 5 days

Cannot safely navigate stairs

Daughter Sarah lives in Chicago

Sister Jennifer lives in Houston

Budget: $8,000
```

Demo flow:

1. Enter scenario through intake.
2. Generate plan.
3. Show urgent tasks.
4. Show resources.
5. Show estimated cost.
6. Ask:

   “Jennifer can handle packing.”

7. Show tasks reassigned.
8. Ask:

   “We only have $5,000.”

9. Show recalculated budget and alternatives.
10. Export plan.

---

# 28. Acceptance Criteria

A successful MVP should demonstrate:

- a user can create a transition case;
- intake generates structured context;
- the system chooses an appropriate workflow;
- task dependencies are represented;
- the dashboard surfaces next actions;
- local resources appear based on relevant tasks;
- costs are calculated deterministically;
- family members can receive task assignments;
- AI can modify structured state using tools;
- AI changes appear in the activity history;
- the plan can be printed/exported;
- the experience works on mobile and desktop.

---

# 29. Engineering Principle

The central separation is:

```text
Planning Engine
determines transition structure

AI
interprets user intent and operates tools
```

Do not collapse these into one large prompt.

That separation is fundamental to the product.