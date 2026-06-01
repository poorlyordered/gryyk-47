# Gryyk-47 Operating System Roadmap

## North Star

Gryyk-47 becomes the AI operating layer for running an EVE Online corporation as
a company simulation. It should help a human leader understand the corporation,
spot leverage, coordinate people, execute follow-through, and learn from
outcomes.

The product is not only a chatbot. Chat is one interface into a larger operating
loop:

```text
Data -> Insight -> Action -> Follow-up -> Outcome -> Memory -> Better Action
```

Every roadmap phase should strengthen at least one of the three legs:

- **Numbers**: measurable state, activity, ISK, throughput, risks, and results.
- **Opportunity**: openings from patches, market movement, recruiting, industry,
  operations, diplomacy, and external intelligence.
- **People**: members, recruits, leaders, culture, onboarding, retention,
  delegation, and burnout risk.

## System Roles

- **Gryyk-47**: interactive command surface. Owns login, chat, command brief,
  decision review, short Netlify APIs, and user-facing strategy workflows.
- **OvernightDesk/Hermes**: durable background worker layer. Owns scheduled
  research, slow AI processing, retries, external data collection, and long
  running operational analysis.
- **MongoDB Atlas**: shared persistence, initially retained as the source of
  truth for research requests, processed briefs, strategy memory, and future
  operating artifacts. Collection ownership and schemas must be explicit before
  new writes are added.

## Product Surfaces

- **Command Brief**: current-state summary of numbers, opportunity, people,
  active initiatives, stalled work, and recommended next actions.
- **Advisor Chat**: conversational interface grounded in current state, evidence,
  and durable strategy memory.
- **Strategy Room**: goals, scenarios, assumptions, decision records, playbooks,
  and after-action reviews.
- **Operations Board**: tasks, cadences, assignments, bottlenecks, reminders, and
  follow-up loops.
- **Intelligence Desk**: processed external intelligence from OvernightDesk and
  other background systems.
- **Data and Memory Admin**: source visibility, sync health, memory review, and
  deletion/correction workflows.

## Phase 0: Spec Kit Foundation

**Goal**: Establish the governing product direction before more implementation.

**Scope**

- Create the Gryyk-47 constitution.
- Align Spec Kit templates with the constitution.
- Record this roadmap as the initial product map.
- Preserve the current working OvernightDesk research-read integration.

**Success Criteria**

- New specs must identify three-leg fit, evidence boundaries, automation
  boundaries, and operating owner systems.
- Long-running research and AI processing remain outside Netlify Functions.
- MongoDB secrets stay server-side only.

**Status**: Current phase.

## Phase 1: Command Brief MVP

**Goal**: Make Gryyk useful immediately on load by showing the current operating
state instead of making the user ask for everything through chat.

**Primary Leg**: Opportunity

**Secondary Legs**: Numbers and People

**Deliverables**

- A first-screen command brief assembled from latest processed OvernightDesk
  research, existing strategy memory, auth context, and known corporation data.
- Clear status cards for research freshness, source count, model, confidence,
  and failure state.
- A concise "next actions" section that separates recommendations from decisions
  the user must make.
- Chat grounding that can reference the currently loaded command brief.

**Success Criteria**

- User can log in and see the latest processed research brief without triggering
  a new background job.
- User can tell whether intelligence is fresh, stale, processing, or failed.
- Chat responses can cite the loaded brief and identify the next human decision.

## Phase 2: Numbers Layer

**Goal**: Build a measurable view of corporation health and operating capacity.

**Primary Leg**: Numbers

**Deliverables**

- Define the first KPI set: activity, member count, participation, corporation
  wallet/industry signals where available, killmail signals, and operational
  throughput.
- Create ingestion contracts for ESI and any manually entered metrics.
- Store raw pulls separately from processed KPI snapshots.
- Add trend summaries and anomalies to the command brief.

**Success Criteria**

- The user can see whether the corporation is growing, shrinking, stalling, or
  overextended based on evidence.
- AI recommendations distinguish measured facts from assumptions.

## Phase 3: Opportunity Pipeline

**Goal**: Convert external and internal signals into a ranked opportunity queue.

**Primary Leg**: Opportunity

**Deliverables**

- Opportunity entity with source, thesis, affected corp capabilities, expected
  upside, cost, risk, urgency, and confidence.
- Weekly OvernightDesk research job that produces structured opportunities, not
  only narrative briefs.
- Gryyk UI for reviewing, accepting, deferring, or dismissing opportunities.
- Memory updates from accepted and rejected opportunity decisions.

**Success Criteria**

- The user can compare opportunities instead of reading unprioritized advice.
- Accepted opportunities become trackable initiatives or tasks.

## Phase 4: People Systems

**Goal**: Help leadership grow and retain a corporation without turning member
data into surveillance.

**Primary Leg**: People

**Deliverables**

- Recruiting funnel and onboarding checklist support.
- Member role/capability map based on user-approved data.
- Leadership delegation tracker for initiatives and recurring responsibilities.
- Retention and burnout signals framed as support prompts, not judgments.

**Success Criteria**

- Gryyk helps the user decide who needs support, onboarding, delegation, or
  recognition.
- Sensitive people analysis includes uncertainty and a constructive next action.

## Phase 5: Automation Loop

**Goal**: Turn advice into follow-through while keeping leadership decisions
explicit.

**Primary Leg**: All three

**Deliverables**

- Task and initiative model with owner, due date, status, evidence, linked
  opportunity, and review cadence.
- Automated reminders for stale tasks, aging decisions, and missing outcomes.
- After-action review prompts after operations or completed initiatives.
- Status lifecycle for queued, active, blocked, complete, and learned.

**Success Criteria**

- Gryyk can show what is stalled and what needs a human decision.
- Completed work improves memory and future recommendations.

## Phase 6: Simulation and Coaching

**Goal**: Use the accumulated data and memory to help the user practice CEO-like
decision-making.

**Primary Leg**: All three

**Deliverables**

- Scenario planning for patch changes, recruiting pushes, industrial plans, and
  operational campaigns.
- Board-meeting mode that reviews numbers, opportunities, people, open
  decisions, and commitments.
- Decision journal comparing predicted outcomes to actual outcomes.

**Success Criteria**

- The user can explore strategic choices before committing resources.
- Gryyk can explain where prior assumptions were right, wrong, or incomplete.

## Phase 7: Integration Hardening

**Goal**: Make the multi-system architecture reliable enough for regular use.

**Primary Leg**: Reliability across all legs

**Deliverables**

- Stable contracts between Gryyk and OvernightDesk for manual research requests,
  status reads, processed artifacts, and error reporting.
- Observability for Netlify Functions, OvernightDesk jobs, MongoDB writes, and AI
  processing failures.
- Versioned schemas for shared collections.
- Admin tools for replaying, repairing, archiving, or deleting research and
  memory artifacts.

**Success Criteria**

- Failures are visible, recoverable, and do not block login or chat.
- Collection ownership and data contracts are documented before every new
  integration.

## Open Questions

- Which ESI scopes and corporation roles can provide reliable numbers without
  overreaching?
- Which people signals are acceptable, useful, and aligned with leadership
  support rather than surveillance?
- Should tasks and initiatives live first in MongoDB, OvernightDesk, or an
  external work-management system?
- What cadence should Gryyk optimize around: daily CEO brief, weekly strategy
  review, campaign planning, or all three?
- When should Gryyk gain the ability to request new OvernightDesk work through
  an HTTP endpoint instead of only reading scheduled/manual outputs?
