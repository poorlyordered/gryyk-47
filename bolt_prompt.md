# Bolt.new Prompt: Gryyk-47 EVE Online AI Assistant

## Project Overview

Create a modern web application for an EVE Online AI strategic advisor called "Gryyk-47". This application will help EVE Online players manage their in-game corporations by providing strategic advice and maintaining institutional knowledge.

For this initial phase, please focus on building:
1. The front-end chat interface
2. EVE Online SSO login functionality

## Technical Requirements

### Frontend Framework
- React (latest version)
- Material UI or Chakra UI for components
- Responsive design (primarily for desktop, but should work on tablets)

### Backend
- NoCodeBackend with MariaDB
- JWT-based authentication
- Integration with EVE Online SSO

### APIs
- EVE Online ESI (EVE Swagger Interface) for authentication
- OpenRouter API for future LLM integration (stub this for now)

## Key Features to Implement

### 1. EVE Online SSO Login
- Implement OAuth 2.0 flow with EVE Online
- Store JWT token securely
- Handle token refresh
- Display basic character information after login
- Logout functionality

### 2. Chat Interface
- Modern, responsive chat UI
- Message history display
- Input field with send button
- Ability to scroll through conversation history
- Placeholder for AI responses (actual AI integration will come later)
- Basic message persistence in NoCodeBackend

## Design Guidelines

- **Color Scheme**: Dark theme inspired by EVE Online's UI (dark blues, grays, with accent colors)
- **Typography**: Clean, readable fonts
- **Layout**: Sidebar for navigation, main area for chat
- **Branding**: Include "Gryyk-47" name and a simple placeholder logo
- **Responsiveness**: Primarily designed for desktop but should be usable on tablets

## User Flow

1. User arrives at landing page
2. User clicks "Login with EVE Online"
3. User is redirected to EVE Online SSO
4. After authentication, user returns to the application
5. Basic character information is displayed (name, portrait, corporation)
6. User can access the chat interface
7. User can type messages and see placeholder responses
8. User can log out

## Technical Implementation Details

### EVE Online SSO Integration
- Use EVE Online's OAuth 2.0 flow
- Required scopes: `publicData` (for basic character info)
- Redirect URI should be configurable
- Store tokens securely (JWT in localStorage or HTTP-only cookies)
- Implement token refresh mechanism

### Chat Interface
- Use a library like react-chat-elements or build custom components
- Store messages in NoCodeBackend
- Implement basic message formatting (text, possibly markdown)
- Add typing indicators for better UX

### Project Structure
```
gryyk-47/
├── public/
│   ├── index.html
│   └── assets/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginButton.jsx
│   │   │   ├── LogoutButton.jsx
│   │   │   └── CharacterInfo.jsx
│   │   ├── chat/
│   │   │   ├── ChatContainer.jsx
│   │   │   ├── MessageList.jsx
│   │   │   ├── MessageInput.jsx
│   │   │   └── Message.jsx
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   └── Footer.jsx
│   │   └── common/
│   │       ├── Button.jsx
│   │       └── Loading.jsx
│   ├── services/
│   │   ├── api.js
│   │   ├── auth.js
│   │   └── eve.js
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useChat.js
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── ChatContext.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Chat.jsx
│   │   └── Login.jsx
│   ├── utils/
│   │   └── helpers.js
│   ├── App.jsx
│   └── index.jsx
├── package.json
└── README.md
```

## Future Considerations (Not Required for Initial Implementation)

- Memory Bank system for storing strategic documents
- Integration with OpenRouter API for LLM access
- Advanced EVE Online API data fetching
- Data visualization components
- Web search capabilities
- Third-party EVE tool integrations

## Deliverables

1. Complete React application with the features described above
2. NoCodeBackend configuration
3. Basic documentation on how to run and use the application
4. Clean, well-commented code following best practices

## Additional Notes

- The application is designed for a single user
- Focus on creating a solid foundation that can be extended later
- Prioritize security, especially for the EVE Online authentication
- Use modern React patterns (hooks, context API)
- Implement proper error handling and loading states
