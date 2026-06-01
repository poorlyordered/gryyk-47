# Tasks: Command Brief MVP

**Input**: Design documents from `/specs/001-command-brief-mvp/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Include focused tests for command brief state mapping, UI states, and chat grounding because this feature changes the authenticated first-screen workflow and AI context.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish shared types and state contracts used by all stories

- [x] T001 Create command brief domain types in src/types/commandBrief.ts
- [x] T002 Create command brief formatting helpers in src/services/command-brief.ts
- [x] T003 Create command brief Zustand store shell in src/store/commandBrief.ts
- [x] T004 Use direct imports for command brief store/types from src/store/commandBrief.ts and src/types/commandBrief.ts without adding a new store barrel file

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core behavior that MUST be complete before any user story UI can rely on command brief state

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Map ResearchSnapshot responses into CommandBriefSnapshot states in src/services/command-brief.ts
- [x] T006 Add next-human-decision derivation from recommended actions/watchlist/fallback state in src/services/command-brief.ts
- [x] T007 Add active command brief load/refresh actions to src/store/commandBrief.ts using src/services/research-pull.ts
- [x] T008 Add command brief error and unavailable-state handling to src/store/commandBrief.ts
- [x] T009 Add unit tests for status mapping and next-human-decision derivation in tests/unit/command-brief.test.ts

**Checkpoint**: Command brief data can be loaded, mapped, refreshed, and tested without rendering the final UI

---

## Phase 3: User Story 1 - See Current Command Brief After Login (Priority: P1) MVP

**Goal**: Show the current operating brief automatically after authenticated chat loads

**Independent Test**: Log in with a valid character and an existing processed brief; the chat screen shows command brief content and metadata without queueing research

### Tests for User Story 1

- [x] T010 [P] [US1] Add component test for processed command brief rendering in tests/components/CommandBrief.test.tsx
- [x] T011 [P] [US1] Add chat page integration test for auto-load behavior in tests/components/ChatCommandBrief.test.tsx

### Implementation for User Story 1

- [x] T012 [P] [US1] Create CommandBrief component with processed state sections in src/components/chat/CommandBrief.tsx
- [x] T013 [P] [US1] Add compact metadata/freshness display helpers in src/components/chat/CommandBrief.tsx
- [x] T014 [US1] Mount CommandBrief in the first-screen chat layout in src/pages/Chat.tsx
- [x] T015 [US1] Trigger command brief load from authenticated corporation context in src/pages/Chat.tsx
- [x] T016 [US1] Ensure desktop and mobile layouts keep CommandBrief reachable in src/pages/Chat.tsx

**Checkpoint**: User Story 1 is fully functional and testable independently

---

## Phase 4: User Story 2 - Understand Research Processing State (Priority: P2)

**Goal**: Make queued, raw captured, processing, processed, failed, absent, and unavailable states visible and recoverable

**Independent Test**: Simulate each status and verify the command brief presents the correct state without blocking chat or queueing research

### Tests for User Story 2

- [x] T017 [P] [US2] Add component tests for processing, failed, absent, and unavailable states in tests/components/CommandBriefStates.test.tsx
- [x] T018 [P] [US2] Add store tests for refresh failure preserving prior processed brief in tests/unit/command-brief-store.test.ts

### Implementation for User Story 2

- [x] T019 [US2] Render loading, processing, failed, absent, and unavailable states in src/components/chat/CommandBrief.tsx
- [x] T020 [US2] Add refresh button that re-reads status/brief only in src/components/chat/CommandBrief.tsx
- [x] T021 [US2] Preserve prior processed brief during newer processing or failed statuses in src/store/commandBrief.ts
- [x] T022 [US2] Keep existing ResearchPullPanel compatible or reduce duplication in src/components/chat/ResearchPullPanel.tsx

**Checkpoint**: User Stories 1 and 2 work independently and together

---

## Phase 5: User Story 3 - Review Evidence Before Acting (Priority: P3)

**Goal**: Present recommendations as leadership decisions with evidence metadata and make the active brief available to chat

**Independent Test**: Review a command brief with recommendations, ask chat about the current brief, and verify chat can respond from active brief context

### Tests for User Story 3

- [x] T023 [P] [US3] Add helper tests for chat grounding prompt content in tests/unit/command-brief.test.ts
- [x] T024 [P] [US3] Add component test for recommendation/watchlist decision display in tests/components/CommandBriefDecision.test.tsx

### Implementation for User Story 3

- [x] T025 [US3] Add command brief grounding text builder in src/services/command-brief.ts
- [x] T026 [US3] Include active command brief grounding in useAIChat system prompt construction in src/hooks/useAIChat.ts
- [x] T027 [US3] Display recommendations, watchlist, strategic impacts, and next decision as advice in src/components/chat/CommandBrief.tsx
- [x] T028 [US3] Ensure grounding is active-session only and not persisted as durable memory in src/store/commandBrief.ts

**Checkpoint**: All user stories are independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, accessibility, docs, and regression cleanup

- [x] T029 Run npm run test:ci and fix failures
- [x] T030 Run npm run build and fix failures
- [ ] T031 Verify quickstart steps in specs/001-command-brief-mvp/quickstart.md
- [x] T032 Update specs/001-command-brief-mvp/quickstart.md with any implementation-specific verification notes
- [x] T033 Check UI text for clear leadership-support framing and no surveillance-style people language in src/components/chat/CommandBrief.tsx
- [x] T034 Confirm no command brief control queues OvernightDesk, Inngest, OpenRouter, or other long-running research jobs
- [x] T035 Review git diff for unrelated changes before commit

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup completion and blocks all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational
- **User Story 2 (Phase 4)**: Depends on Foundational; can follow US1 or be tested with mocked state
- **User Story 3 (Phase 5)**: Depends on Foundational and benefits from US1 display work
- **Polish (Phase 6)**: Depends on all selected user stories

### User Story Dependencies

- **US1**: MVP path after Foundational
- **US2**: Independent state handling after Foundational, integrates with US1 UI
- **US3**: Requires active loaded brief state from Foundational and visible decision content from US1

### Parallel Opportunities

- T001-T003 can run in parallel if imports are coordinated.
- T010 and T011 can run in parallel after Foundational.
- T012 and T013 can run in parallel.
- T017 and T018 can run in parallel.
- T023 and T024 can run in parallel.

---

## Parallel Example: User Story 1

```bash
Task: "Add component test for processed command brief rendering in tests/components/CommandBrief.test.tsx"
Task: "Add chat page integration test for auto-load behavior in tests/components/ChatCommandBrief.test.tsx"
Task: "Create CommandBrief component with processed state sections in src/components/chat/CommandBrief.tsx"
Task: "Add compact metadata/freshness display helpers in src/components/chat/CommandBrief.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. Stop and validate processed brief auto-load and first-screen display.

### Incremental Delivery

1. Add foundational snapshot mapping and store.
2. Deliver processed command brief display.
3. Add processing/failure/absent/unavailable state handling.
4. Add chat grounding and decision framing.
5. Run full verification and update docs.

### Validation

- `npm run test:ci`
- `npm run build`
- Manual OAuth/chat verification from quickstart when environment access is available
