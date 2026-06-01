# Feature Specification: Command Brief MVP

**Feature Branch**: `001-command-brief-mvp`

**Created**: 2026-05-31

**Status**: Draft

**Input**: User description: "Build the Phase 1 Command Brief MVP for Gryyk-47. After login, the application should show a first-screen command brief assembled from the latest processed OvernightDesk research, existing strategy memory/auth context, and known corporation data. The brief should expose freshness, source count, model, confidence, processing or failure state, executive summary, strategic impacts, recommended actions, watchlist, and the next human decision. Chat should be able to use the currently loaded command brief as grounding context. Gryyk must not queue new long-running research jobs for this feature; it should read processed results and status from server-side APIs."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Current Command Brief After Login (Priority: P1)

As the corporation leader, I want Gryyk-47 to show the current command brief as
soon as I enter the application so I can orient around the latest intelligence,
recommended actions, and pending decisions without asking the chatbot first.

**Why this priority**: This changes Gryyk from a reactive chat surface into the
first screen of an operating system. It is the minimum visible step toward the
roadmap's Command Brief surface.

**Independent Test**: Log in with a valid EVE character when a processed
OvernightDesk brief exists. The first application screen shows the brief summary,
metadata, recommendations, watchlist, and next human decision without starting a
new research job.

**Acceptance Scenarios**:

1. **Given** a logged-in user and a latest processed research brief, **When** the
   chat experience loads, **Then** the user sees a command brief with executive
   summary, strategic impacts, recommended actions, watchlist, created time,
   source count, model, confidence, and next human decision.
2. **Given** a logged-in user and a processed brief that is older than the
   expected freshness window, **When** the command brief loads, **Then** the user
   can still read the brief and sees a clear stale/freshness indicator.
3. **Given** the command brief is loaded, **When** the user asks chat about the
   current situation, **Then** Gryyk can use the loaded brief as context and
   reference the relevant recommendation or watchlist item.

---

### User Story 2 - Understand Research Processing State (Priority: P2)

As the corporation leader, I want to know whether research is processed,
processing, queued, or failed so I can trust the brief and avoid repeatedly
clicking controls that do not change the outcome.

**Why this priority**: The previous research flow exposed confusing background
job behavior. The command brief must make asynchronous status visible while
keeping long-running work outside Gryyk.

**Independent Test**: Simulate or use each known status value and verify the
brief area presents the correct user-facing state without queueing research.

**Acceptance Scenarios**:

1. **Given** the latest research request has status `queued`, `raw_captured`, or
   `processing`, **When** the command brief loads, **Then** the user sees that
   research is processing and, if available, the latest processed brief remains
   visible as historical context.
2. **Given** the latest research request has status `failed`, **When** the
   command brief loads, **Then** the user sees a failure state that includes the
   available error message and preserves access to any previous processed brief.
3. **Given** the status and brief endpoints are unavailable, **When** the command
   brief loads, **Then** the user sees a recoverable error state and chat/login
   remain usable.

---

### User Story 3 - Review Evidence Before Acting (Priority: P3)

As the corporation leader, I want each recommendation to show enough supporting
context that I can decide whether to act, defer, or ask Gryyk for more analysis.

**Why this priority**: The command brief should support leadership decisions, not
present opaque AI advice.

**Independent Test**: Open a command brief with multiple strategic impacts and
recommended actions. Each action is readable as a decision candidate with
supporting evidence metadata and an explicit next decision.

**Acceptance Scenarios**:

1. **Given** a processed brief includes recommended actions, **When** the user
   reviews the command brief, **Then** each recommendation is presented as advice
   with a clear decision prompt rather than as an already completed action.
2. **Given** a processed brief includes source metadata, **When** the user
   reviews the command brief, **Then** the user can see the number of sources and
   freshness metadata associated with the brief.

### Edge Cases

- No processed brief exists yet: show an empty command brief state that explains
  research has not produced a brief yet and shows the latest request status if
  one exists.
- Latest request is processing while an older processed brief exists: show the
  older brief as historical context and clearly mark that newer research is in
  progress.
- Latest request failed while an older processed brief exists: show the failure
  message and keep the older brief available with its original timestamp.
- Brief is missing optional fields such as watchlist or memory: render available
  fields and omit missing sections without breaking the page.
- User session expires or auth fails: command brief should not load private data
  and the user should be routed through the existing auth flow.
- Network or server error: show a retryable state without blocking chat or
  causing repeated automatic requests.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST automatically load command brief state after a user
  successfully enters the authenticated chat experience.
- **FR-002**: System MUST read the latest research status from a server-side API
  and display whether research is queued, raw captured, processing, processed,
  failed, unavailable, or absent.
- **FR-003**: System MUST read the latest processed research brief from a
  server-side API when one exists.
