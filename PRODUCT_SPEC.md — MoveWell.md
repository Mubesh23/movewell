# MoveWell Product Specification

## 1. Product Summary

**MoveWell** helps families coordinate the housing transition of an aging parent.

Typical situations include:

- planned downsizing;
- post-hospitalization transition;
- a home becoming unsafe or inaccessible;
- aging in place with home modifications;
- death of a spouse or caregiver;
- hurricane or emergency displacement.

The primary user is usually an adult child coordinating a complex transition while working full time, possibly raising children, and often living in another city.

The core problem is not a lack of services. Families must independently find and coordinate:

- movers;
- senior move managers;
- donation services;
- estate-sale companies;
- junk removal;
- cleaners;
- contractors;
- home-modification services;
- realtors;
- senior housing resources;
- transportation;
- public assistance;
- elder-law resources.

There is no single place that explains:

1. what needs to happen;
2. what should happen first;
3. what depends on something else;
4. what things might cost;
5. who can help;
6. who in the family is responsible.

MoveWell turns that fragmented process into a structured transition plan.

### Product promise

> Tell us what happened, and MoveWell will show you what to do next, what it may cost, who can help, and how your family can coordinate the work.

---

# 2. Product Philosophy

MoveWell is **not primarily a chatbot**.

It is a **transition-management platform with an AI interface**.

The central product object is a structured transition plan containing:

- tasks;
- dependencies;
- deadlines;
- costs;
- resources;
- family assignments;
- progress;
- case history.

The AI helps the user understand and modify this structure.

### Key distinction

Directories provide resources.

Chatbots provide advice.

**MoveWell manages the transition.**

---

# 3. Primary Persona

Example persona:

**Sarah, 48**
- lives in Chicago;
- works full time;
- has two children;
- mother Maria lives alone in Houston;
- Maria was recently hospitalized after a fall;
- Sarah's sister Jennifer lives locally;
- Maria can no longer safely navigate her two-story house;
- discharge is in five days.

Sarah needs to understand:

- what must happen before discharge;
- whether Maria can safely return home;
- which decisions are urgent;
- what services are needed;
- approximately what everything costs;
- what Sarah can handle remotely;
- what Jennifer needs to handle locally.

MoveWell should reduce Sarah's mental load.

---

# 4. Supported Transition Types

Initial workflow templates:

```text
PLANNED_DOWNSIZE

POST_HOSPITAL

AGE_IN_PLACE

EMERGENCY_DISPLACEMENT

LOSS_OF_SPOUSE
```

These are starting templates, not rigid workflows.

Case context modifies which tasks appear and how they are sequenced.

---

# 5. Core User Journey

```text
Explain situation
      ↓
Structured intake
      ↓
Urgency assessment
      ↓
Generate transition plan
      ↓
Review immediate priorities
      ↓
Assign tasks
      ↓
Find local resources
      ↓
Estimate costs
      ↓
Execute transition
      ↓
Update plan as circumstances change
```

Target:

A new user should reach a useful personalized plan within approximately **2 minutes**.

---

# 6. Intake

The intake experience should combine:

- conversational input;
- structured controls;
- progressive questions.

Initial prompt:

> What's happening with your parent?

Possible options:

- Planning to downsize
- Returning home after hospitalization
- Home is no longer safe
- Emergency or storm displacement
- Death of spouse or caregiver
- Other

Common structured fields include:

## Senior

- age range;
- lives alone;
- mobility constraints;
- stairs;
- immediate safety concerns.

## Home

- ZIP code;
- own or rent;
- home size;
- single-story or multi-story;
- sell / rent / undecided.

## Transition

- target date;
- urgency;
- destination known;
- keep / sell / donate / store belongings;
- approximate budget.

## Family

- family/helper names;
- location;
- availability;
- ability to help locally/remotely.

The AI should ask only questions that materially affect the plan.

---

# 7. Urgency Model

Cases should be classified into:

```text
PLANNED
URGENT
IMMEDIATE
```

Examples:

### Planned

Parent wants to downsize within several months.

Optimize for:

- convenience;
- cost;
- scheduling;
- family availability.

### Urgent

Hospital discharge in several days.

Prioritize:

- safe destination;
- accessibility;
- immediate housing decisions;
- critical transition tasks.

### Immediate

Parent currently has no safe place to stay or faces an immediate safety threat.

Normal transition planning should pause while the app surfaces appropriate emergency/public resources.

MoveWell does not provide medical diagnoses or emergency medical guidance.

---

# 8. Transition Dashboard

The dashboard should be **attention-first**, not project-management-first.

