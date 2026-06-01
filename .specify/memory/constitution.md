<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles:
- Template placeholders -> Company Simulation First
- Template placeholders -> Three-Leg Operating Loop
- Template placeholders -> Automation as Hands and Feet
- Template placeholders -> Durable Memory and Evidence
- Template placeholders -> Human Leadership and Explainable Advice
- Template placeholders -> Operational Boundaries and Reliability
Added sections:
- Product Boundaries
- Data and AI Architecture
- Development Workflow
Removed sections:
- Placeholder sections from initial Spec Kit template
Templates requiring updates:
- .specify/templates/plan-template.md: updated for Gryyk operating checks
- .specify/templates/spec-template.md: updated for three-leg/data evidence fit
- .specify/templates/tasks-template.md: updated for automation/status/data tasks
Follow-up TODOs:
- None
-->

# Gryyk-47 Constitution

## Core Principles

### I. Company Simulation First

Gryyk-47 MUST be designed as an AI operating layer for running an EVE Online
corporation as a company simulation, not as a generic chatbot. Every material
feature MUST improve the leadership loop of observing the organization,
diagnosing constraints, prioritizing action, executing follow-through, reviewing
outcomes, or learning from results.

Features that only add conversation, decoration, or isolated tools without
strengthening that loop MUST be rejected or moved out of the core product.

### II. Three-Leg Operating Loop

Every strategic feature MUST explicitly map to at least one leg of the operating
stool and SHOULD show how it affects the other two:

- **Numbers**: measurable corporation state, trends, resources, activity,
  throughput, risk, and outcomes.
- **Opportunity**: internal or external openings that can create leverage,
  including market, patch, recruiting, operational, industrial, and diplomatic
  opportunities.
- **People**: members, recruits, leaders, social systems, delegation, retention,
  onboarding, culture, and burnout risk.

Plans and briefs MUST avoid abstract advice when the relevant numbers,
opportunity signals, or people implications are available.

### III. Automation as Hands and Feet

Automation MUST reduce the repetitive management labor required to grow an EVE
corporation. Automated workflows SHOULD create, update, or follow through on
concrete operating artifacts such as briefs, tasks, watchlists, reminders,
meeting agendas, onboarding checklists, after-action review prompts, or strategy
memory updates.

Automation MUST NOT silently make irreversible leadership decisions, mutate
strategic state without traceability, or pretend a queued action has completed.
Every automated action MUST expose current status, failure state, and the next
human decision when applicable.

### IV. Durable Memory and Evidence

Gryyk-47 MUST preserve the distinction between raw evidence, processed analysis,
decisions, and outcomes. Raw inputs such as ESI pulls, official news, market
data, user notes, and operational logs MUST be stored or referenced separately
from AI-generated analysis. Processed briefs and recommendations MUST retain
source references, timestamps, model identity when available, confidence, and
error state.

AI-generated strategy memory MUST be durable, queryable, and revisable. New
memory SHOULD improve future action quality rather than merely archive chat
transcripts.

### V. Human Leadership and Explainable Advice

Gryyk-47 MUST augment the human leader, not replace them. Advice MUST explain
the evidence, assumptions, tradeoffs, and expected outcomes behind recommended
actions. The product SHOULD coach the user as a CEO by surfacing bottlenecks,
decision points, missing follow-through, and likely second-order effects.

People-related analysis MUST be treated as organizational health and leadership
support, not surveillance. Sensitive member, recruit, or leader signals MUST be
presented with care, uncertainty, and actionable support.

### VI. Operational Boundaries and Reliability

Gryyk-47 MUST keep interactive user flows fast and reliable. Long-running
background research, ingestion, and AI processing SHOULD run in durable worker
systems such as OvernightDesk/Hermes, while Gryyk-47 reads processed results and
status. Netlify Functions SHOULD remain short request/response adapters, auth
boundaries, and read/write APIs.

Shared data boundaries MUST be explicit. If multiple systems use MongoDB,
database names, collection ownership, schemas, and status values MUST be
documented in the relevant spec and plan. Secrets MUST remain server-side and
MUST NOT be exposed through Vite client variables.

## Product Boundaries

Gryyk-47 is the interactive command surface for corporation leadership. It owns
login, user experience, chat, decision review, strategy display, and short API
reads/writes.

OvernightDesk/Hermes is the preferred home for durable background work:
scheduled research, expensive AI processing, retries, source ingestion, and
operational auditing.

The product MUST keep these surfaces coherent:

- **Command Brief**: concise current-state view of numbers, opportunity, people,
  active initiatives, stalled work, and recommended next actions.
- **Advisor Chat**: conversational interface grounded in current state, durable
  memory, and available evidence.
- **Strategy Room**: goals, scenarios, decision records, assumptions, playbooks,
  and after-action reviews.
- **Operations Board**: tasks, recurring cadences, assignments, bottlenecks, and
  follow-up loops.
- **Intelligence Desk**: processed external intelligence from OvernightDesk and
  other background systems.

## Data and AI Architecture

Specifications MUST identify:

- the raw data sources used;
- the processed artifacts produced;
- the owner system for each collection or API;
- the status lifecycle for asynchronous work;
- how users can verify or recover from failure;
- which AI model is used and how it can be changed;
- which outputs become durable strategy memory.

The default growth loop is:

```text
Data -> Insight -> Action -> Follow-up -> Outcome -> Memory -> Better Action
```

Features MUST state where they enter and improve this loop.

## Development Workflow

All substantial work MUST start from Spec Kit artifacts before implementation:

1. Update or create a specification with user scenarios and success criteria.
2. Clarify ambiguous business rules before technical planning when needed.
3. Produce an implementation plan with constitution checks.
4. Generate tasks organized by independently testable user stories.
5. Validate with `npm run test:ci` and `npm run build` for Gryyk-47 changes.
6. Preserve existing auth, MongoDB, Netlify, and OvernightDesk boundaries unless
   a spec explicitly changes them.

Brownfield changes MUST respect current application behavior while moving the
architecture toward the constitution. If a quick fix conflicts with these
principles, the conflict MUST be documented and scheduled for cleanup.

## Governance

This constitution supersedes ad hoc product and architecture preferences for
Gryyk-47. All new specs, plans, and implementation reviews MUST check compliance
with the six core principles.

Amendments require:

- a written rationale;
- a version bump using semantic versioning;
- an update to dependent templates or roadmap artifacts when affected;
- a migration note for any existing feature area that becomes non-compliant.

Versioning policy:

- MAJOR: Removes or redefines a core principle or product boundary.
- MINOR: Adds a new principle, product surface, or required workflow standard.
- PATCH: Clarifies wording without changing governance meaning.

**Version**: 1.0.0 | **Ratified**: 2026-05-31 | **Last Amended**: 2026-05-31
