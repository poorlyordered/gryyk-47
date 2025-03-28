# Technical Context: Gryyk-47 EVE Online AI Assistant

## Technologies Used

### Frontend
- **React**: JavaScript library for building the user interface
- **State Management**: Zustand for feature stores
- **UI Framework**: Chakra UI
- **API Client**: Axios for making HTTP requests
- **Architecture**: Hybrid vertical slice + single file agent pattern
- **Markdown Rendering**: react-markdown for rendering memory bank documents
- **Charting**: recharts for data visualization
- **Strategic Document Editor**: Rich text editor for memory bank documents

### Backend
- **NoCodeBackend**: Backend-as-a-service platform
- **Database**: MariaDB (provided by NoCodeBackend)
- **Authentication**: JWT-based authentication via EVE Online SSO
- **Document Storage**: Structured storage for memory bank documents

### AI Integration
- **OpenRouter**: API for accessing language models
- **Default LLM**: Grok
- **Context Management**: Custom implementation for maintaining conversation context
- **Strategic Workflows**: Implementation of AI strategic advisor workflows
- **Confidence Assessment**: System for evaluating confidence in strategic recommendations

### External APIs
- **EVE Online ESI**: EVE Swagger Interface for accessing game data
- **OAuth**: For authenticating with EVE Online API
- **Third-Party EVE Tools**: Various community tools
- **Search API**: Google, Bing, or DuckDuckGo for web search capabilities

## Development Setup

### Local Development Environment
- **Node.js**: Latest LTS version
- **Package Manager**: npm
- **Code Editor**: Visual Studio Code with React extensions
- **Browser**: Chrome with React Developer Tools
- **API Testing**: Postman or Insomnia
- **E2E Testing**: Playwright for automated end-to-end testing

### Project Structure (Hybrid Architecture)
```
src/
└── features/
    └── strategicMatrix/          # Vertical slice feature
        ├── index.ts              # Public API
        ├── types.ts              # Type definitions  
        ├── store.ts              # Zustand store
        ├── hooks/                # Custom hooks
        │   ├── useStrategicMatrixDocument.ts
        │   └── useStrategicMatrixFilters.ts
        ├── components/
        │   ├── core/             # Single file agents
        │   │   ├── DocumentCard.tsx
        │   │   ├── DocumentEditor.tsx  
        │   │   └── DocumentViewer.tsx
        │   └── composite/        # Composite components
        │       ├── StrategicMatrixList.tsx
        │       └── CollapsiblePanel.tsx
        ├── utils/
        │   └── formatters.ts
        └── pages/
            └── StrategicMatrixPage.tsx
```

### Build and Deployment Process
1. Local development with `npm start`
2. Code pushed to GitHub repository
3. GitHub Actions run tests and build process
4. Successful builds deployed to Netlify
5. Backend configuration managed through NoCodeBackend dashboard

## Technical Constraints
[Previous content remains unchanged...]
