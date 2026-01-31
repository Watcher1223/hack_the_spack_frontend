# Universal Adapter — Self-Extending Agent Marketplace (Frontend)

Command Center UI for the Self-Extending Agent Marketplace. Built to prove to judges that this is a **real system** with state, history, and physical actions — not an LLM hallucinating text.

**One-liner:** Agents that discover public APIs, convert them into MCP tools on the fly, store them in a marketplace, and reuse them forever.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + Tailwind CSS
- **UI:** Lucide React (icons), Framer Motion (transitions)
- **Vibe:** Dark mode, high-contrast, technical (Supabase × Vercel)

## Features

1. **Live Discovery HUD** — Streaming terminal-style logs showing Firecrawl in action (URLs discovered, ingestion, MCP generation).
2. **MCP Forge** — Split-screen: raw API docs (Markdown) on the left, auto-generated MCP TypeScript on the right, with optional “self-healing” failure/retry animation.
3. **Audit Trail** — Verified capabilities with status badges (UNVERIFIED, SANDBOXED, PROD-READY) and “Watch Audit” (Mux) links.
4. **Action Center** — Resend-style activity feed: paper trail of actions, GitHub PR links where the agent modified code.
5. **Demo flow** — Single input bar → transition into Forge view → structured result card. Second prompt (e.g. “Get weather in New York”) reuses the tool instantly (no re-crawl).

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo Script

1. Type: **“Get the latest weather in San Francisco and format it as a short summary.”**
2. UI transitions to **MCP Forge** — watch Firecrawl logs and MCP code generate.
3. Click **“Back to Dashboard”** or wait for the result card.
4. Type: **“Get the weather in New York.”**
5. Result appears with a **Reused** badge — no crawling, no regeneration.

## Project Structure

```
src/
├── app/
│   ├── globals.css    # Dark theme, terminal scrollbars, animations
│   ├── layout.tsx
│   └── page.tsx       # Renders CommandCenter
├── components/
│   ├── CommandCenter.tsx       # Main layout, view state, demo flow
│   ├── LiveDiscoveryHUD.tsx    # Streaming Firecrawl logs
│   ├── MCPForge.tsx            # Split docs + generated TS, self-heal
│   ├── TrustGovernanceLedger.tsx # Audit Trail: verified capabilities + Watch Audit
│   ├── ActionCenter.tsx        # Activity feed, PR links
│   ├── CommandInput.tsx        # Lovable-style input bar
│   └── ResultCard.tsx          # Structured output (e.g. weather)
└── types/
    └── index.ts                # ViewMode, ToolStatus, feeds, logs
```

## Build

```bash
npm run build
npm start
```

## Closing Line

*“Instead of shipping agents with fixed tools, we built agents that can grow their own.”*
