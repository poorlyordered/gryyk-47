# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Build and Development:**
- `npm run dev` - Start development server (Vite) on port 5173
- `npm run build` - Build for production (TypeScript compilation + Vite build)
- `npm run prebuild` - Pre-build step that copies Netlify functions
- `npm run functions:build` - Build Netlify functions only
- `npm run preview` - Preview production build locally

**Code Quality:**
- `npm run lint` - Run ESLint on the codebase

**Testing:**
- `npm run test:ci` - **Primary test command** (same as Netlify deployment)
- `node scripts/netlify-test.js` - Run tests directly via Node.js
- `npm test` - Run all tests with Vitest (requires vitest installation)
- `npm run test:watch` - Run tests in watch mode for development
- `npm run test:coverage` - Generate coverage report
- `npm run test:unit` - Run unit tests only
- `npm run test:system` - Run system/integration tests only
- `npm run test:components` - Run component tests only
- `npm run test:ui` - Open Vitest UI for interactive testing
- `./scripts/run-tests.sh` - Comprehensive test suite with WSL optimization

**MongoDB MCP:**
- `npm run mcp:mongodb` - Start MongoDB MCP server for database operations

**Mastra AI Agents:**
- Mastra agents are available in `mastra/` directory
- Use `import { mastra } from './mastra'` to access the Mastra instance
- All agents use OpenRouter with your existing API key configuration

## Architecture Overview

This is a React + TypeScript EVE Online strategic planning application built with:

### Frontend Stack
- **React 18** with TypeScript and Vite
- **Chakra UI** for component library and theming
- **Zustand** for state management with persistence
- **React Router** for client-side routing

### Backend Architecture
- **Netlify Functions** (serverless) for API endpoints in `netlify/functions/`
- **MongoDB** for data persistence
- **EVE Online SSO** for authentication using JWT tokens
- **Mastra AI Framework** for intelligent agents and workflows using OpenRouter

### Testing Architecture
- **Node.js Testing** - Lightweight, fast tests for production deployment validation
- **Netlify Integration** - Tests run automatically before every deployment
- **GitHub Actions** - Continuous integration testing on every commit/PR
- **Vitest** - Advanced testing framework for development (optional)
- **Testing Library** - Component testing focused on user behavior (development)
- **MongoDB Memory Server** - In-memory database for isolated system tests (development)

### Key Architectural Patterns

**Core Module System:**
- `src/core/` contains foundational modules:
  - `api-client/` - Centralized API client using native fetch
  - `auth/` - Authentication utilities and token management
  - `event-bus/` - Event-driven communication system

**Feature-Based Organization:**
- `src/features/strategicMatrix/` - Strategic planning documents system
- Components organized in `composite/` (complex) and `core/` (basic) subdirectories
- Each feature has its own store, types, hooks, and utilities

**State Management:**
- Zustand stores in `src/store/` for global state (auth, chat)
- Feature-specific stores within feature directories
- Persistent storage for authentication and strategic matrix data

**Authentication Flow:**
- EVE Online SSO integration with callback handling
- JWT token validation (local + optional server verification)
- Protected routes with automatic token expiry handling
- Graceful degradation for network failures during token verification

### Strategic Matrix System
The core feature organizing strategic planning documents into categories:
1. Corporation Context
2. Active Context  
3. Asset Information
4. Diplomatic Relations
5. Operational Details
6. Threat Analysis
7. Opportunity Assessment

Documents are managed through a dedicated store with CRUD operations and category-based filtering.

### Hierarchical Multi-Agent System
The project implements a sophisticated AI command structure with **Gryyk-47** as the system orchestrator managing specialized agents:

**System Orchestrator:**
- **Gryyk-47** (Grok-3) - Primary strategic advisor and agent coordinator
- **Centralized Memory Management** - All agent experiences and decisions stored in MongoDB
- **Intelligent Query Routing** - Automatically determines which specialists to consult
- **Response Synthesis** - Combines specialist insights into comprehensive recommendations

**Highsec Specialist Agents (Grok-3 Mini):**
- **Recruiting Specialist** - Member acquisition, retention, and onboarding strategies
- **Economic Specialist** - Income optimization, investment analysis, financial planning
- **Market Specialist** - Trading opportunities, market analysis, price forecasting
- **Mining Specialist** - Fleet operations, yield optimization, ore analysis
- **Mission Specialist** - PvE optimization, fitting recommendations, loyalty point analysis

