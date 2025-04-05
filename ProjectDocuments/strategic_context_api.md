# Gryyk-47 Strategic Context API Documentation

This document outlines the API endpoints for managing the Strategic Context collections in the Gryyk-47 application.

## Base URL

All API endpoints are relative to the Netlify Functions base URL:

```
/.netlify/functions/
```

## Authentication

All endpoints require authentication via EVE Online SSO. Include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

---

## Corporation Context

### Get Corporation Context

```
GET /.netlify/functions/strategic-context/corporation
```

**Response:**
```json
{
  "corpId": "string",
  "name": "string",
  "ticker": "string",
  "founded": "string (date)",
  "description": "string",
  "leadership": ["string"],
  "values": "string",
  "vision": "string"
}
```

### Create/Update Corporation Context

```
POST /.netlify/functions/strategic-context/corporation
```

**Request Body:**
```json
{
  "corpId": "string",
  "name": "string",
  "ticker": "string",
  "founded": "string (date)",
  "description": "string",
  "leadership": ["string"],
  "values": "string",
  "vision": "string"
}
```

---

## Active Context

### Get Latest Active Context

```
GET /.netlify/functions/strategic-context/active
```

**Response:**
```json
{
  "corpId": "string",
  "timestamp": "string (date-time)",
  "currentInitiatives": ["string"],
  "recentDecisions": ["string"],
  "immediateThreats": ["string"],
  "immediateOpportunities": ["string"]
}
```

### Get Active Context History

```
GET /.netlify/functions/strategic-context/active/history
```

**Query Parameters:**
- `limit`: Number of records to return (default: 10)
- `skip`: Number of records to skip (default: 0)

**Response:**
```json
[
  {
    "corpId": "string",
    "timestamp": "string (date-time)",
    "currentInitiatives": ["string"],
    "recentDecisions": ["string"],
    "immediateThreats": ["string"],
    "immediateOpportunities": ["string"]
  }
]
```

### Create New Active Context

```
POST /.netlify/functions/strategic-context/active
```

**Request Body:**
```json
{
  "corpId": "string",
  "timestamp": "string (date-time)",
  "currentInitiatives": ["string"],
  "recentDecisions": ["string"],
  "immediateThreats": ["string"],
  "immediateOpportunities": ["string"]
}
```

---

## Asset Information

### Get Asset Information

```
GET /.netlify/functions/strategic-context/assets
```

**Response:**
```json
{
  "corpId": "string",
  "territoryHoldings": ["string"],
  "fleetComposition": ["string"],
  "infrastructure": ["string"]
}
```

### Create/Update Asset Information

```
POST /.netlify/functions/strategic-context/assets
```

**Request Body:**
```json
{
  "corpId": "string",
  "territoryHoldings": ["string"],
  "fleetComposition": ["string"],
  "infrastructure": ["string"]
}
```

---

## Diplomatic Relations

### Get Diplomatic Relations

```
GET /.netlify/functions/strategic-context/diplomacy
```

**Response:**
```json
{
  "corpId": "string",
  "alliances": ["string"],
  "relationships": ["string"],
  "treaties": ["string"],
  "enemies": ["string"]
}
```

### Create/Update Diplomatic Relations

```
POST /.netlify/functions/strategic-context/diplomacy
```

**Request Body:**
```json
{
  "corpId": "string",
  "alliances": ["string"],
  "relationships": ["string"],
  "treaties": ["string"],
  "enemies": ["string"]
}
```

---

## Operational Details

### Get Operational Details

```
GET /.netlify/functions/strategic-context/operations
```

**Response:**
```json
{
  "corpId": "string",
  "pvpOperations": ["string"],
  "pveOperations": ["string"],
  "industrialActivities": ["string"],
  "logistics": ["string"]
}
```

### Create/Update Operational Details

```
POST /.netlify/functions/strategic-context/operations
```

**Request Body:**
```json
{
  "corpId": "string",
  "pvpOperations": ["string"],
  "pveOperations": ["string"],
  "industrialActivities": ["string"],
  "logistics": ["string"]
}
```

---

## Threat Analysis

### Get Threat Analysis

```
GET /.netlify/functions/strategic-context/threats
```

**Response:**
```json
{
  "corpId": "string",
  "hostileEntities": ["string"],
  "marketThreats": ["string"],
  "vulnerabilities": ["string"]
}
```

### Create/Update Threat Analysis

```
POST /.netlify/functions/strategic-context/threats
```

**Request Body:**
```json
{
  "corpId": "string",
  "hostileEntities": ["string"],
  "marketThreats": ["string"],
  "vulnerabilities": ["string"]
}
```

---

## Opportunity Assessment

### Get Opportunity Assessment

```
GET /.netlify/functions/strategic-context/opportunities
```

**Response:**
```json
{
  "corpId": "string",
  "expansionTargets": ["string"],
  "economicOpportunities": ["string"],
  "recruitmentTargets": ["string"]
}
```

### Create/Update Opportunity Assessment

```
POST /.netlify/functions/strategic-context/opportunities
```

**Request Body:**
```json
{
  "corpId": "string",
  "expansionTargets": ["string"],
  "economicOpportunities": ["string"],
  "recruitmentTargets": ["string"]
}
```

---

## Session Context

### Get Session by ID

```
GET /.netlify/functions/strategic-context/sessions/:sessionId
```

**Response:**
```json
{
  "sessionId": "string",
  "corpId": "string",
  "startTime": "string (date-time)",
  "endTime": "string (date-time)",
  "userQueries": ["string"],
  "aiAnalysis": ["string"],
  "recommendations": [
    {
      "text": "string",
      "confidence": "number"
    }
  ],
  "feedback": "string"
}
```

### Get Recent Sessions

```
GET /.netlify/functions/strategic-context/sessions
```

**Query Parameters:**
- `limit`: Number of records to return (default: 10)
- `skip`: Number of records to skip (default: 0)

**Response:**
```json
[
  {
    "sessionId": "string",
    "corpId": "string",
    "startTime": "string (date-time)",
    "endTime": "string (date-time)",
    "userQueries": ["string"],
    "aiAnalysis": ["string"],
    "recommendations": [
      {
        "text": "string",
        "confidence": "number"
      }
    ],
    "feedback": "string"
  }
]
```

### Create New Session

```
POST /.netlify/functions/strategic-context/sessions
```

**Request Body:**
```json
{
  "sessionId": "string",
  "corpId": "string",
  "startTime": "string (date-time)",
  "userQueries": ["string"]
}
```

### Update Session

```
PATCH /.netlify/functions/strategic-context/sessions/:sessionId
```

**Request Body:**
```json
{
  "endTime": "string (date-time)",
  "userQueries": ["string"],
  "aiAnalysis": ["string"],
  "recommendations": [
    {
      "text": "string",
      "confidence": "number"
    }
  ],
  "feedback": "string"
}
```

---

## Error Responses

All endpoints return standard HTTP status codes:

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error response body:

```json
{
  "error": "string",
  "message": "string",
  "statusCode": "number"
}