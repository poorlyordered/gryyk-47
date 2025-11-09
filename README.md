# Gryyk-47 EVE Online Strategic AI Assistant

A comprehensive EVE Online corporation management platform featuring strategic planning tools, AI-powered analysis, and integrated chat systems for enhanced decision-making.

## 🧪 Testing

This project includes comprehensive testing to ensure reliability and quality before deployment.

### Quick Start - Run Tests Now
```bash
# Primary test command (same as Netlify uses)
npm run test:ci
```

This runs 11 essential tests covering:
- ✅ Configuration validation logic
- ✅ Data structure integrity  
- ✅ Environment compatibility
- ✅ Project file structure
- ✅ Core business logic

### Test Types
- **Deployment Tests**: Lightweight Node.js tests that run before every Netlify deployment
- **Unit Tests**: Core business logic validation using simple functions
- **Integration Tests**: Component and workflow testing with Vitest (development)
- **System Tests**: End-to-end testing with database integration (development)

### All Available Commands
```bash
# 🚀 Primary test command (RECOMMENDED)
npm run test:ci

# 📁 Run tests directly via Node.js
node scripts/netlify-test.js

# 🔄 Development testing (requires vitest installation)
npm test                    # Run all tests
npm run test:watch          # Watch mode for active development
npm run test:unit           # Unit tests only
npm run test:system         # System tests only  
npm run test:components     # Component tests only
npm run test:coverage       # Generate coverage report
npm run test:ui             # Interactive test UI

# 🔧 Comprehensive testing (WSL optimized)
./scripts/run-tests.sh
```

### What You'll See
When tests pass:
```
🎉 All tests passed! Build can proceed.
✅ Passed: 11
❌ Failed: 0
```

When tests fail:
```
💥 3 test(s) failed! Build should not proceed.
❌ should validate trait ranges - Expected true, got false
```

### Automated Testing
- **Netlify Build Testing**: Tests run automatically before each deployment
- **GitHub Actions**: Tests run on every push and pull request  
- **Quality Gates**: Deployments are blocked if tests fail
- **Zero Cost**: All testing is included free with Netlify and GitHub

## 🚀 Features

### 🤖 Hierarchical Multi-Agent AI System
- **Gryyk-47 System Orchestrator** (Grok-3): Primary strategic advisor that coordinates specialist agents
- **Highsec Specialist Agents** (Grok-3 Mini): Domain experts for focused analysis
  - **Recruiting Specialist**: Member acquisition, retention, and onboarding strategies
  - **Economic Specialist**: Income optimization, investment analysis, financial planning
  - **Market Specialist**: Trading opportunities, market analysis, price forecasting
  - **Mining Specialist**: Fleet operations, yield optimization, ore analysis
  - **Mission Specialist**: PvE optimization, fitting recommendations, loyalty point analysis
- **Intelligent Orchestration**: Automatic specialist consultation based on query complexity
- **Memory-Driven Learning**: Centralized memory system with pattern recognition and outcome tracking

### 📊 Strategic Matrix System
Organize and manage strategic planning documents across 7 key categories:
1. Corporation Context
2. Active Context  
3. Asset Information
4. Diplomatic Relations
5. Operational Details
6. Threat Analysis
7. Opportunity Assessment

### 🔐 EVE Online Integration
- **EVE SSO Authentication**: Secure login using EVE Online credentials
- **ESI API Integration**: Real-time access to EVE character, corporation, and market data
- **Character Management**: Track pilot information and corporation membership

### 💬 Advanced AI Chat System
- **Orchestrated Conversations**: Multi-agent consultation triggered automatically for complex queries
- **Memory Integration**: AI learns from past decisions and their outcomes
- **Strategic Context**: Access to Strategic Matrix documents and historical corporation data
- **Streaming Responses**: Real-time AI response generation with specialist insights
- **Pattern Recognition**: Cross-domain insights identified automatically

## 🏗️ Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Chakra UI** for modern component design
- **Zustand** for state management with persistence
- **React Router** for client-side routing

### Backend & AI
- **Netlify Functions** for serverless API endpoints
- **MongoDB Atlas** for data persistence and AI memory storage
- **OpenRouter** for multi-model AI access (Grok-3, Grok-3 Mini, Claude, GPT-4o)
- **Mastra Framework** for hierarchical agent orchestration
- **Gryyk-47 Orchestrator** for intelligent specialist coordination
- **EVE ESI API** for real-time game data integration

## 🛠️ Installation

### Prerequisites
- Node.js v18 or higher
- MongoDB Atlas account
- EVE Online Developer Application
- OpenRouter API key

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd eve-ai-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment configuration**
   Create `.env` file:
   ```env
   VITE_OPENROUTER_API_KEY=your_openrouter_key
   VITE_EVE_CLIENT_ID=your_eve_client_id
   VITE_EVE_CLIENT_SECRET=your_eve_client_secret
   MONGODB_URI=your_mongodb_connection_string
   OPENROUTER_API_KEY=your_openrouter_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🔧 Development Commands

### Build and Development
- `npm run dev` - Start development server on port 5173
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### MongoDB and Specialized Services
- `npm run mcp:mongodb` - Start MongoDB MCP server
- `npm run functions:build` - Build Netlify functions

## 🤖 Hierarchical AI System Usage

### Orchestrated Chat Interaction
```typescript
// Automatic specialist consultation through chat
import { sendOrchestatedChatRequest } from './src/services/gryyk-orchestrator';

