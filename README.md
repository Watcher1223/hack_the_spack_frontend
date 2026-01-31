# Universal Adapter — Self-Extending Agent Marketplace (Frontend)

**✅ Status: Production Ready - Fully Integrated with Backend API v2.0**

Command Center UI for the Self-Extending Agent Marketplace. Built to prove to judges that this is a **real system** with state, history, and physical actions — not an LLM hallucinating text.

**One-liner:** Agents that discover public APIs, convert them into MCP tools on the fly, store them in a marketplace, and reuse them forever.

**New:** All components now integrated with real backend API. No more placeholder data!

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

## ✨ What's New - Backend Integration Complete!

All components now connect to real backend API endpoints:
- ✅ **Real-time Chat** - POST /chat with workflow tracking
- ✅ **Live Event Streaming** - Server-Sent Events for discovery logs
- ✅ **Tool Generation** - POST /api/forge/generate from API docs URLs
- ✅ **Semantic Search** - Voyage AI embeddings for tool search
- ✅ **Action Feed** - Real-time activity logging
- ✅ **Governance** - Trust scores and verification data

**See [`IMPLEMENTATION_SUMMARY.md`](./IMPLEMENTATION_SUMMARY.md) for complete details.**

## Getting Started

### Quick Start (5 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.local.example .env.local
# Edit .env.local and set NEXT_PUBLIC_API_URL=http://localhost:8000

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Important:** Backend API must be running at `http://localhost:8000`. See [`QUICK_START.md`](./QUICK_START.md) for backend setup.

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

## 📚 Documentation

Complete implementation documentation:

| Document | Description |
|----------|-------------|
| **[QUICK_START.md](./QUICK_START.md)** | Get started in 5 minutes |
| **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** | Complete implementation details & status |
| **[UI_INTEGRATION_GUIDE.md](./UI_INTEGRATION_GUIDE.md)** | Component integration guide |
| **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** | Backend API reference |
| **[BACKEND_API_REQUIREMENTS.md](./BACKEND_API_REQUIREMENTS.md)** | API requirements specification |

## 🎯 Implementation Status

✅ **All 10 tasks completed:**
1. ✅ Enhanced TypeScript API types
2. ✅ API client library (`src/lib/api-client.ts`)
3. ✅ CommandCenter with real API integration
4. ✅ LiveDiscoveryHUD with SSE streaming
5. ✅ MCPForge with dynamic tool generation
6. ✅ ToolMarketplace with semantic search
7. ✅ ActionCenter with real-time feed
8. ✅ TrustGovernanceLedger with governance data
9. ✅ Environment configuration
10. ✅ Dependencies installed

## Closing Line

*"Instead of shipping agents with fixed tools, we built agents that can grow their own."*

---

**Status:** ✅ Production Ready | All components integrated with backend API v2.0
