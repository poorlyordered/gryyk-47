# Implementation Plan: Command Brief MVP

**Branch**: `001-command-brief-mvp` | **Date**: 2026-05-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-command-brief-mvp/spec.md`

## Summary

Build the first Command Brief surface for Gryyk-47. After authenticated users
enter chat, Gryyk should automatically read the latest OvernightDesk research
status and processed brief, render it as a first-screen operating brief, and
make that loaded brief available to advisor chat as active-session grounding.
This feature is read-only for research data and must not queue long-running
research or AI processing jobs.

## Technical Context

**Language/Version**: TypeScript 5.5, React 18, Node 22-compatible Netlify Functions

**Primary Dependencies**: React, Chakra UI, Zustand, AI SDK `useChat`, Netlify Functions, MongoDB driver

**Storage**: MongoDB Atlas via existing server-side research adapters; client persists chat state through existing Zustand/local storage behavior

**Testing**: `npm run test:ci`, `npm run build`; focused component/service tests where practical

**Target Platform**: Netlify-hosted React web app with Netlify Functions

**Project Type**: Web application with serverless API adapters

**Performance Goals**: Command brief content visible within 3 seconds after authenticated chat load when server APIs respond normally

**Constraints**: No new long-running research jobs from Gryyk; secrets stay server-side; login/chat remain usable if brief loading fails; mobile layout must not hide the brief entirely

**Scale/Scope**: Single corporation MVP targeting corporation ID `917701062` and focus `grykk-47-eve-official-news`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Company Simulation Fit**: Pass. The feature improves Observe, Diagnose,
  Prioritize, and Plan by making current intelligence and next decisions visible
  before chat.
- **Three-Leg Mapping**: Pass. Opportunity is primary through OvernightDesk
  intelligence; Numbers are represented by freshness, source count, confidence,
  and corporation context; People implications are displayed only when already
  present in processed research or memory.
- **Automation Boundary**: Pass. The feature performs read-only automatic
  loading and manual refresh only. It does not create background research jobs or
  silently mutate strategy state.
- **Evidence and Memory**: Pass. Raw research remains in OvernightDesk. Gryyk
  reads processed artifacts and displays created time, model, source count,
  confidence, and errors. No new durable memory writes are introduced.
- **Operational Boundary**: Pass. Long-running research and AI processing remain
  owned by OvernightDesk/Hermes. Netlify Functions remain short authenticated
  read adapters.
- **Secret and Client Boundary**: Pass. MongoDB and model secrets remain
  server-side. Client receives only authenticated summary/brief data.

## Project Structure

### Documentation (this feature)

```text
specs/001-command-brief-mvp/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── research-snapshot.md
│   └── command-brief-ui.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── components/
│   └── chat/
│       ├── CommandBrief.tsx
│       └── ResearchPullPanel.tsx
├── hooks/
│   └── useAIChat.ts
├── services/
│   └── research-pull.ts
├── store/
│   ├── chat.ts
│   └── commandBrief.ts
├── types/
│   ├── chat.ts
│   └── commandBrief.ts
└── pages/
    └── Chat.tsx

netlify/functions/
├── research-pull.ts
├── research-status.ts
├── research-brief.ts
└── lib/
    └── research-store.ts

tests/
├── components/
├── unit/
└── system/
```

**Structure Decision**: Keep the existing chat page and research service as the
integration point. Add a dedicated command brief presentation component and a
small client-side command brief store/type layer rather than expanding
`ResearchPullPanel` into the main operating surface. Reuse existing Netlify
research functions.

## Phase 0 Research Summary

See [research.md](./research.md).

## Phase 1 Design Summary

See [data-model.md](./data-model.md), [contracts/research-snapshot.md](./contracts/research-snapshot.md), [contracts/command-brief-ui.md](./contracts/command-brief-ui.md), and [quickstart.md](./quickstart.md).

## Post-Design Constitution Check

- **Company Simulation Fit**: Still pass. The design creates a visible operating
  brief rather than another chat-only interaction.
- **Three-Leg Mapping**: Still pass. The UI groups recommendations and watchlist
  around opportunity while preserving evidence metadata and people caution.
- **Automation Boundary**: Still pass. Automatic work is limited to read/refresh
  state; all actions remain user decisions.
- **Evidence and Memory**: Still pass. No raw processing or memory mutation is
  added; grounding context is active-session only.
- **Operational Boundary**: Still pass. Existing Netlify read adapters remain the
  boundary to MongoDB/OvernightDesk data.
- **Secret and Client Boundary**: Still pass. No new client-visible secrets or
  `VITE_*` configuration are required.

## Complexity Tracking

No constitution violations.