**Orchestration Features:**
- **Memory-Driven Learning** - Agents learn from past decisions and outcomes
- **Pattern Recognition** - Cross-agent insights identified automatically
- **Parallel Processing** - Multiple specialists consulted simultaneously
- **Contextual Integration** - Strategic Matrix documents integrated into agent context

**Usage Patterns:**
```typescript
// Orchestrated chat request (automatic specialist consultation)
import { sendOrchestatedChatRequest } from '../services/gryyk-orchestrator';

const response = await sendOrchestatedChatRequest(
  messages,
  sessionId,
  corporationId,
  true // Enable orchestration
);

// Direct workflow execution
import { highsecOperationsWorkflow } from '../mastra/workflows/highsec-operations';

const result = await mastra.workflow('highsec-operations').run({
  corporationName: 'Gryyk-47',
  memberCount: 25,
  operationGoals: ['recruitment', 'income_optimization', 'mining_expansion'],
  timeHorizon: 'short-term'
});
```

## Key Files and Directories

**Configuration:**
- `netlify.toml` - Netlify deployment and function configuration
- `build-functions.js` - Custom script to copy TypeScript functions for Netlify
- `vite.config.ts` - Vite configuration excluding lucide-react from optimization
- `vitest.config.ts` - Vitest testing framework configuration with coverage thresholds

**Core Application:**
- `src/App.tsx` - Main application with routing and authentication verification
- `src/store/auth.ts` - Authentication state management
- `src/components/auth/ProtectedRoute.tsx` - Route protection wrapper

**Netlify Functions:**
- `auth-verify.ts` - Token verification endpoint
- `strategic-matrix.ts` - Strategic document CRUD operations
- `eve-api-proxy.ts` - Proxy for EVE Online API calls
- Functions are copied to `netlify/functions-dist/` during build

**Mastra AI Directory:**
- `mastra/index.ts` - Main Mastra configuration with OpenRouter integration
- `mastra/agents/highsec/` - Highsec specialist agents (recruiting, economic, market, mining, mission)
- `mastra/workflows/` - Multi-step AI workflows for complex operations
- `mastra/services/` - Memory service and orchestrator implementation
- `mastra/config/` - Model configurations (Grok-3 orchestrator, Grok-3 Mini specialists)

**Orchestrator Integration:**
- `src/services/gryyk-orchestrator.ts` - Chat system integration with multi-agent orchestration
- Automatic specialist consultation based on query analysis
- Memory-enhanced responses with learning capabilities

**Testing Directory:**
- `scripts/netlify-test.js` - **Primary test runner** for deployment validation
- `tests/setup.ts` - Global test configuration and custom matchers
- `tests/unit/` - Isolated unit tests for core business logic
- `tests/system/` - End-to-end system tests with MongoDB Memory Server
- `tests/integration/` - Component integration tests with user interactions
- `scripts/run-tests.sh` - WSL-optimized comprehensive testing script
- `.github/workflows/test.yml` - GitHub Actions CI/CD pipeline

## Development Rules and Standards

**Core Development Mode:**
- Start in PLAN mode for any multi-step tasks - gather information and create plans before implementing
- Only move to ACT mode when user explicitly types "ACT" or approves the plan
- Print `# Mode: PLAN` or `# Mode: ACT` at the beginning of responses for complex tasks

**TypeScript Standards:**
- Import core types from unified `src/types/core/domain-types.ts` when available
- Prefer interfaces over types for object definitions
- Avoid `any`, prefer `unknown` for unknown types
- Use explicit return types for public functions
- Enable strict mode and implement proper error handling

**Code Quality Standards:**
- Replace magic numbers with named constants
- Use meaningful, descriptive names that reveal purpose
- Keep functions small and focused (single responsibility)
- Don't repeat code - extract into reusable functions
- Make file-by-file changes to allow for review
- Preserve existing code structures and don't remove unrelated functionality
- Provide all edits in single chunks rather than multi-step instructions

**Clean Code Practices:**
- Comments should explain "why", not "what" (make code self-documenting)
- Use smart comments for APIs, complex algorithms, and non-obvious side effects
- Maintain single sources of truth
- Hide implementation details through proper encapsulation
- Refactor continuously and fix technical debt early

**Testing Standards:**
- **ALWAYS run `npm run test:ci` before committing** - this is the same test Netlify uses
- Write tests for all new features and critical business logic
- Use the lightweight Node.js test runner for deployment validation
- Use Vitest for advanced development testing (optional)
- Follow the three-tier testing structure: unit → integration → system
- Test user behavior, not implementation details
- Use descriptive test names that explain the expected behavior
- Mock external dependencies in unit tests, use real implementations in system tests