- **FR-004**: System MUST display executive summary, strategic impacts,
  recommended actions, watchlist, created time, model, source count, confidence,
  and freshness when those values are available.
- **FR-005**: System MUST display a next human decision derived from the loaded
  brief, prioritizing recommended actions when present and falling back to a
  review prompt when no action exists.
- **FR-006**: System MUST preserve access to the latest processed brief when a
  newer request is queued, raw captured, processing, or failed.
- **FR-007**: System MUST show error details from failed research requests when
  an error message is available.
- **FR-008**: System MUST keep login and advisor chat usable when command brief
  loading fails.
- **FR-009**: System MUST make the currently loaded command brief available as
  grounding context for advisor chat responses during the active session.
- **FR-010**: System MUST NOT create or queue new long-running research,
  ingestion, or AI processing jobs from this command brief feature.
- **FR-011**: System MUST NOT expose MongoDB credentials, model API keys, or
  other server-side secrets to the client.
- **FR-012**: System SHOULD allow the user to manually refresh the command brief
  state without changing the background research queue.

### Operating Loop Fit *(mandatory for Gryyk-47 specs)*

- **Leadership loop stage**: Observe, Diagnose, Prioritize, and Plan.
- **Numbers impact**: Shows source count, freshness, confidence, and known
  corporation context as measurable operating metadata. This phase does not add
  new corporation KPIs.
- **Opportunity impact**: Surfaces processed OvernightDesk intelligence,
  strategic impacts, recommendations, and watchlist items for leadership review.
- **People impact**: Shows implications for members, recruiting, delegation, or
  leadership only when those appear in processed research or existing strategy
  memory. This phase does not add new people-data collection.
- **Human decision point**: Gryyk prepares the current brief and next decision;
  the user decides whether to act, defer, ask for analysis, or wait for fresher
  research.

### Data and Evidence Requirements *(mandatory when feature uses data or AI)*

- **Raw inputs**: Raw official EVE news and other research inputs remain owned by
  OvernightDesk/Hermes and are not directly processed by Gryyk in this feature.
- **Processed artifacts**: Latest `research_briefs` document and latest
  `research_requests` status summary for corporation `917701062` and focus
  `grykk-47-eve-official-news`.
- **Owner system**: OvernightDesk/Hermes owns research capture and processing.
  Gryyk-47 owns authenticated display, chat grounding, and read-only server-side
  adapters.
- **Status lifecycle**: `queued`, `raw_captured`, `processing`, `processed`, and
  `failed`; Gryyk may also present `unavailable` for API/network failure and
  `absent` when no matching request exists.
- **Traceability**: Command brief display includes `createdAt`, model, source
  count, confidence, and `errorMessage` when available.
- **Failure recovery**: User sees failure or unavailable state, can retry reads,
  and can continue using chat/auth. Gryyk does not retry long-running background
  processing in this feature.

### Key Entities *(include if feature involves data)*

- **CommandBrief**: User-facing aggregate of latest processed research brief,
  latest research request status, freshness, source count, model, confidence,
  executive summary, strategic impacts, recommended actions, watchlist, and next
  human decision.
- **ResearchStatus**: Latest request/status summary from OvernightDesk data,
  including corporation ID, focus, status, created time, updated time, and error
  message when failed.
- **ResearchBrief**: Processed research artifact containing executive summary,
  markdown brief, strategic impacts, recommended actions, watchlist, memory
  notes, confidence, source metadata, model, and creation time.
- **ChatGroundingContext**: The active-session copy of the loaded command brief
  that advisor chat can use when answering current-state questions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After successful login, a user with an existing processed brief can
  see command brief content within 3 seconds on a normal broadband connection.
- **SC-002**: The command brief clearly distinguishes all five research statuses
  (`queued`, `raw_captured`, `processing`, `processed`, `failed`) in functional
  verification.
- **SC-003**: A failed or unavailable command brief read does not prevent the user
  from entering or using advisor chat.
- **SC-004**: At least one chat interaction can reference the active command
  brief content without requiring the user to paste the brief manually.
- **SC-005**: No user action in the command brief creates a new OvernightDesk,
  Inngest, OpenRouter, or other long-running research job.
- **SC-006**: The command brief shows created time, model, source count, and
  confidence for processed briefs when those values exist in stored data.

## Assumptions

- Existing EVE OAuth login and authenticated chat routing remain in place.
- Existing read-focused research server-side APIs remain the source for
  OvernightDesk brief/status data.
- The first implementation targets the currently known corporation ID
  `917701062` and focus `grykk-47-eve-official-news`.
- This feature is read-only for research data and does not add a new manual
  research trigger.
- This feature may reorganize the chat screen to make the command brief visible,
  but it does not need to create a full multi-page dashboard.
