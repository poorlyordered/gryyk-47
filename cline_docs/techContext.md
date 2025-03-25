# Technical Context: Gryyk-47 EVE Online AI Assistant

## Technologies Used

### Frontend
- **React**: JavaScript library for building the user interface
- **State Management**: Redux or Context API
- **UI Framework**: Material UI or Chakra UI
- **API Client**: Axios for making HTTP requests
- **Chat UI**: react-chat-elements or similar library
- **Markdown Rendering**: react-markdown for rendering memory bank documents
- **Charting**: recharts or D3.js for data visualization
- **Strategic Document Editor**: Rich text editor for memory bank documents

### Backend
- **NoCodeBackend**: Backend-as-a-service platform
- **Database**: MariaDB (provided by NoCodeBackend)
- **Authentication**: JWT-based authentication
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
- **Third-Party EVE Tools**: Various community tools (specific tools TBD)
- **Search API**: Google, Bing, or DuckDuckGo for web search capabilities

### Deployment
- **Version Control**: Git with GitHub repository
- **CI/CD**: GitHub Actions
- **Hosting**: Netlify for frontend deployment
- **Backend Hosting**: NoCodeBackend cloud infrastructure

## Development Setup

### Local Development Environment
- **Node.js**: Latest LTS version
- **Package Manager**: npm or yarn
- **Code Editor**: Visual Studio Code with React extensions
- **Browser**: Chrome with React Developer Tools
- **API Testing**: Postman or Insomnia
- **E2E Testing**: Playwright for automated end-to-end testing

### Project Structure
```
gryyk-47/
├── public/
│   ├── index.html
│   └── assets/
├── src/
│   ├── components/
│   │   ├── chat/
│   │   ├── memoryBank/
│   │   │   ├── corpContext/
│   │   │   ├── activeContext/
│   │   │   ├── assetCard/
│   │   │   ├── diplomaticCard/
│   │   │   ├── operationalCard/
│   │   │   ├── threatCard/
│   │   │   └── opportunityCard/
│   │   ├── dashboard/
│   │   └── settings/
│   ├── services/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── eve/
│   │   └── ai/
│   │       ├── strategicWorkflows/
│   │       ├── confidenceAssessment/
│   │       └── contextManagement/
│   ├── store/
│   ├── utils/
│   ├── App.js
│   └── index.js
├── tests/
│   ├── e2e/
│   │   ├── chat.spec.ts
│   │   ├── memoryBank.spec.ts
│   │   └── dashboard.spec.ts
│   └── playwright.config.ts
├── package.json
└── README.md
```

### Build and Deployment Process
1. Local development with `npm start`
2. Code pushed to GitHub repository
3. GitHub Actions run tests and build process
4. Successful builds deployed to Netlify
5. Backend configuration managed through NoCodeBackend dashboard

## Technical Constraints

### Performance Constraints
- **Token Limits**: LLMs have context window limitations (typically 4K-32K tokens)
- **API Rate Limits**: EVE Online API and OpenRouter have rate limits
- **Response Time**: Target maximum response time of 3 seconds for AI responses
- **Memory Bank Size**: Need to efficiently manage potentially large strategic documents

### Security Constraints
- **API Keys**: Secure storage of OpenRouter and other API keys
- **EVE API Tokens**: Secure handling of OAuth tokens
- **User Data**: Proper encryption of sensitive user data
- **Strategic Information**: Secure storage of potentially sensitive corporation information

### Compatibility Constraints
- **Browser Support**: Modern browsers only (Chrome, Firefox, Safari, Edge)
- **Screen Size**: Optimized for desktop use, with basic mobile support
- **Network Requirements**: Stable internet connection required

### External API Constraints
- **EVE API Availability**: Dependent on CCP's API uptime
- **OpenRouter Availability**: Dependent on OpenRouter service uptime
- **Third-Party Tool Availability**: Dependent on community-maintained tools

### Development Constraints
- **Single Developer**: Project designed for implementation by a single developer
- **Time Constraints**: Development roadmap spans approximately 11-16 weeks
- **Budget Constraints**: Utilizing free tiers where possible, with minimal paid services

## Technical Risks

1. **EVE API Changes**: CCP may change their API, requiring updates to integration
2. **LLM Limitations**: AI models may struggle with complex EVE-specific concepts
3. **NoCodeBackend Limitations**: May encounter limitations in the backend service
4. **Performance Issues**: Large memory banks may cause performance issues
5. **Security Concerns**: Handling of EVE Online authentication tokens requires careful security implementation
6. **Strategic Context Management**: Ensuring the AI maintains appropriate context for strategic recommendations
7. **Confidence Assessment Accuracy**: Ensuring the AI accurately assesses its confidence in strategic recommendations
