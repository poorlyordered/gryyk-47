# Product Context: Gryyk-47 EVE Online AI Assistant

## Why This Project Exists

Gryyk-47 is being developed to serve as an AI strategic advisor for EVE Online gameplay, specifically focused on providing strategic advice and assistance for corporation management. The project aims to leverage AI capabilities to analyze game data, maintain institutional knowledge, and provide strategic recommendations. Inspired by the concept of an "AI-guided corporation" in EVE Online, Gryyk-47 serves as a practical tool that a corporation leader can use to maintain strategic continuity and make better decisions.

## Problems It Solves

1. **Knowledge Management**: EVE Online is a complex game with vast amounts of information. Gryyk-47 helps maintain and organize this knowledge in a structured way through its memory bank system.

2. **Strategic Planning**: The AI assistant provides intermediate and long-term strategic planning for corporation activities, helping to optimize resource allocation, diplomatic relations, and operational decisions.

3. **Information Retrieval**: Instead of manually searching through multiple sources, Gryyk-47 can quickly retrieve relevant information from both its memory banks and external sources.

4. **Continuity**: The memory bank system ensures strategic continuity even as players come and go or take breaks from the game.

5. **Decision Support**: Helps corporation leadership make informed decisions by analyzing threats, opportunities, assets, and diplomatic relations in the context of EVE Online's complex environment.

## How It Should Work

1. **Chat Interface**: Users interact with Gryyk-47 through a modern chat interface, asking questions and receiving strategic advice.

2. **Memory Bank System**: The AI maintains a structured set of documents containing corporation information, strategic context, assets, diplomatic relations, operations, threats, and opportunities. This includes:
   - Corporation Context: History, leadership structure, values, and vision
   - Active Context: Current initiatives, recent decisions, immediate threats/opportunities
   - Asset Information: Territory holdings, fleet composition, infrastructure
   - Diplomatic Relations: Alliances, relationships, treaties, enemies
   - Operational Details: Current PvP/PvE operations, industrial activities, logistics
   - Threat Analysis: Hostile entities, market threats, vulnerabilities
   - Opportunity Assessment: Potential expansions, economic opportunities, recruitment targets

3. **EVE Online API Integration**: Gryyk-47 connects to the EVE Online API to retrieve real-time data about the user's character and corporation.

4. **LLM Flexibility**: The system uses OpenRouter to switch between different language models, with Grok as the default.

5. **Web Search & Tool Integration**: The AI can search the web and use third-party EVE Online tools to gather additional information when needed.

6. **Strategic Workflows**: The AI follows specific workflows for starting strategic sessions, planning, updating memory banks, and handling situations where context is unclear.

7. **Single-User Focus**: The application is designed for personal use by a single corporation leader.

8. **Deployment**: The application will be deployed on Netlify via GitHub, with NoCodeBackend providing the backend infrastructure.
