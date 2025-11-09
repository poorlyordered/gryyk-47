# Project Brief: Gryyk-47 EVE Online AI Assistant

## Project Overview
Gryyk-47 is an AI strategic advisor for EVE Online corporations, designed to:
- Provide strategic continuity and decision support
- Maintain institutional knowledge
- Analyze game data and provide recommendations
- Serve as a personal assistant for corporation leadership

## Core Requirements
1. **Dual Documentation Systems**:
   - Memory Bank: Tracks development decisions and technical context
   - Strategic Matrix: Manages in-game corporation documentation

2. **Strategic Advisory Capabilities**:
   - Maintain strategic context (assets, relations, operations)
   - Provide threat/opportunity analysis
   - Offer decision support for corporation leadership

2. **Technical Architecture**:
   - Hybrid vertical slice architecture
   - React frontend with Zustand state management
   - MongoDB backend via Netlify Functions
   - EVE Online API integration
   - OpenRouter AI integration

3. **User Experience**:
   - Chat-based interface
   - Strategic Matrix document system
   - EVE SSO authentication
   - Responsive design for desktop/tablet

## Key Features
- **Strategic Matrix**: Structured document system for corporation knowledge
- **AI Assistant**: Context-aware strategic recommendations
- **EVE Integration**: Real-time data from EVE Online APIs
- **Memory Bank**: Persistent knowledge management system
- **Confidence Scoring**: Assessment of recommendation quality

## Technical Specifications
- **Frontend**: React, Chakra UI, Zustand
- **Backend**: Netlify Functions, MongoDB Atlas
- **Authentication**: EVE Online SSO (OAuth 2.0)
- **AI Integration**: OpenRouter API (default: Grok)
- **Deployment**: Netlify with GitHub integration

## Current Status (2025-04-05)
- **Completion**: ~45%
- **Current Phase**: Implementing core features and EVE integration
- **Recent Milestones**:
  - Completed authentication system
  - Implemented MongoDB integration
  - Established Strategic Matrix structure
- **Next Steps**:
  - Complete EVE Online data services
  - Implement strategic workflows
  - Develop confidence assessment system

## Project Team
- Primary Developer: [User's Name]
- AI Integration: OpenRouter
- EVE Expertise: [User's Corporation]