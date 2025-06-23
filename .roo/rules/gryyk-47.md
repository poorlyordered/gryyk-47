# Gryyk-47 EVE Online AI Assistant

Every time you choose to apply a rule(s), explicitly state the rule(s) in the output. You can abbreviate the rule description to a single word or phrase.

## What We're Building
This EVE Online AI strategic advisor helps corporation leaders maintain strategic continuity and make better decisions. Key features include:

- EVE Online SSO authentication
- Strategic Matrix document management
- AI-powered strategic advice
- EVE Online API integration
- Chat interface for strategic discussions
- Web search capabilities for EVE Online information
- Third-party EVE tool integrations

## Code Style and Structure
- Write concise, technical TypeScript code with accurate examples
- Use functional React components with hooks
- Prefer custom hooks for shared logic
- Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError)
- Structure repository files as follows:
```
src/
├── components/     # React components
│   ├── ui/         # Reusable UI components
│   ├── layout/     # Layout components
│   ├── chat/       # Chat interface components
│   ├── auth/       # Authentication components
│   └── strategicMatrix/ # Strategic Matrix components
├── config/         # Configuration files
├── pages/          # Page components
├── services/       # API services
├── store/          # State management
├── types/          # TypeScript types
└── utils/          # Helper functions
```

## Tech Stack
### Frontend
- React with TypeScript
- Vite for development and building
- Tailwind CSS for styling
- React Router for navigation
- Lucide React for icons
- Redux or Context API for state management

### Backend
- NoCodeBackend with MariaDB
- JWT-based authentication
- OAuth for EVE Online API access
- OpenRouter API for LLM access

### External APIs
- EVE Online ESI (EVE Swagger Interface)
- OpenRouter API (with Grok as default LLM)
- Search APIs for web search capabilities
- Third-party EVE Online tools

## Naming Conventions
### Component Files
- Use PascalCase for component files (e.g., Button.tsx, StrategicMatrixCard.tsx)
- Group related components with descriptive prefixes (e.g., StrategicMatrixList.tsx)
- Use suffixes to indicate component type when needed (e.g., ChatInput.tsx, ChatMessage.tsx)

### Component Directories
- Use kebab-case for directories (e.g., components/layout/, components/ui/)
- Group components by feature or type:
  - auth/ - Authentication and user management
  - chat/ - Chat interface components
  - layout/ - Layout components
  - strategicMatrix/ - Strategic Matrix components
  - ui/ - Shared UI components

### Props and Types
- Use PascalCase for type and interface names (e.g., StrategicDocument, AuthState)
- Use camelCase for prop names (e.g., maxWidth, showIcon)
- Boolean props should use is/has/should prefixes (e.g., isLoading, hasError)
- Event handlers should use handle prefix (e.g., handleSubmit, handleClick)

## React Component Structure
### Component Template
```tsx
import React from 'react'
import type { ComponentProps } from '@/types'

interface Props extends ComponentProps {
  title: string
  isLoading?: boolean
  onAction: () => void
}

export function ExampleComponent({ 
  title,
  isLoading = false,
  onAction 
}: Props) {
  // 1. Hooks
  const [state, setState] = useState(false)

  // 2. Derived state
  const classes = cn('base-class', {
    'is-loading': isLoading
  })

  // 3. Effects
  useEffect(() => {
    // Setup
    return () => {
      // Cleanup
    }
  }, [])

  // 4. Event handlers
  const handleClick = () => {
    setState(!state)
    onAction()
  }

  // 5. Render
  return (
    <div className={classes}>
      <h2>{title}</h2>
      {/* Component content */}
    </div>
  )
}
```

## State Management
- Use React hooks for local state
- Use Redux or Context API for global state
- Use custom hooks for shared logic
- Use NoCodeBackend for:
  - Data persistence
  - User authentication
  - Strategic Matrix document storage

## Syntax and Formatting
- Use TypeScript for type safety
- Follow React hooks patterns
- Use proper TypeScript interfaces for props
- Use type inference where possible
- Avoid any type

## UI and Styling
- Use Tailwind CSS for styling
- Follow utility-first CSS approach
- Ensure responsive design
- Use Lucide React for icons
- Maintain consistent spacing and layout
- Create a dark theme suitable for EVE Online aesthetics

## Error Handling
- Implement error boundaries
- Use try/catch blocks appropriately
- Provide user-friendly error messages
- Handle network failures gracefully
- Log errors for debugging
- Handle EVE Online API errors specifically

## Project Management
### Energy/Focus Units Approach [PM-RULES]
- Use energy/focus units for ALL task sizing instead of rigid timeframes:
  - **Quick Win**: Immediate, low-effort task (30-60 minutes)
  - **Sprint**: Focused 4-6 hour block
  - **Deep Work**: Full day dedicated effort
  - **Project Phase**: Multi-day concentrated work
  - **Milestone**: Significant deliverable completion

- Apply energy/focus sizing to all project tasks:
  - Quick Win: Simple features, bug fixes, documentation updates
  - Sprint: Component implementation, feature development
  - Deep Work: Complex features, architectural changes
  - Project Phase: Major feature sets, system integration
  - Milestone: Version releases, major functionality completion

- Examples of task sizing by category:
  - **Development Tasks**:
    - Quick Win: Add form validation, implement simple UI component
    - Sprint: Build authentication flow, implement chat interface
    - Deep Work: Create Strategic Matrix system, implement EVE API integration
  
  - **Testing Tasks**:
    - Quick Win: Simple component tests, test setup
    - Sprint: Authentication component tests, chat interface tests
    - Deep Work: Strategic Matrix component tests, EVE API integration tests
    - Project Phase: E2E testing setup and implementation
    - Milestone: Error handling extension across components

  - **Bug Fixing**:
    - Quick Win Bugs: UI tweaks, text changes, simple validation fixes
    - Sprint Bugs: Component logic issues, form handling problems
    - Deep Work Bugs: Cross-component issues, data flow problems

