# System Patterns: Gryyk-47 EVE Online AI Assistant

## How the System is Built

Gryyk-47 follows a hybrid architecture combining vertical slice organization with single file agent components:

1. **Frontend**: React-based SPA using hybrid architecture pattern
2. **Backend**: NoCodeBackend service with MariaDB
3. **AI Integration**: OpenRouter API with Grok as primary LLM
4. **External APIs**: EVE Online ESI and third-party tools

## Key Technical Decisions

### 1. Hybrid Frontend Architecture
- **Decision**: Combine vertical slices with single file agents
- **Rationale**: Balances organization with development efficiency
- **Implementation**:
  - Features organized as vertical slices
  - Core components as self-contained single file agents
  - Composite components combine core agents

### 2. Vertical Slice Organization
- Each major feature (e.g. strategicMatrix) has:
  - Own directory with complete implementation
  - Types, store, hooks, components, utils
  - Clear public API via index.ts

### 3. Single File Agent Components
- Core UI components contain:
  - All component logic
  - Local state management  
  - Styling
  - Event handlers
  - Type definitions
- Examples: DocumentCard, DocumentEditor, DocumentViewer

### 4. NoCodeBackend with MariaDB
[Previous content remains...]

## Hybrid Architecture Patterns

### 1. Vertical Slice Organization
- Features organized end-to-end in dedicated directories
- Contains all layers from UI to state management
- Promotes feature independence and clear boundaries

### 2. Single File Agent Components
- Self-contained components with:
  - Complete component implementation
  - Local types and utilities
  - All necessary imports
  - Internal state management
- Benefits:
  - Easier maintenance
  - Clearer ownership
  - Reduced file switching

### 3. Public API Pattern
- Each feature exposes clean API via index.ts
- Hides implementation details
- Controls feature boundaries

### 4. State Management
- Zustand stores per feature
- Local component state for UI concerns
- Clear separation of concerns

[Rest of previous content remains...]