const response = await sendOrchestatedChatRequest(
  messages,
  sessionId,
  corporationId,
  true // Enable orchestration
);
// Gryyk-47 automatically consults relevant specialists and synthesizes response
```

### Direct Specialist Access
```typescript
import { recruitingSpecialist, economicSpecialist } from './mastra/agents/highsec';

// Recruiting analysis
const recruitmentPlan = await recruitingSpecialist.run({
  action: 'developRecruitmentStrategy',
  input: {
    targetRole: 'miner',
    currentMembers: 25,
    activityLevel: 'regular',
    experienceLevel: 'mixed'
  }
});

// Economic optimization
const incomeAnalysis = await economicSpecialist.run({
  action: 'analyzeIncomeStreams',
  input: {
    currentActivities: ['mining', 'missions', 'trading'],
    memberCount: 25,
    averageOnlineTime: 4,
    riskTolerance: 'medium'
  }
});
```

### Comprehensive Workflows
```typescript
import { highsecOperationsWorkflow } from './mastra/workflows/highsec-operations';

const operationalPlan = await mastra.workflow('highsec-operations').run({
  corporationName: 'Gryyk-47',
  memberCount: 25,
  operationGoals: ['recruitment', 'income_optimization', 'mining_expansion'],
  timeHorizon: 'short-term',
  memberActivity: 'medium'
});
```

### Available Specialist Tools

**Recruiting Specialist**
- `developRecruitmentStrategy` - Comprehensive recruitment planning
- `evaluateApplication` - Application screening and assessment
- `analyzeRetention` - Member retention analysis and improvements

**Economic Specialist**
- `analyzeIncomeStreams` - Income optimization across all activities
- `evaluateInvestment` - Investment opportunity analysis
- `optimizeTaxation` - Corporation taxation strategy optimization

**Market Specialist**
- `analyzeMarketTrends` - Market trend analysis and forecasting
- `identifyTradingOpportunities` - Trading strategy recommendations
- `analyzeProfitability` - Manufacturing and production profitability

**Mining Specialist**
- `planMiningOperation` - Mining fleet and operation planning
- `optimizeYield` - Mining efficiency and yield optimization
- `analyzeOrePrices` - Ore market analysis and target selection

**Mission Specialist**
- `planMissionRunning` - Mission strategy and agent optimization
- `optimizeFitting` - Ship fitting recommendations for PvE
- `analyzeLoyaltyPoints` - LP store analysis and purchase optimization

## 🏢 Project Structure

```
project/
├── src/                          # React frontend application
│   ├── components/               # React components
│   ├── pages/                    # Application pages
│   ├── services/                 # API services and integrations
│   ├── store/                    # Zustand state management
│   └── features/                 # Feature-specific modules
├── netlify/functions/            # Serverless API endpoints
├── mastra/                       # Hierarchical AI agent framework
│   ├── agents/highsec/           # Highsec specialist agents
│   │   ├── recruiting-specialist.ts
│   │   ├── economic-specialist.ts
│   │   ├── market-specialist.ts
│   │   ├── mining-specialist.ts
│   │   └── mission-specialist.ts
│   ├── services/                 # Memory and orchestration services
│   │   ├── memory-service.ts     # MongoDB memory management
│   │   └── orchestrator.ts       # Gryyk-47 orchestrator logic
│   ├── workflows/                # Multi-agent workflows
│   │   └── highsec-operations.ts # Comprehensive operational planning
│   ├── tools/                    # Agent tools and EVE API integration
│   └── config/                   # Model configurations (Grok-3/Mini)
├── scripts/                      # Utility scripts
└── ProjectDocuments/             # Project documentation
```

## 🚀 Deployment

The application is designed for deployment on Netlify with:
- Automatic builds from Git repository
- Netlify Functions for serverless backend
- Environment variable configuration
- MongoDB Atlas for production database

## 🔐 Security

- EVE Online SSO integration for secure authentication
- JWT token validation with graceful degradation
- Environment variable protection for API keys
- CORS configuration for secure cross-origin requests

## 📚 Documentation

- **CLAUDE.md** - Comprehensive development guide for AI assistants
- **ProjectDocuments/** - Detailed project specifications and plans
- **cline_docs/** - Development context and progress tracking

## 🤝 Contributing

This project follows clean code principles and TypeScript best practices. See CLAUDE.md for detailed development guidelines and coding standards.

Changes
## 📄 License

EVE Online and all related characters, names, marks, and logos are trademarks or registered trademarks of CCP hf. This project is not affiliated with or endorsed by CCP hf.