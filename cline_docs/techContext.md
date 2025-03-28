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
- **MongoDB Atlas**: Cloud database service for document storage
- **Netlify Functions**: Serverless functions for backend operations
- **Authentication**: JWT-based authentication via EVE Online SSO
- **Document Storage**: MongoDB collections for strategic matrix documents

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
├── features/
│   └── strategicMatrix/          # Vertical slice feature
│       ├── index.ts              # Public API
│       ├── types.ts              # Type definitions  
│       ├── store.ts              # Zustand store
│       ├── hooks/                # Custom hooks
│       │   ├── useStrategicMatrixDocument.ts
│       │   └── useStrategicMatrixFilters.ts
│       ├── components/
│       │   ├── core/             # Single file agents
│       │   │   ├── DocumentCard.tsx
│       │   │   ├── DocumentEditor.tsx  
│       │   │   └── DocumentViewer.tsx
│       │   └── composite/        # Composite components
│       │       ├── StrategicMatrixList.tsx
│       │       └── CollapsiblePanel.tsx
│       ├── utils/
│       │   └── formatters.ts
│       └── pages/
│           └── StrategicMatrixPage.tsx
├── services/                     # Service layer
│   ├── eve.ts                    # EVE Online SSO service
│   └── strategic-matrix.ts       # Strategic Matrix API service
└── netlify/
    └── functions/                # Netlify serverless functions
        ├── strategic-matrix.ts   # Strategic Matrix CRUD operations
        └── auth-middleware.ts    # Authentication middleware
```

### Build and Deployment Process
1. Local development with `npm start`
2. Code pushed to GitHub repository
3. GitHub Actions run tests and build process
4. Successful builds deployed to Netlify
5. MongoDB Atlas integration for database operations
6. Netlify environment variables for secure credentials storage

## Technical Constraints

### Performance Requirements
- **Response Time**: < 500ms for UI interactions
- **API Latency**: < 1s for API calls
- **Memory Usage**: < 100MB for client-side application
- **Concurrent Users**: Support for up to 100 concurrent users

### Security Considerations
- **Authentication**: EVE Online SSO for secure authentication
- **Authorization**: Role-based access control for corporation data
- **Data Protection**: Encryption for sensitive information
- **API Security**: Rate limiting and request validation
- **Environment Variables**: Secure storage of API keys and credentials

### Compatibility Requirements
- **Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Devices**: Desktop and tablet (responsive design)
- **Screen Sizes**: Minimum 768px width
- **Offline Support**: Limited functionality when offline

### Accessibility Standards
- **WCAG 2.1**: Level AA compliance
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Readers**: Compatible with major screen readers
- **Color Contrast**: Minimum 4.5:1 ratio for text

## Integration Points

### EVE Online API
- **Authentication**: OAuth 2.0 flow with EVE Online SSO
- **Character Data**: Character information and skills
- **Corporation Data**: Corporation structure and assets
- **Market Data**: Market prices and trends
- **Universe Data**: Star systems, regions, and sovereignty

### OpenRouter API
- **Chat Completion**: API for generating AI responses
- **Context Management**: Handling conversation context
- **Model Selection**: Choosing appropriate LLM for tasks
- **Rate Limiting**: Managing API usage within limits

### MongoDB Atlas
- **Document Storage**: CRUD operations for strategic matrix documents
- **User Data**: Storing user preferences and settings
- **Authentication**: Integration with EVE Online SSO
- **Data Indexing**: Optimized queries for strategic matrix documents

### Netlify
- **Hosting**: Static site hosting for the frontend
- **Serverless Functions**: Backend operations via Netlify Functions
- **Environment Variables**: Secure storage of credentials
- **Continuous Deployment**: Automatic deployment from GitHub