Its primary purpose is to answer:

> What needs my attention right now?

Example:

```text
Maria's Transition
Post-hospital transition

URGENT
Discharge in 5 days

32% complete

Target move
November 7

Estimated cost
$5,800–$9,400
```

Then:

```text
NEEDS ATTENTION

1. Confirm safe discharge destination
   Due today

2. Decide temporary vs permanent housing
   Due tomorrow

3. Request moving estimates
   Due Friday
```

Secondary information:

- blocked tasks;
- tasks waiting on family;
- next milestone;
- family activity;
- recommended resources;
- cost status.

Avoid turning the home screen into Jira.

---

# 9. Transition Planning Engine

The Planning Engine owns the structure of the transition.

The LLM should not independently invent entire plans.

Core components:

```text
Workflow Template Registry

Rules Engine

Plan Personalizer

Dependency Engine

Scheduling Engine
```

Example rule:

```text
IF
transition_type = POST_HOSPITAL

AND stairs_constraint = true

AND returning_home = true

THEN
add accessibility/home-safety task
```

Example dependency:

```text
Choose destination
      ↓
Obtain moving quote
      ↓
Book mover
      ↓
Pack
      ↓
Move
```

The planning engine should remain deterministic wherever possible.

---

# 10. Task Model

Each task should include:

```text
id
caseId
templateId

title
description
whyItMatters

status
priority

dueDate
assignee

minEstimatedCost
maxEstimatedCost

dependencies

resourceCategories

notes
```

Potential statuses:

```text
NOT_STARTED

READY

BLOCKED

IN_PROGRESS

COMPLETED

SKIPPED
```

---

# 11. Case and Family Model

The root domain object is:

```text
TransitionCase
```

A case contains:

```text
SeniorProfile

CaseMembers

Tasks

TaskDependencies

BudgetItems

MatchedResources

CaseEvents

ConversationContext
```

Family members/helpers should be modeled as case memberships rather than arbitrary text fields.

Example:

```text
CaseMember

name
relationship
location
role
availability
permissions
```

Long term this allows:

- family collaboration;
- social-worker access;
- service-provider access;
- limited sharing.

---

# 12. Case Event Model

Every meaningful change should create a structured event.

Examples:

```text
CASE_CREATED

PLAN_GENERATED

TASK_CREATED

TASK_COMPLETED

TASK_ASSIGNED

TASK_RESCHEDULED

BUDGET_UPDATED

RESOURCE_SAVED

TARGET_DATE_CHANGED

PLAN_REGENERATED
```

Example:

```text
Sarah assigned “Pack bedroom” to Jennifer.
2 minutes ago
```

Benefits:

- family activity history;
- auditability;
- AI context;
- notifications;
- future summaries;
- explainability.

AI-driven changes must also create events.

The user should be able to understand what MoveWell changed.

---

# 13. Resource Model

MoveWell should use an **Open Referral / HSDS-inspired resource model**.

Avoid one giant flat `Resource` record.

Prefer:

```text
Organization
     ↓
Service
     ↓
Location
```

Related entities include:

```text
ServiceArea

Contact

Language

Eligibility

Schedule

Verification
```

Example:

```text
Organization:
Houston Furniture Bank

Service:
Furniture donation

Service Area:
Harris County

Languages:
English
Spanish

Contact:
Phone
Website

Verification:
Verified listing
Last checked Sep 2026
```

Potential categories:

- public aging assistance;
- senior move management;
- movers;
- senior housing;
- estate sales;
- donations;
- junk removal;
- storage;
- cleaning;
- contractors;
- home accessibility modifications;
- realtors;
- transportation;
- elder law.

---

# 14. Resource Trust Model

Do not imply provider endorsement without a legitimate vetting mechanism.

For MVP use terminology such as:

**Verified listing**

Possible future states:

```text
UNVERIFIED

CONTACT_VERIFIED

SERVICE_VERIFIED

PARTNER_VERIFIED

COMMUNITY_REVIEWED
```

Include:

```text
verificationSource
lastVerifiedAt
```

---

# 15. Budget and Cost Model

Each relevant task may include a planning cost range.

Example:

```text
Moving              $1,200–$2,400
Packing               $600–$1,100
Junk removal          $300–$700
Cleaning              $250–$450
Minor repairs         $800–$2,500
Storage               $120–$250/month
```

Clearly state:

> Planning estimates, not vendor quotes.

The app should calculate:

```text
minimum estimate

expected estimate

maximum estimate

user budget

estimated budget gap
```

Potential alternatives:

