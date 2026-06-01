# Data Model: Command Brief MVP

## CommandBriefSnapshot

User-facing aggregate built from the latest research request and latest
processed research brief.

**Fields**

- `corporationId`: string
- `focus`: string
- `status`: `queued | raw_captured | processing | processed | failed | unavailable | absent`
- `statusUpdatedAt`: ISO timestamp, optional
- `brief`: `ResearchBriefDocument`, optional
- `errorMessage`: string, optional
- `freshness`: `fresh | stale | unknown`
- `nextHumanDecision`: string
- `loadedAt`: ISO timestamp

**Validation Rules**

- `corporationId` and `focus` are required.
- `status` is required; use `absent` when no request exists and `unavailable`
  when the API cannot be reached.
- `nextHumanDecision` must always be present, even if it is a fallback review or
  wait-for-research prompt.
- If `status` is `failed`, expose `errorMessage` when available.

## ResearchRequestStatus

Latest OvernightDesk request/status record.

**Fields**

- `_id`: string
- `corporationId`: string
- `focus`: string
- `status`: `queued | raw_captured | processing | processed | failed`
- `createdAt`: ISO timestamp
- `updatedAt`: ISO timestamp, optional
- `requestedBy`: string, optional
- `errorMessage`: string, optional
- `rawItemCount`: number, optional
- `briefId`: string, optional

**State Transitions**

```text
queued -> raw_captured -> processing -> processed
queued -> raw_captured -> processing -> failed
```

Gryyk reads these states and does not mutate them in this feature.

## ResearchBriefDocument

Processed research artifact from OvernightDesk.

**Fields**

- `_id`: string
- `corporationId`: string
- `focus`: string
- `createdAt`: ISO timestamp
- `model`: string, optional
- `sources`: string[], optional
- `sourceCount`: number, optional
- `itemCount`: number, optional
- `items`: source item summary[], optional
- `brief`: `ResearchBrief`

**Validation Rules**

- If `sourceCount` is absent, derive display count from `sources.length` or
  `items.length`.
- Missing optional arrays render as empty sections.

## ResearchBrief

Processed AI summary.

**Fields**

- `executiveSummary`: string
- `briefMarkdown`: string
- `strategicImpacts`: array of `{ area, impact, urgency }`
- `recommendedActions`: string[]
- `watchlist`: string[]
- `memory`: string
- `confidence`: number from 0 to 1

**Validation Rules**

- `confidence` displays as a percentage when numeric.
- `briefMarkdown` is preferred for the full summary; fall back to
  `executiveSummary`.
- Recommendations are advice, not completed actions.

## ChatGroundingContext

Active-session context passed into advisor chat.

**Fields**

- `summary`: string
- `createdAt`: ISO timestamp, optional
- `model`: string, optional
- `sourceCount`: number, optional
- `confidence`: number, optional
- `strategicImpacts`: string[]
- `recommendedActions`: string[]
- `watchlist`: string[]
- `nextHumanDecision`: string

**Validation Rules**

- Include only the active loaded brief.
- Do not persist as durable strategy memory in this feature.
- Keep content concise enough for the chat system prompt.
