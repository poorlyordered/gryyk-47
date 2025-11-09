# MongoDB Schema & TypeScript Interface: Strategic Workflows

## Collection: `strategic_workflows`

This collection stores the state and progression of each strategic workflow session for EVE Online corporations.

---

## MongoDB Schema (JSON Schema)

```json
{
  "bsonType": "object",
  "required": [
    "corporationId",
    "sessionId",
    "initiator",
    "status",
    "createdAt",
    "updatedAt",
    "steps",
    "currentStep"
  ],
  "properties": {
    "corporationId": { "bsonType": "string", "description": "EVE corporation ID" },
    "sessionId": { "bsonType": "string", "description": "Unique session identifier" },
    "initiator": { "bsonType": "string", "description": "User or agent who started the session" },
    "status": { "enum": ["active", "paused", "completed", "archived"], "description": "Workflow session status" },
    "createdAt": { "bsonType": "date" },
    "updatedAt": { "bsonType": "date" },
    "steps": {
      "bsonType": "array",
      "items": {
        "bsonType": "object",
        "required": ["stepType", "status", "startedAt"],
        "properties": {
          "stepType": { "bsonType": "string", "description": "Type of workflow step" },
          "status": { "enum": ["pending", "in_progress", "completed", "error"], "description": "Step status" },
          "startedAt": { "bsonType": "date" },
          "completedAt": { "bsonType": "date" },
          "input": { "bsonType": "object", "description": "Input/context for the step" },
          "output": { "bsonType": "object", "description": "Output/result for the step" },
          "confidenceScore": { "bsonType": "double", "description": "LLM confidence score (0-1)" },
          "recommendations": {
            "bsonType": "array",
            "items": { "bsonType": "object" }
          }
        }
      }
    },
    "currentStep": { "bsonType": "int", "description": "Index of the current step in the steps array" },
    "sessionLog": {
      "bsonType": "array",
      "items": {
        "bsonType": "object",
        "properties": {
          "timestamp": { "bsonType": "date" },
          "event": { "bsonType": "string" },
          "details": { "bsonType": "object" }
        }
      }
    }
  }
}
```

---

## TypeScript Interface

```ts
export interface StrategicWorkflowStep {
  stepType: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  startedAt: Date;
  completedAt?: Date;
  input?: Record<string, any>;
  output?: Record<string, any>;
  confidenceScore?: number; // 0-1
  recommendations?: Array<Record<string, any>>;
}

export interface StrategicWorkflowSession {
  corporationId: string;
  sessionId: string;
  initiator: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  steps: StrategicWorkflowStep[];
  currentStep: number;
  sessionLog?: Array<{
    timestamp: Date;
    event: string;
    details?: Record<string, any>;
  }>;
}
```

---

## Next Steps

- Define schemas/interfaces for `strategic_matrix` and `workflow_logs`
- Implement Netlify Functions for CRUD operations on `strategic_workflows`
- Integrate with frontend workflow UI

[CONFIRM] Does this schema align with the strategic workflow requirements and MongoDB-first approach?