- Track progress in appropriate markdown files
- Document bugs using markdown files in priority folders
- Review tasks weekly and select based on available energy

### Unit Tests
- Co-locate test files with components
- Follow Arrange-Act-Assert pattern
- Test both success and error cases
- Test component props and events
- Test EVE API integration points

## Security
- Use JWT for authentication
- Implement OAuth for EVE Online API access
- Secure storage of API keys
- Protect sensitive corporation data
- Sanitize user inputs
- Implement proper data access policies

## EVE Online Specific Rules [EVE-RULES]
- Always consider the meta-game implications of any strategy
- Factor in timezone coverage for operations
- Account for skill levels of corporation members
- Maintain OPSEC at all times - strategic discussions should be secure
- Anticipate changes from CCP's updates and patches
- Balance risk vs. reward in all strategic recommendations
- Consider morale impacts of strategic decisions
- Remember that economic warfare is as important as combat

## Strategic Matrix Rules [SM-RULES]
- Maintain seven categories of strategic documents:
  - Corporation Context: History, leadership, values, vision
  - Active Context: Current initiatives, recent decisions, immediate threats/opportunities
  - Asset Information: Territory, fleet, infrastructure
  - Diplomatic Relations: Alliances, relationships, treaties, enemies
  - Operational Details: Current PvP/PvE operations, industrial activities
  - Threat Analysis: Hostile entities, market threats, vulnerabilities
  - Opportunity Assessment: Potential expansions, economic opportunities

- Strategic Matrix documents should be:
  - Concise and focused
  - Regularly updated
  - Cross-referenced where appropriate
  - Formatted in markdown
  - Accessible from the chat interface

## Git Usage [VCS-RULES]
Commit Message Prefixes:
- "fix:"    for bug fixes
- "feat:"   for new features
- "mem:"    for Memory Bank updates
- "perf:"   for performance improvements
- "docs:"   for documentation changes
- "style:"  for formatting changes
- "refactor:" for code refactoring
- "test:"   for adding missing tests
- "chore:"  for maintenance tasks

Energy/Focus Tags:
- "[quick-win]" for Quick Win tasks
- "[sprint]" for Sprint tasks
- "[deep-work]" for Deep Work tasks
- "[project]" for Project Phase tasks
- "[milestone]" for Milestone completions

Examples:
- "test: [quick-win] add authentication tests"
- "fix: [sprint] resolve EVE SSO authentication flow issues"
- "feat: [deep-work] implement Strategic Matrix editor"

Rules:
- Use lowercase for commit messages
- Keep summary under 72 characters
- Include affected components in description
- Reference Memory Bank sections when applicable
- Add validation tags: [CONFIRM], [VERIFY], [VALIDATE]
- Include rule abbreviations: (AUTH-RULES), (EVE-RULES), etc.

## Memory Bank Compliance [CLI-RULES]
1. Explicitly reference documentation sections using:
   ```plaintext
   [Check productContext.md#feature-x]
   [Verify progress.md milestone-a] 
   [Confirm systemPatterns.md#data-flow]
   ```
2. Validate against context files before acting:
   ```plaintext
   {Check techContext.md#api-rules}
   {Validate against systemPatterns.md}
   {Enforce architecture guidelines}
   ```
3. Update Memory Bank after significant changes:
   ```plaintext
   {Update activeContext.md with current task}
   {Add to progress.md completed items}
   {Record decisions in systemPatterns.md}
   ```

## Documentation
- Maintain clear README with setup instructions
- Document API interactions and data flows
- Document:
  - Component props and types
  - Database schema and relationships
  - Security policies and access controls
  - EVE Online API integration
  - Strategic Matrix system
  - Setup instructions for development
- Don't include comments unless it's for complex logic
- Add validation triggers:  
  ```plaintext
  [CONFIRM] Does this align with productContext?  
  [VERIFY] Cross-check with systemPatterns  
  [VALIDATE] Against progress.md goals
  ```
- Include rule-specific references:  
  ```plaintext
  (AUTH-RULES) Validate session tokens  
  (EVE-RULES) Consider timezone coverage  
  (SM-RULES) Update Strategic Matrix documents
  ```

## Development Workflow
- Use proper version control
- Implement proper code review process
- Test in multiple environments
- Follow semantic versioning for releases
- Maintain changelog
- Update Memory Bank regularly
- Select tasks based on available energy/focus level
- Use energy/focus units for planning and estimation

## AI Strategic Advisor Workflows [AI-RULES]
- Starting Strategic Sessions:
  1. Check for Strategic Matrix files
  2. Read ALL files before proceeding
  3. Verify complete strategic context
  4. Begin strategic analysis

- During Strategic Planning:
  1. Follow established corporation goals
  2. Maintain consistency with previous decisions
  3. Consider both short-term tactics and long-term goals

- When addressing complex challenges:
  1. Rate confidence in strategic assessment (0-10)
  2. If < 9, explain what is clear, unreliable, and needed
  3. Only proceed with major recommendations when confidence ≥ 9

- Memory Bank Updates:
  1. Document current state of operations and strategies
  2. Make next strategic steps clear
  3. Complete current strategic assessment

For all designs I ask you to make, have them be beautiful, not cookie cutter. Make webpages that are fully featured and worthy for production.

By default, this template supports JSX syntax with Tailwind CSS classes, React hooks, and Lucide React for icons. Do not install other packages for UI themes, icons, etc unless absolutely necessary or I request them.

Use icons from lucide-react for logos.

Use stock photos from unsplash where appropriate, only valid URLs you know exist. Do not download the images, only link to them in image tags.