**Communication Guidelines:**
- Verify information before presenting it
- Don't make assumptions or speculate without evidence
- No apologies, understanding feedback, or unnecessary summaries
- Don't suggest whitespace changes or ask for confirmation of provided information
- Provide links to real files, not documentation placeholders

## Mastra AI Integration

**Environment Setup:**
- Mastra uses the same `OPENROUTER_API_KEY` as your existing chat system
- No additional API keys required - seamless integration with current setup
- All models (Grok, Claude, GPT-4o, Llama) available through unified interface

**Orchestrated Development Patterns:**
```typescript
// Import orchestrator service
import { sendOrchestatedChatRequest, shouldUseOrchestration } from '../services/gryyk-orchestrator';

// Enhanced chat with automatic specialist consultation
const response = await sendOrchestatedChatRequest(
  messages,
  sessionId,
  corporationId,
  shouldUseOrchestration(query) // Auto-detect complex queries
);

// Direct specialist access
import { recruitingSpecialist, economicSpecialist } from '../mastra/agents/highsec';

const recruitmentAnalysis = await recruitingSpecialist.run({
  action: 'developRecruitmentStrategy',
  input: {
    targetRole: 'miner',
    currentMembers: 25,
    activityLevel: 'regular',
    experienceLevel: 'mixed'
  }
});

// Comprehensive workflows
import { highsecOperationsWorkflow } from '../mastra/workflows/highsec-operations';

const operationalPlan = await mastra.workflow('highsec-operations').run({
  corporationName: 'Gryyk-47',
  memberCount: 25,
  operationGoals: ['recruitment', 'income_optimization'],
  timeHorizon: 'short-term'
});
```

**Memory and Learning Integration:**
```typescript
// Memory service for historical context
import { MemoryService } from '../mastra/services/memory-service';

const memoryService = new MemoryService(mongoUri);
const memories = await memoryService.getAgentMemories('recruiting', query, corporationId);

// Update effectiveness based on outcomes
await updateMemoryEffectiveness(sessionId, 8, 'Successful recruitment strategy');
```

**Available Tools per Specialist:**
- **Recruiting**: `developRecruitmentStrategy`, `evaluateApplication`, `analyzeRetention`
- **Economic**: `analyzeIncomeStreams`, `evaluateInvestment`, `optimizeTaxation`
- **Market**: `analyzeMarketTrends`, `identifyTradingOpportunities`, `analyzeProfitability`
- **Mining**: `planMiningOperation`, `optimizeYield`, `analyzeOrePrices`
- **Mission**: `planMissionRunning`, `optimizeFitting`, `analyzeLoyaltyPoints`

## Testing Framework

### Testing Stack
The project uses a modern, WSL-optimized testing setup built around **Vitest** for maximum performance and developer experience:

**Core Testing Tools:**
- **Vitest** - Fast, Vite-native test runner with ESM support
- **@testing-library/react** - Component testing focused on user interactions
- **@testing-library/jest-dom** - Additional DOM testing matchers
- **JSDOM** - Browser environment simulation for component tests
- **MongoDB Memory Server** - Isolated in-memory database for system tests

**Testing Features:**
- **Native TypeScript Support** - No transforms or complex configuration needed
- **Hot Module Replacement** - Tests update instantly during development
- **Interactive UI** - Visual test runner with `npm run test:ui`
- **Coverage Reporting** - V8 coverage with configurable thresholds
- **Custom Matchers** - Domain-specific assertions for agent configurations

### Test Structure
Tests are organized in three tiers following testing best practices:

```
tests/
├── unit/                           # Fast, isolated unit tests
│   ├── configuration-manager.test.ts      # Core business logic
│   └── configuration-validation.test.ts   # Validation functions
├── system/                         # End-to-end system tests
│   └── agent-configuration-system.test.ts # Full workflow testing
└── integration/                    # Component integration tests
    └── agent-configuration-ui.test.tsx    # UI component testing
```

**Unit Tests (tests/unit/):**
- Test individual functions and classes in isolation
- Mock external dependencies and focus on business logic
- Fast execution (< 100ms per test)
- High coverage of core configuration management

**System Tests (tests/system/):**
- Test complete workflows from start to finish
- Use MongoDB Memory Server for database isolation
- Validate entire agent configuration lifecycle
- Cover corporation profile creation, agent setup, and orchestration

**Component Tests (tests/integration/):**
- Test React components with user interactions
- Verify UI behavior and form validation
- Test component integration with state management
- Cover the complete user journey through configuration interfaces

### Running Tests

