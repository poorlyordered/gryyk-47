# Quickstart: Command Brief MVP

## Prerequisites

- `.env` contains server-side `MONGODB_URI` and `MONGODB_DB`.
- EVE OAuth login works locally or in Netlify.
- A processed OvernightDesk brief exists for corporation `917701062` and focus
  `grykk-47-eve-official-news`.

## Local Verification

1. Install dependencies if needed.

   ```bash
   npm install
   ```

2. Run tests.

   ```bash
   npm run test:ci
   ```

3. Build the app and functions.

   ```bash
   npm run build
   ```

4. Start local Netlify dev.

   ```bash
   npm run netlify:dev
   ```

5. Log in through EVE OAuth and navigate to chat.

6. Verify the command brief:

   - appears automatically after chat loads;
   - shows status/freshness, created time, model, source count, and confidence;
   - shows executive summary, strategic impacts, recommended actions, watchlist,
     and next human decision;
   - keeps chat usable if research status or brief loading fails;
   - does not queue new research jobs when refreshed.

7. Ask chat about the current official EVE news brief and verify it can answer
   from the active command brief context without manual paste.

## Implementation Verification Notes

- `npm run test:ci` passes the existing Netlify smoke suite.
- Targeted Vitest command brief suite passes:

  ```bash
  npx vitest run tests/unit/command-brief.test.ts tests/unit/command-brief-store.test.ts tests/components/CommandBrief.test.tsx tests/components/CommandBriefStates.test.tsx tests/components/CommandBriefDecision.test.tsx tests/components/ChatCommandBrief.test.tsx
  ```

- `npm run build` passes and rebuilds `dist/` plus `netlify/functions-dist/`.
- Browser OAuth verification still requires a live local or deployed session with
  valid EVE SSO credentials.
