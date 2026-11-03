# Tip knowledge library

Reusable **individual tip facts** for Before you go / Good to know.

| File | Contents |
|------|----------|
| `venues.json` | Venue entities (names, aliases, city, official URL) |
| `programs.json` | Recurring programs (organizer + title patterns + optional venue) |
| `facts.json` | Tip atoms: category, icon, text, source, verifiedAt, volatility, reuseSafe |

Compose order at review time: **venue → program → event** (event wins on the same category). Public pages still store a flattened `tips` string on each event — the library does not merge live into the parent site.

See `docs/event-discovery.md` (Venue & program knowledge library) and `src/utils/tipKnowledgeCompose.ts`.
