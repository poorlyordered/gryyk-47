# MongoDB Schema & TypeScript Interface: Strategic Matrix

## Collection: `strategic_matrix`

This collection stores structured, persistent strategic context for each EVE Online corporation, including assets, operations, threats, opportunities, and more.

---

## MongoDB Schema (JSON Schema)

```json
{
  "bsonType": "object",
  "required": [
    "corporationId",
    "documentType",
    "data",
    "updatedAt"
  ],
  "properties": {
    "corporationId": { "bsonType": "string", "description": "EVE corporation ID" },
    "documentType": {
      "enum": [
        "corporation_context",
        "active_context",
        "asset_information",
        "diplomatic_relations",
        "operational_details",
        "threat_analysis",
        "opportunity_assessment"
      ],
      "description": "Type/category of strategic document"
    },
    "data": { "bsonType": "object", "description": "Document content (category-specific structure)" },
    "createdAt": { "bsonType": "date" },
    "updatedAt": { "bsonType": "date" },
    "tags": {
      "bsonType": "array",
      "items": { "bsonType": "string" },
      "description": "Optional tags for search/filter"
    }
  }
}
```

---

## TypeScript Interface

```ts
export type StrategicMatrixDocumentType =
  | 'corporation_context'
  | 'active_context'
  | 'asset_information'
  | 'diplomatic_relations'
  | 'operational_details'
  | 'threat_analysis'
  | 'opportunity_assessment';

export interface StrategicMatrixDocument {
  corporationId: string;
  documentType: StrategicMatrixDocumentType;
  data: Record<string, any>; // Category-specific structure
  createdAt?: Date;
  updatedAt: Date;
  tags?: string[];
}
```

---

## Example: Asset Information Data Structure

```ts
// Example for data field when documentType === 'asset_information'
{
  territoryHoldings: string[];
  fleetComposition: Array<{ shipType: string; count: number }>;
  infrastructure: string[];
}
```

---

## Next Steps

- Define schema/interface for `workflow_logs`
- Implement backend CRUD operations for `strategic_matrix`
- Integrate with frontend for document management and display

[CONFIRM] Does this schema align with the Strategic Matrix requirements and MongoDB-first approach?