# Gryyk-47 Strategic Context Schemas & Data Models

This document defines the JSON schemas for MongoDB collections and the corresponding TypeScript interfaces used in the Gryyk-47 AI Assistant.

---

## 1. corporation_context

### JSON Schema
```json
{
  "type": "object",
  "properties": {
    "corpId": {"type": "string"},
    "name": {"type": "string"},
    "ticker": {"type": "string"},
    "founded": {"type": "string", "format": "date"},
    "description": {"type": "string"},
    "leadership": {"type": "array", "items": {"type": "string"}},
    "values": {"type": "string"},
    "vision": {"type": "string"}
  },
  "required": ["corpId", "name", "ticker"]
}
```

### TypeScript Interface
```typescript
export interface CorporationContext {
  corpId: string;
  name: string;
  ticker: string;
  founded?: string;
  description?: string;
  leadership?: string[];
  values?: string;
  vision?: string;
}
```

---

## 2. active_context

### JSON Schema
```json
{
  "type": "object",
  "properties": {
    "corpId": {"type": "string"},
    "timestamp": {"type": "string", "format": "date-time"},
    "currentInitiatives": {"type": "array", "items": {"type": "string"}},
    "recentDecisions": {"type": "array", "items": {"type": "string"}},
    "immediateThreats": {"type": "array", "items": {"type": "string"}},
    "immediateOpportunities": {"type": "array", "items": {"type": "string"}}
  },
  "required": ["corpId", "timestamp"]
}
```

### TypeScript Interface
```typescript
export interface ActiveContext {
  corpId: string;
  timestamp: string;
  currentInitiatives?: string[];
  recentDecisions?: string[];
  immediateThreats?: string[];
  immediateOpportunities?: string[];
}
```

---

## 3. asset_information

### JSON Schema
```json
{
  "type": "object",
  "properties": {
    "corpId": {"type": "string"},
    "territoryHoldings": {"type": "array", "items": {"type": "string"}},
    "fleetComposition": {"type": "array", "items": {"type": "string"}},
    "infrastructure": {"type": "array", "items": {"type": "string"}}
  },
  "required": ["corpId"]
}
```

### TypeScript Interface
```typescript
export interface AssetInformation {
  corpId: string;
  territoryHoldings?: string[];
  fleetComposition?: string[];
  infrastructure?: string[];
}
```

---

## 4. diplomatic_relations

### JSON Schema
```json
{
  "type": "object",
  "properties": {
    "corpId": {"type": "string"},
    "alliances": {"type": "array", "items": {"type": "string"}},
    "relationships": {"type": "array", "items": {"type": "string"}},
    "treaties": {"type": "array", "items": {"type": "string"}},
    "enemies": {"type": "array", "items": {"type": "string"}}
  },
  "required": ["corpId"]
}
```

### TypeScript Interface
```typescript
export interface DiplomaticRelations {
  corpId: string;
  alliances?: string[];
  relationships?: string[];
  treaties?: string[];
  enemies?: string[];
}
```

---

## 5. operational_details

### JSON Schema
```json
{
  "type": "object",
  "properties": {
    "corpId": {"type": "string"},
    "pvpOperations": {"type": "array", "items": {"type": "string"}},
    "pveOperations": {"type": "array", "items": {"type": "string"}},
    "industrialActivities": {"type": "array", "items": {"type": "string"}},
    "logistics": {"type": "array", "items": {"type": "string"}}
  },
  "required": ["corpId"]
}
```

### TypeScript Interface
```typescript
export interface OperationalDetails {
  corpId: string;
  pvpOperations?: string[];
  pveOperations?: string[];
  industrialActivities?: string[];
  logistics?: string[];
}
```

---

## 6. threat_analysis

### JSON Schema
```json
{
  "type": "object",
  "properties": {
    "corpId": {"type": "string"},
    "hostileEntities": {"type": "array", "items": {"type": "string"}},
    "marketThreats": {"type": "array", "items": {"type": "string"}},
    "vulnerabilities": {"type": "array", "items": {"type": "string"}}
  },
  "required": ["corpId"]
}
```

### TypeScript Interface
```typescript
export interface ThreatAnalysis {
  corpId: string;
  hostileEntities?: string[];
  marketThreats?: string[];
  vulnerabilities?: string[];
}
```

---

## 7. opportunity_assessment

### JSON Schema
```json
{
  "type": "object",
  "properties": {
    "corpId": {"type": "string"},
    "expansionTargets": {"type": "array", "items": {"type": "string"}},
    "economicOpportunities": {"type": "array", "items": {"type": "string"}},
    "recruitmentTargets": {"type": "array", "items": {"type": "string"}}
  },
  "required": ["corpId"]
}
```

### TypeScript Interface
```typescript
export interface OpportunityAssessment {
  corpId: string;
  expansionTargets?: string[];
  economicOpportunities?: string[];
  recruitmentTargets?: string[];
}
```

---

## 8. session_context

### JSON Schema
```json
{
  "type": "object",
  "properties": {
    "sessionId": {"type": "string"},
    "corpId": {"type": "string"},
    "startTime": {"type": "string", "format": "date-time"},
    "endTime": {"type": "string", "format": "date-time"},
    "userQueries": {"type": "array", "items": {"type": "string"}},
    "aiAnalysis": {"type": "array", "items": {"type": "string"}},
    "recommendations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "text": {"type": "string"},
          "confidence": {"type": "number"}
        },
        "required": ["text", "confidence"]
      }
    },
    "feedback": {"type": "string"}
  },
  "required": ["sessionId", "corpId", "startTime"]
}
```

### TypeScript Interface
```typescript
export interface SessionContext {
  sessionId: string;
  corpId: string;
  startTime: string;
  endTime?: string;
  userQueries?: string[];
  aiAnalysis?: string[];
  recommendations?: { text: string; confidence: number }[];
  feedback?: string;
}
```

---

This document serves as the single source of truth for Gryyk-47's corp context schemas and data models.