# Contract: Command Brief UI

## Placement

The command brief appears in the authenticated chat experience as a first-screen
operating summary. On desktop it should be visible without opening the Tools tab.
On mobile it must remain reachable from the main chat view, not hidden in a
desktop-only sidebar.

## Required States

- **Loading**: Display while reading status/brief.
- **Processed**: Display latest processed brief and metadata.
- **Processing**: Display processing status and keep prior processed brief if one
  exists.
- **Failed**: Display failure message and keep prior processed brief if one
  exists.
- **Absent**: Display that no research request or brief is available yet.
- **Unavailable**: Display recoverable API/network failure without blocking chat.

## Required Content When Processed Brief Exists

- Executive summary or markdown brief excerpt.
- Strategic impacts.
- Recommended actions.
- Watchlist.
- Created time.
- Model.
- Source count.
- Confidence.
- Freshness/staleness indicator.
- Next human decision.

## Interaction Rules

- Refresh re-reads status and brief only.
- No command brief control queues research or long-running AI work.
- Recommendations are shown as decisions for the user, not as completed actions.
- Chat grounding uses the currently loaded brief until refreshed or replaced.
