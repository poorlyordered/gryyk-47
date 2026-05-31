import type { Handler } from '@netlify/functions';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { MongoClient } from 'mongodb';
import { authenticateEveUser } from './auth-middleware';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MONGODB_URI = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;
const ESI_BASE_URL = 'https://esi.evetech.net/latest';

const openrouter = createOpenAI({
  apiKey: OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

type StrategyRefreshRequest = {
  corporationId?: string;
  sessionId?: string;
  focus?: string;
  leadershipInput?: string;
};

function truncate(value: unknown, maxLength = 1200): string {
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  if (!text) return '';
  return text.length > maxLength ? `${text.slice(0, maxLength)}\n...[truncated]` : text;
}

function asDateSort(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  return new Date(0);
}

async function fetchCorporationInfo(corporationId: string) {
  const response = await fetch(`${ESI_BASE_URL}/corporations/${corporationId}/`);
  if (!response.ok) {
    return {
      error: `Corporation info unavailable: ${response.status} ${response.statusText}`,
    };
  }
  return response.json();
}

async function buildContext(client: MongoClient, corporationId: string, characterId: string) {
  const matrixDb = client.db('Gryyk-47');
  const memoryDb = client.db('gryyk47');

  const [
    strategicDocuments,
    recentMessages,
    previousReports,
    strategicDecisions,
    agentExperiences,
    researchBriefs,
    corporationInfo,
  ] = await Promise.all([
    matrixDb
      .collection('strategic-matrix')
      .find({ corporationId })
      .sort({ updatedAt: -1 })
      .limit(20)
      .toArray(),
    memoryDb
      .collection('messages')
      .find({
        $or: [
          { corpId: corporationId },
          { corpId: characterId },
        ],
      })
      .sort({ timestamp: -1 })
      .limit(40)
      .toArray(),
    memoryDb
      .collection('strategy_refresh_reports')
      .find({ corporationId })
      .sort({ createdAt: -1 })
      .limit(3)
      .toArray(),
    memoryDb
      .collection('strategic_decisions')
      .find({ corporationId })
      .sort({ timestamp: -1 })
      .limit(12)
      .toArray(),
    memoryDb
      .collection('agent_experiences')
      .find({ corporationId })
      .sort({ timestamp: -1 })
      .limit(15)
      .toArray(),
    memoryDb
      .collection('research_briefs')
      .find({
        $or: [
          { corporationId },
          { corporationId: 'global' },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray(),
    fetchCorporationInfo(corporationId),
  ]);

  return {
    corporationInfo,
    strategicDocuments,
    recentMessages: recentMessages
      .sort((a, b) => asDateSort(a.timestamp).getTime() - asDateSort(b.timestamp).getTime()),
    previousReports,
    strategicDecisions,
    agentExperiences,
    researchBriefs,
  };
}

function buildPrompt(
  context: Awaited<ReturnType<typeof buildContext>>,
  request: Required<Pick<StrategyRefreshRequest, 'focus' | 'leadershipInput'>>,
) {
  const documents = context.strategicDocuments.map((doc) => ({
    type: doc.documentType || doc.category || doc.title || 'Strategic Document',
    updatedAt: doc.updatedAt || doc.lastUpdated,
    content: doc.content,
  }));

  const messages = context.recentMessages.map((message) => ({
    sender: message.sender,
    timestamp: message.timestamp,
    content: message.content,
    tags: message.tags || [],
  }));

  return `You are Gryyk-47, the strategic operating system for an EVE Online corporation.

Run a Strategy Update cycle. Treat this as a business-building flywheel:
1. Observe current data and memory.
2. Compare against previous decisions and strategy.
3. Summarize progress, drift, risks, and wins.
4. Ask leadership for the missing inputs needed to improve recommendations.
5. Suggest the next actions that compound into recruiting, capability, income, trust, and operational cadence.

Focus requested by leadership: ${request.focus || 'All strategic areas'}
Leadership input for this refresh: ${request.leadershipInput || 'No additional input provided'}

Return strict JSON only, with this shape:
{
  "executiveSummary": "short summary",
  "progressReportMarkdown": "markdown report with sections: Progress Since Last Update, Current Position, Flywheel Assessment, Risks And Blockers, Recommended Next Moves, Leadership Input Needed",
  "flywheelAssessment": "how the corporation's repeatable growth loop is working or failing",
  "suggestedActions": ["action 1", "action 2", "action 3"],
  "questionsForLeadership": ["question 1", "question 2", "question 3"],
  "strategicMemory": "one durable paragraph describing what should be remembered for future strategy cycles",
  "confidence": 0.75
}

Do not claim unavailable data exists. If data is missing, state the gap and ask for input. Be concise, operational, and specific.

<CurrentCorporationData>
${truncate(context.corporationInfo, 1600)}
</CurrentCorporationData>

<StrategicMatrixDocuments>
${truncate(documents, 6000)}
</StrategicMatrixDocuments>

<RecentChatMemory>
${truncate(messages, 6000)}
</RecentChatMemory>

<PreviousStrategyRefreshReports>
${truncate(context.previousReports, 4000)}
</PreviousStrategyRefreshReports>

<PriorStrategicDecisions>
${truncate(context.strategicDecisions, 5000)}
</PriorStrategicDecisions>

<AgentExperienceMemory>
${truncate(context.agentExperiences, 5000)}
</AgentExperienceMemory>

<RecentResearchBriefs>
${truncate(context.researchBriefs, 5000)}
</RecentResearchBriefs>`;
}

function parseReport(text: string) {
  try {
    return JSON.parse(text);
  } catch (_error) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // Fall through to markdown fallback.
      }
    }
  }

  return {
    executiveSummary: 'Strategy refresh completed, but the model returned an unstructured report.',
    progressReportMarkdown: text,
    flywheelAssessment: '',
    suggestedActions: [],
    questionsForLeadership: [],
    strategicMemory: text.slice(0, 1000),
    confidence: 0.5,
  };
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  if (!MONGODB_URI) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'MongoDB URI not configured' }),
    };
  }

  if (!OPENROUTER_API_KEY) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'OpenRouter API key not configured' }),
    };
  }

  try {
    const authResult = await authenticateEveUser(event.headers);
    const body = JSON.parse(event.body || '{}') as StrategyRefreshRequest;
    const corporationId = body.corporationId;

    if (!corporationId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'corporationId is required' }),
      };
    }

    const client = new MongoClient(MONGODB_URI);
    await client.connect();

    try {
      const context = await buildContext(
        client,
        corporationId,
        authResult.user.characterId.toString(),
      );
      const prompt = buildPrompt(context, {
        focus: body.focus || 'All strategic areas',
        leadershipInput: body.leadershipInput || '',
      });

      const result = await generateText({
        model: openrouter('google/gemma-4-31b-it'),
        prompt,
        temperature: 0.45,
        maxTokens: 2400,
      });

      const report = parseReport(result.text);
      const createdAt = new Date();
      const reportDocument = {
        corporationId,
        sessionId: body.sessionId,
        createdAt,
        createdBy: authResult.user.characterId.toString(),
        focus: body.focus || 'All strategic areas',
        leadershipInput: body.leadershipInput || '',
        report,
        contextSummary: {
          strategicDocuments: context.strategicDocuments.length,
          recentMessages: context.recentMessages.length,
          previousReports: context.previousReports.length,
          strategicDecisions: context.strategicDecisions.length,
          agentExperiences: context.agentExperiences.length,
          researchBriefs: context.researchBriefs.length,
        },
      };

      const insert = await client
        .db('gryyk47')
        .collection('strategy_refresh_reports')
        .insertOne(reportDocument);

      await client.db('gryyk47').collection('strategic_decisions').insertOne({
        timestamp: createdAt,
        decisionContext: `Strategy refresh: ${report.executiveSummary}`,
        agentsConsulted: ['gryyk-47-strategy-refresh'],
        agentRecommendations: (report.suggestedActions || []).map((action: string) => ({
          agentType: 'strategy-refresh',
          recommendation: action,
          confidence: report.confidence || 0.5,
          reasoning: report.flywheelAssessment || 'Generated during strategy refresh cycle',
        })),
        gryykSynthesis: report.progressReportMarkdown,
        finalDecision: report.strategicMemory || report.executiveSummary,
        corporationId,
        strategyRefreshId: insert.insertedId,
      });

      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: insert.insertedId.toString(),
          createdAt: createdAt.toISOString(),
          ...reportDocument,
          report,
        }),
      };
    } finally {
      await client.close();
    }
  } catch (error) {
    console.error('Strategy refresh error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
