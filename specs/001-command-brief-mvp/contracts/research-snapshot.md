# Contract: Research Snapshot Read

## Purpose

Return the latest OvernightDesk research request status and latest processed
brief for the authenticated user's corporation context.

## Request

```http
POST /.netlify/functions/research-pull
Authorization: Bearer <EVE access token>
Content-Type: application/json

{
  "corporationId": "917701062",
  "focus": "grykk-47-eve-official-news"
}
```

## Success Response

```json
{
  "request": {
    "_id": "6a1c308dc488fc18d5208460",
    "corporationId": "917701062",
    "focus": "grykk-47-eve-official-news",
    "status": "processed",
    "createdAt": "2026-05-31T00:00:00.000Z",
    "updatedAt": "2026-05-31T00:01:00.000Z",
    "errorMessage": null
  },
  "brief": {
    "_id": "6a1c30acc488fc18d5208461",
    "corporationId": "917701062",
    "focus": "grykk-47-eve-official-news",
    "createdAt": "2026-05-31T00:02:00.000Z",
    "model": "google/gemma-4-31b-it-20260402",
    "sourceCount": 8,
    "brief": {
      "executiveSummary": "Summary text",
      "briefMarkdown": "# Brief",
      "strategicImpacts": [
        {
          "area": "Official EVE news",
          "impact": "Strategic impact text",
          "urgency": "medium"
        }
      ],
      "recommendedActions": ["Action text"],
      "watchlist": ["Watch item"],
      "memory": "Memory text",
      "confidence": 0.95
    }
  },
  "corporationId": "917701062",
  "focus": "grykk-47-eve-official-news"
}
```

## Error Responses

- `401 Unauthorized`: missing, expired, or invalid EVE access token.
- `500 Internal Server Error`: MongoDB configuration, database, or unexpected
  server failure.

## Invariants

- This endpoint must not queue research or call model providers.
- MongoDB connection details remain server-side.
- The response may include `request: null` or `brief: null`; the client must
  render recoverable empty states.