```text
professional packing → family packing

paid disposal → donation pickup

temporary storage → direct donation

cosmetic repairs → defer
```

Actual arithmetic must be deterministic.

---

# 16. AI Responsibilities

The AI has four major responsibilities.

## Intake extraction

Convert natural language into structured case data.

## Missing-information detection

Ask only questions required to make the plan useful.

## Explanation

Explain:

- why tasks exist;
- why tasks are blocked;
- why resources were shown;
- how costs were calculated.

## Controlled plan modification

Users may say:

> Jennifer can handle packing.

> Mom wants to stay home.

> My brother can't come next weekend.

> We only have $5,000.

The AI should modify the product through controlled tools.

---

# 17. AI Tool Model

Example application tools:

```text
get_case()

get_plan()

update_case_context()

create_task()

remove_task()

reschedule_task()

assign_task()

complete_task()

find_resources()

estimate_cost()

recalculate_budget()

regenerate_plan()

generate_printable_plan()
```

The AI should never directly write arbitrary database state.

Tool calls should invoke application services.

Architecture:

```text
User
 ↓
AI Orchestrator
 ↓
Tool Layer
 ↓
Application Services
 ↓
Database
```

---

# 18. Family Collaboration

MVP collaboration:

- family members;
- task assignment;
- location;
- availability;
- task status;
- activity history.

Later:

- invites;
- limited permissions;
- magic links;
- provider sharing;
- comments;
- notifications.

Future example:

> Share moving details with mover.

The mover receives access only to:

- move date;
- relevant addresses;
- task notes;
- contact information.

Not the entire family case.

---

# 19. Printable Plan

Users should be able to export or print a simplified transition plan.

Include:

- senior name;
- transition goal;
- target date;
- major tasks;
- task owners;
- important contacts;
- cost summary;
- relevant notes.

MVP implementation:

**print-friendly HTML + browser Print / Save as PDF**

No dedicated PDF backend required initially.

---

# 20. Product Surfaces

Initial routes:

```text
/
Landing

/start
Guided intake

/plan/:id
Transition dashboard

/plan/:id/tasks
Tasks and timeline

/plan/:id/resources
Resources

/plan/:id/budget
Budget

/plan/:id/family
Family

/plan/:id/print
Printable plan
```

AI can appear as a drawer/sheet accessible throughout the plan.

---

# 21. Mobile Strategy

The first release is a **responsive web application / PWA**.

Do not build a separate native application for the hackathon.

Desktop and mobile use the same codebase and backend.

Suggested mobile navigation:

```text
Home

Tasks

Resources

Family

More
```

Mobile should prioritize:

- today's tasks;
- urgent items;
- completing tasks;
- calling resources;
- checking transition status;
- assigning tasks;
- asking MoveWell questions.

---

# 22. MVP Scope

## P0 — Must work

- guided intake;
- structured case creation;
- workflow templates;
- personalized transition plan;
- task dependencies;
- dashboard;
- resource directory;
- resource matching.

## P1 — Strong demo

- AI-driven plan updates;
- cost estimator;
- family assignments;
- activity timeline;
- printable plan.

## P2 — Later

- SMS/email notifications;
- provider accounts;
- actual expense tracking;
- advanced resource verification;
- multi-language support;
- live provider booking;
- native application;
- hospital integration;
- MLS integration.

---

# 23. Things We Are Explicitly Not Building

For the hackathon:

- marketplace;
- payment processing;
- live vendor bookings;
- provider reviews;
- MLS search;
- insurance integration;
- hospital integration;
- medical decision support;
- complicated authentication;
- native mobile app;
- distributed microservice infrastructure.

---

# 24. Open-Source Inspiration

### Kintwadi

Borrow concepts around:

- case/circle membership;
- shared record;
- activity timeline;
- role-aware family collaboration.

### OpenCare

Borrow concepts around:

- attention-first dashboard;
- caregiver coordination;
- low-friction helper access;
- shared expense concepts.

### Open Referral / HSDS / ORServices

Borrow:

- structured resource taxonomy;
- organization/service/location separation;
- geo-aware resource discovery.

### MoveWell's Unique Layer

The key differentiator remains:

**dependency-aware senior housing transition orchestration.**

---

# 25. Success Metric for the Prototype

A judge should be able to see a user go from:

> “My mom fell and gets discharged next week.”

to:

- structured case;
- prioritized action plan;
- timeline;
- cost estimate;
- local resources;
- assigned family tasks;
- AI-assisted plan changes;

within a short live demo.

The ideal reaction is:

> “I would actually use this if my family were going through this.”