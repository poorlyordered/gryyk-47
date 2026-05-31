import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;
const RESEARCH_MODEL = process.env.RESEARCH_MODEL || process.env.OPENROUTER_MODEL || 'google/gemma-4-31b-it';

const FEEDS = [
  {
    name: 'EVE Online RSS',
    url: 'https://www.eveonline.com/rss',
    sourceType: 'official-news',
  },
];

export type ResearchItem = {
  title: string;
  url: string;
  publishedAt?: string;
  source: string;
  sourceType: string;
  description?: string;
};

export type ResearchPullInput = {
  corporationId: string;
  focus?: string;
  limit?: number;
  requestedBy?: string;
};

function decodeEntities(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function stripHtml(value: string): string {
  return decodeEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTagValue(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? stripHtml(match[1]) : '';
}

function parseRss(xml: string, feed: (typeof FEEDS)[number]): ResearchItem[] {
  const items = Array.from(xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)).map((match) => match[0]);
  return items
    .map((item) => ({
      title: getTagValue(item, 'title'),
      url: getTagValue(item, 'link'),
      publishedAt: getTagValue(item, 'pubDate'),
      description: stripHtml(getTagValue(item, 'description')).slice(0, 1800),
      source: feed.name,
      sourceType: feed.sourceType,
    }))
    .filter((item) => item.title && item.url);
}

function parseJsonFeed(text: string, feed: (typeof FEEDS)[number]): ResearchItem[] {
  const parsed = JSON.parse(text);
  const items = Array.isArray(parsed) ? parsed : parsed.items || [];
  return items
    .map((item: Record<string, any>) => ({
      title: item.title || item.name || '',
      url: item.url || item.link || item.id || '',
      publishedAt: item.date_published || item.pubDate || item.published || item.date,
      description: stripHtml(item.summary || item.content_text || item.content_html || item.description || '').slice(0, 1800),
      source: feed.name,
      sourceType: feed.sourceType,
    }))
    .filter((item: ResearchItem) => item.title && item.url);
}

async function fetchFeedItems(): Promise<ResearchItem[]> {
  const results = await Promise.allSettled(
    FEEDS.map(async (feed) => {
      const response = await fetch(feed.url, {
        headers: {
          Accept: 'application/rss+xml, application/json, text/xml, */*',
          'User-Agent': 'Gryyk-47 Research Pull',
        },
      });

      if (!response.ok) {
        throw new Error(`${feed.name} failed: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
        return parseJsonFeed(text, feed);
      }
      return parseRss(text, feed);
    })
  );

  const items = results.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.url || item.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildResearchPrompt(items: ResearchItem[], focus: string) {
  return `You are Gryyk-47's research analyst for an EVE Online corporation.

Process official EVE Online news into a strategic intelligence brief for corporation leadership. Focus on business-building flywheels: recruitment, member progression, income, operations cadence, industry, market positioning, risk, and strategic opportunities.

Focus requested: ${focus || 'All strategic areas'}

Return strict JSON only:
{
  "executiveSummary": "short summary",
  "briefMarkdown": "markdown brief with sections: Key Changes, Strategic Impact, Opportunities, Risks, Recommended Actions, Watchlist",
  "strategicImpacts": [{"area": "economy|industry|recruiting|operations|warfare|market|risk|community|other", "impact": "summary", "urgency": "low|medium|high"}],
  "recommendedActions": ["action 1", "action 2", "action 3"],
  "watchlist": ["thing to watch"],
  "memory": "durable strategic memory paragraph",
  "confidence": 0.75
}

Do not invent article details. If an article looks promotional rather than strategic, say so briefly and deprioritize it.

<OfficialEveNewsItems>
${JSON.stringify(items, null, 2)}
</OfficialEveNewsItems>`;
}

function parseBrief(text: string) {
  try {
    return JSON.parse(text);
  } catch (_error) {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        // Fallback below.
      }
    }
  }

  return {
    executiveSummary: 'Research pull completed, but the model returned an unstructured brief.',
    briefMarkdown: text,
    strategicImpacts: [],
    recommendedActions: [],
    watchlist: [],
    memory: text.slice(0, 1000),
    confidence: 0.5,
  };
}

export async function runResearchPull(input: ResearchPullInput) {
  if (!MONGODB_URI) throw new Error('MongoDB URI not configured');
  if (!OPENROUTER_API_KEY) throw new Error('OpenRouter API key not configured');

  const allItems = await fetchFeedItems();
  const items = allItems.slice(0, input.limit || 12);
  if (items.length === 0) {
    throw new Error('No EVE news items were available from configured feeds');
  }

  const openrouter = createOpenAI({
    apiKey: OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
  });
  const client = new MongoClient(MONGODB_URI);
  await client.connect();

  try {
    const db = client.db('gryyk47');
    const now = new Date();

    await db.collection('research_items').bulkWrite(
      items.map((item) => ({
        updateOne: {
          filter: { url: item.url },
          update: {
            $set: {
              ...item,
              lastSeenAt: now,
            },
            $setOnInsert: {
              firstSeenAt: now,
            },
          },
          upsert: true,
        },
      })),
      { ordered: false }
    );

    const result = await generateText({
      model: openrouter(RESEARCH_MODEL),
      prompt: buildResearchPrompt(items, input.focus || 'All strategic areas'),
      temperature: 0.35,
      maxTokens: 1400,
    });

    const brief = parseBrief(result.text);
    const document = {
      corporationId: input.corporationId,
      createdAt: now,
      requestedBy: input.requestedBy || 'scheduled',
      focus: input.focus || 'All strategic areas',
      sources: FEEDS.map((feed) => feed.url),
      items,
      brief,
    };

    const insert = await db.collection('research_briefs').insertOne(document);

    await db.collection('strategic_decisions').insertOne({
      timestamp: now,
      decisionContext: `Research brief: ${brief.executiveSummary}`,
      agentsConsulted: ['gryyk-47-research-analyst'],
      agentRecommendations: (brief.recommendedActions || []).map((action: string) => ({
        agentType: 'research-analyst',
        recommendation: action,
        confidence: brief.confidence || 0.5,
        reasoning: brief.memory || 'Generated during automated research pull',
      })),
      gryykSynthesis: brief.briefMarkdown,
      finalDecision: brief.memory || brief.executiveSummary,
      corporationId: input.corporationId,
      researchBriefId: insert.insertedId,
    });

    return {
      id: insert.insertedId.toString(),
      createdAt: now.toISOString(),
      corporationId: input.corporationId,
      focus: document.focus,
      itemCount: items.length,
      brief,
      items,
    };
  } finally {
    await client.close();
  }
}
