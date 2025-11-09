# MongoDB Data Model Implementation Plan for Gryyk-47

## Objective
Implement a robust MongoDB data model to support persistent chat, strategic context, and advanced LLM context management for the Gryyk-47 EVE Online AI Assistant.

---

## 1. Design Phase

### a. Define New Collections & Schemas
- **messages**: Stores each chat message with metadata.
- **(Optional) conversations**: Groups related sessions/messages for advanced analytics.
- Update **session_context**: Reference message IDs and store richer decision objects.

### b. Schema Drafts

#### messages
```json
{
  "messageId": "string",
  "sessionId": "string",
  "corpId": "string",
  "sender": "user" | "ai" | "system",
  "content": "string",
  "timestamp": "string",
  "references": ["strategicMatrixId", "eveEventId"],
  "tags": ["decision", "intel"],
  "threadId": "string"
}
```

#### session_context (additions)
- `messageIds: string[]`
- `decisions: [{ messageId, summary, timestamp, references }]`

---

## 2. Implementation Steps

### Step 1: Schema & Interface Definition
- Update `strategic_context_schemas.md` with new/modified schemas.
- Add TypeScript interfaces for `Message`, `Decision`, and (optionally) `Conversation` in `strategicContextModels.ts`.

### Step 2: MongoDB Collection Setup
- Create new `messages` (and `conversations` if needed) collections in MongoDB Atlas.
- Add indexes on `sessionId`, `corpId`, `timestamp`, and `tags` for efficient querying.

### Step 3: Backend API Updates
- Update serverless functions (Netlify or other) to:
  - Persist new chat messages to the `messages` collection.
  - Retrieve messages by session, corp, tag, or time window.
  - Link messages to session_context and strategic decisions.
- Update endpoints to support message-level CRUD operations.

### Step 4: Frontend Refactor
- Refactor chat state management to:
  - Persist messages to MongoDB, not just local storage.
  - Retrieve and display chat history from the backend.
  - Support message metadata (tags, references, etc.) in the UI.

### Step 5: LLM Context Orchestration
- Update prompt construction logic to:
  - Retrieve the most relevant N messages for the current session/user.
  - Filter or prioritize messages by tag (e.g., "decision", "threat").
  - Inject message content and metadata into LLM prompts for Grok 3.

### Step 6: Migration & Data Consistency
- Migrate any existing chat history from local storage to MongoDB.
- Ensure backward compatibility for ongoing sessions.

### Step 7: Testing & Validation
- Write unit and integration tests for:
  - Message persistence and retrieval
  - Session/message linking
  - Context windowing for LLM
- Validate performance and correctness with real chat data.

### Step 8: Documentation & Rollout
- Update project documentation to reflect new data model and API changes.
- Communicate changes to the team and update onboarding materials.

---

## 3. Timeline & Milestones

| Step | Description | Owner | Target Date |
|------|-------------|-------|-------------|
| 1    | Schema & Interface Definition | Backend | Week 1 |
| 2    | MongoDB Collection Setup      | Backend | Week 1 |
| 3    | Backend API Updates           | Backend | Week 2 |
| 4    | Frontend Refactor             | Frontend| Week 2-3 |
| 5    | LLM Context Orchestration     | AI/Backend| Week 3 |
| 6    | Migration & Data Consistency  | Backend | Week 3 |
| 7    | Testing & Validation          | QA      | Week 3-4 |
| 8    | Documentation & Rollout       | All     | Week 4 |

---

## 4. Success Criteria

- All chat messages are persisted and retrievable from MongoDB.
- LLM receives context-rich, relevant message history for each session.
- Strategic decisions are traceable to specific chat messages and context.
- System supports efficient querying, analytics, and future extensibility.

---

## 5. Risks & Mitigations

- **Data migration issues:** Test migration scripts on staging data first.
- **Performance bottlenecks:** Use proper indexing and pagination.
- **Backward compatibility:** Maintain support for legacy sessions during transition.

---

This plan will enable Gryyk-47 to deliver persistent, context-aware strategic support leveraging MongoDB as a robust data backbone.