# Phase 0 Research: Command Brief MVP

## Decision: Reuse Existing Research Snapshot Endpoint

Use the existing authenticated `research-pull` Netlify Function as the primary
read path because it already returns both latest request status and latest
processed brief for the corporation/focus pair.

**Rationale**: The command brief needs a combined view of status plus processed
brief. Calling one endpoint reduces frontend coordination and matches the
current production integration.

**Alternatives considered**:

- Call `research-status` and `research-brief` separately: more flexible but
  duplicates state coordination already handled by `research-pull`.
- Add a new command-brief endpoint: cleaner naming but unnecessary for the first
  slice and risks duplicating the same Mongo queries.

## Decision: Add a Dedicated Command Brief Component

Create a first-screen `CommandBrief` component instead of making
`ResearchPullPanel` responsible for the full operating brief.

**Rationale**: `ResearchPullPanel` is a sidebar tool and already has panel copy
and chat-announcement behavior. The roadmap calls for Command Brief as a product
surface, so it should have its own component while sharing the same data service.

**Alternatives considered**:

- Expand `ResearchPullPanel`: fastest but keeps the feature buried in Tools and
  makes future dashboard evolution harder.
- Create a new page: too large for MVP and would split the existing post-login
  chat workflow.

## Decision: Store Loaded Brief in Client State for Chat Grounding

Add active-session command brief state that `useAIChat` can include in the
system prompt when a brief is loaded.

**Rationale**: Chat grounding must work without requiring users to paste the
brief. A lightweight client store is enough for this read-only MVP.

**Alternatives considered**:

- Persist command brief into chat history: durable but risks confusing evidence
  with conversation.
- Re-fetch the brief on every chat submit: simpler state model but adds latency
  and unnecessary API calls.

## Decision: Preserve Historical Brief During Processing or Failure

When a new request is queued, processing, or failed, keep the latest processed
brief visible with clear status messaging.

**Rationale**: A stale but labeled brief is more useful than an empty screen, and
the spec requires login/chat not to be blocked by background state.

**Alternatives considered**:

- Hide old briefs during processing: avoids stale advice but gives worse
  situational awareness.
- Block chat until research completes: violates reliability and command-surface
  principles.

## Decision: Read-Only MVP, No New Background Trigger

Manual refresh only re-reads the status/brief; it does not create or queue new
OvernightDesk, Inngest, or model processing work.

**Rationale**: The prior failures came from long-running processing in the wrong
runtime. This feature keeps Gryyk as an interactive reader of processed
intelligence.

**Alternatives considered**:

- Add an OvernightDesk manual trigger now: useful later, but requires a separate
  API contract and reliability plan.
- Reintroduce Netlify/Inngest processing: rejected by constitution and recent
  production failures.
