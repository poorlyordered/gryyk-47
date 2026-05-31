import { Inngest } from 'inngest';
import { serve } from 'inngest/lambda';
import { runResearchPull } from './lib/research-engine';

const DEFAULT_CORPORATION_ID = process.env.RESEARCH_CORPORATION_ID || 'global';

export const inngest = new Inngest({
  id: 'gryyk-47',
  name: 'Gryyk-47',
});

const dailyResearchPull = inngest.createFunction(
  {
    id: 'daily-eve-research-pull',
    name: 'Daily EVE research pull',
    triggers: [{ cron: '0 12 * * *' }],
  },
  async ({ step }) => {
    return step.run('pull-official-eve-news', () =>
      runResearchPull({
        corporationId: DEFAULT_CORPORATION_ID,
        requestedBy: 'inngest-daily',
        focus: 'All strategic areas',
        limit: 12,
      })
    );
  }
);

const requestedResearchPull = inngest.createFunction(
  {
    id: 'requested-eve-research-pull',
    name: 'Requested EVE research pull',
    triggers: [{ event: 'gryyk/research.pull' }],
  },
  async ({ event, step }) => {
    const data = event.data || {};
    return step.run('pull-requested-eve-news', () =>
      runResearchPull({
        corporationId: typeof data.corporationId === 'string' ? data.corporationId : DEFAULT_CORPORATION_ID,
        requestedBy: typeof data.requestedBy === 'string' ? data.requestedBy : 'inngest-event',
        focus: typeof data.focus === 'string' ? data.focus : 'All strategic areas',
        limit: typeof data.limit === 'number' ? data.limit : 12,
      })
    );
  }
);

export const handler = serve({
  client: inngest,
  functions: [dailyResearchPull, requestedResearchPull],
});
