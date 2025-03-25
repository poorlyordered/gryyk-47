# System Patterns: Gryyk-47 EVE Online AI Assistant

## How the System is Built

Gryyk-47 follows a modern web application architecture with the following key components:

1. **Frontend**: A React-based single-page application (SPA) that provides the user interface for interacting with the AI assistant.

2. **Backend**: NoCodeBackend service with MariaDB for data storage, handling authentication, conversation history, and memory bank document storage.

3. **AI Integration**: OpenRouter API integration to access language models, primarily Grok, for generating responses and strategic advice.

4. **External APIs**: Integration with EVE Online API and third-party tools to fetch game data and enhance the AI's capabilities.

## Key Technical Decisions

### 1. React Frontend
- **Decision**: Use React for the frontend framework
- **Rationale**: React provides a robust ecosystem, component-based architecture, and excellent performance for interactive applications.
- **Implementation**: Will use modern React patterns including hooks, context API, and potentially Redux for state management.

### 2. NoCodeBackend with MariaDB
- **Decision**: Use NoCodeBackend service for backend infrastructure
- **Rationale**: Reduces development time and complexity while providing necessary database functionality.
- **Implementation**: Will configure database schema to support user authentication, conversation history, and memory bank document storage.

### 3. OpenRouter for LLM Access
- **Decision**: Use OpenRouter to access language models, primarily Grok
- **Rationale**: Provides flexibility to switch between different LLMs while maintaining a consistent API interface.
- **Implementation**: Will integrate with OpenRouter API to send user queries and context, and receive AI-generated responses.

### 4. Memory Bank System
- **Decision**: Implement a structured document system for maintaining EVE Online strategic information
- **Rationale**: Ensures the AI has access to comprehensive and organized information about the corporation and game context.
- **Implementation**: Will create a document editor/viewer interface and store documents in the database.
- **Structure**: The memory bank will include:
  - Corporation Context: History, leadership structure, values, and vision
  - Active Context: Current initiatives, recent decisions, immediate threats/opportunities
  - Asset Information: Territory holdings, fleet composition, infrastructure
  - Diplomatic Relations: Alliances, relationships, treaties, enemies
  - Operational Details: Current PvP/PvE operations, industrial activities, logistics
  - Threat Analysis: Hostile entities, market threats, vulnerabilities
  - Opportunity Assessment: Potential expansions, economic opportunities, recruitment targets

### 5. EVE Online API Integration
- **Decision**: Integrate with EVE Online's ESI (Eve Swagger Interface)
- **Rationale**: Provides access to real-time game data about the user's character and corporation.
- **Implementation**: Will implement OAuth authentication and API clients for relevant endpoints.

### 6. Single-User Design
- **Decision**: Design the application for a single user
- **Rationale**: Simplifies authentication and data management while meeting the user's requirements.
- **Implementation**: Will implement a simple authentication system focused on security rather than user management.

## Architecture Patterns

### 1. Component-Based Architecture
The frontend will follow a component-based architecture, with reusable UI components organized in a logical hierarchy. This promotes code reusability and maintainability.

### 2. API-First Design
The application will use a clear API contract between frontend and backend, as well as for external integrations. This ensures clean separation of concerns and facilitates testing.

### 3. Context Management
The AI assistant will implement sophisticated context management to maintain conversation history and relevant information from memory banks, ensuring coherent and contextually appropriate responses.

### 4. Responsive Design
The UI will follow responsive design principles to ensure usability across different devices and screen sizes, even though it's primarily designed for desktop use.

### 5. Progressive Enhancement
The application will implement features progressively, starting with core functionality and adding advanced features in later development phases.

### 6. Stateless Authentication
Authentication will follow stateless JWT-based patterns, with tokens stored securely and refreshed as needed.

### 7. Data Caching
The application will implement caching strategies for EVE Online API data to reduce API calls and improve performance.

### 8. Error Handling
Comprehensive error handling will be implemented at all levels of the application, with user-friendly error messages and fallback mechanisms.

## Strategic Workflows

### 1. Starting Strategic Sessions
- Check for Memory Bank files
- If any files are missing, stop and create them
- Read all files before proceeding
- Verify complete strategic context
- Begin strategic analysis

### 2. Strategic Planning
- Follow Memory Bank patterns and established corporation goals
- Maintain consistency with previous strategic decisions
- Consider both short-term tactics and long-term goals

### 3. Handling Complex Strategic Challenges
- Rate confidence in strategic assessment (0-10)
- If confidence < 9, explain:
  - What intelligence is clear
  - What intelligence is unreliable or outdated
  - What additional intelligence is needed
- Only proceed with major strategic recommendations when confidence ≥ 9
- Document reasoning for future memory resets

### 4. Memory Bank Updates
- When triggered, document current state of operations and strategies
- Make next strategic steps clear
- Complete current strategic assessment

### 5. Lost Context Recovery
- Stop immediately
- Read activeContext.md and relevant cards
- Verify understanding
- Start with small, low-risk strategic recommendations
