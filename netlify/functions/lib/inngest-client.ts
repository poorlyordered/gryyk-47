import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'gryyk-47',
  name: 'Gryyk-47',
  eventKey: process.env.INNGEST_EVENT_KEY,
  signingKey: process.env.INNGEST_SIGNING_KEY,
});