**Quick Testing (Recommended):**
```bash
# Primary test command (same as Netlify deployment)
npm run test:ci

# Run tests directly via Node.js
node scripts/netlify-test.js

# Quick production readiness check
npm run test:ci && npm run build
```

**Development Workflow:**
```bash
# Watch mode for active development (requires vitest installation)
npm run test:watch

# Run specific test suites during feature development
npm run test:unit       # Quick feedback on business logic
npm run test:components # UI component validation
npm run test:system     # Full integration validation

# Interactive testing with UI
npm run test:ui
```

**CI/CD and Quality Assurance:**
```bash
# Full test suite with coverage (development)
npm run test:coverage

# WSL-optimized comprehensive testing
./scripts/run-tests.sh

# Production deployment simulation
npm run test:ci && node build-functions.js
```

### Test Configuration

**Vitest Configuration (vitest.config.ts):**
- Optimized for Vite + TypeScript + React stack
- Path aliases matching main Vite configuration
- 70% coverage thresholds across all metrics
- 30-second timeout for system tests with MongoDB

**Custom Test Setup (tests/setup.ts):**
- Global mocks for DOM APIs (localStorage, ResizeObserver, etc.)
- Custom matchers for agent configuration validation
- Console noise reduction for cleaner test output
- WSL-compatible environment setup

### Agent Configuration Testing

**Configuration Validation Testing:**
```typescript
import { validateConfiguration, validatePersonality } from '@features/agentConfiguration';

// Test personality validation with trait ranges
const validation = validatePersonality(testPersonality);
expect(validation.isValid).toBe(true);
expect(validation.score).toBeGreaterThan(80);

// Test configuration with custom matchers
expect(agentConfig).toBeValidConfiguration();
expect(personality).toBeValidPersonality();
```

**System Workflow Testing:**
```typescript
// Complete agent configuration workflow
const profile = await configManager.createCorporationProfile(profileData);
const personality = await configManager.createPersonality(personalityData);
const updatedAgent = await configManager.updateAgentConfiguration(
  profile.corporationId, 'economic-specialist', updates, 'test-user'
);

// Verify end-to-end configuration
expect(updatedAgent.personality.name).toBe('Custom Economic Advisor');
expect(updatedAgent.version).toBeGreaterThan(1);
```

**UI Component Testing:**
```typescript
// Test complete wizard flow
render(<CorporationProfileWizard onComplete={mockOnComplete} />);

// User interactions through all wizard steps
await user.type(screen.getByPlaceholderText('Enter corporation name'), 'Test Corp');
await user.click(screen.getByText('Next'));
// ... continue through all steps

// Verify completion callback
expect(mockOnComplete).toHaveBeenCalledWith(
  expect.objectContaining({ name: 'Test Corp' })
);
```

### Testing Best Practices

**Unit Test Guidelines:**
- One assertion per logical concept
- Descriptive test names that explain the behavior being tested
- Arrange-Act-Assert pattern for clarity
- Mock external dependencies completely

**System Test Guidelines:**
- Test realistic user scenarios end-to-end
- Use MongoDB Memory Server for true isolation
- Verify both happy path and error conditions
- Test concurrent operations and edge cases

**Component Test Guidelines:**
- Test user interactions, not implementation details
- Use accessible queries (getByRole, getByLabelText)
- Verify complete user workflows through components
- Test error states and loading conditions

### WSL Optimization

The testing framework is specifically optimized for Windows Subsystem for Linux:

**Performance Optimizations:**
- Native ESM support eliminates transform overhead
- Vite's development server provides instant test updates
- MongoDB Memory Server configured for WSL file system performance
- Parallel test execution optimized for WSL resource constraints

**WSL-Specific Features:**
- File watching optimized for WSL file system events
- Memory usage tuned for WSL virtual machine constraints
- Network mocking configured for WSL networking behavior
- Path resolution handles WSL file system mapping

## Important Notes

- The application uses port 5173 to match EVE Online SSO callback URL registration
- MongoDB connection is handled through MCP server integration
- Authentication tokens are validated locally first, with optional server verification that doesn't cause logout on failure
- All API endpoints are proxied through Netlify functions for CORS and authentication middleware
- TypeScript is configured with strict mode and module resolution set to "bundler"
- **Hierarchical AI System**: Gryyk-47 orchestrator (Grok-3) manages specialist agents (Grok-3 Mini)
- **Centralized Memory**: All agent experiences stored in MongoDB with pattern recognition
- **Automatic Orchestration**: Complex queries trigger multi-agent consultation automatically
- **Learning System**: Agents improve recommendations based on historical outcomes and user feedback