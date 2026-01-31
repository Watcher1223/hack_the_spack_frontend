# API access for agents

This doc describes how external agents or apps integrate with the Universal Adapter marketplace. **One API key gives access to all tools** we’ve created (and that we create over time).

---

## Universal Adapter API 2.0.0 (OAS 3.1)

This frontend targets the **Universal Adapter API 2.0.0** — “AI agent with tool marketplace and governance - Production v2.0”. The backend exposes OpenAPI 3.1 at `/openapi.json`.

**Base URL:** `NEXT_PUBLIC_API_URL` (default `http://localhost:8001`).

**Endpoints used by the frontend:**

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/chat` | Chat with workflow steps, tool calls, action logging |
| `GET` | `/api/discovery/stream` | SSE stream for real-time discovery logs |
| `GET` | `/tools` | List tools (`?limit=50&skip=0`) |
| `GET` | `/tools/search` | Search tools (`?q=...&limit=10`) |
| `GET` | `/tools/{name}` | Get tool by name |
| `GET` | `/tools/{name}/code` | Get generated tool code (for MCP Forge) |
| `DELETE` | `/tools/{name}` | Delete tool |
| `POST` | `/tools/{tool_name}/execute` | Execute tool (body: JSON params) |
| `POST` | `/api/forge/generate` | Generate MCP tool from API docs (`source_url`, `force_regenerate`) |
| `GET` | `/api/actions` | Get actions feed |
| `GET` | `/api/governance/verified-tools` | Get verified tools |
| `GET` | `/health` | Health check |

---

## Why API access?

- **Usefulness:** Our platform turns REST APIs into agent-callable tools (Firecrawl → MCP → marketplace). Exposing an API lets *any* agent use those tools without building or hosting MCPs.
- **Integration:** Another agent (or dev) gets an API key → calls our base URL → lists tools, executes by ID with params → we run the tool server-side and return structured results.
- **Single integration point:** One key = access to weather, Stripe, Slack, etc. New tools from the Forge show up automatically.

---

## Auth

- **API key** per developer/agent (e.g. from dashboard or sign-up).
- Send in requests: `Authorization: Bearer <API_KEY>` or `X-API-Key: <API_KEY>`.

---

## Base URL

- Production: `https://api.universal-adapter.dev` (or your deployed backend).
- Frontend uses `NEXT_PUBLIC_API_URL`; default in UI is the above.

---

## Endpoints (external / API key consumers)

Same API 2.0.0; paths use `/tools` (not `/api/tools`):

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/tools` | List all tools. Query: `?limit=50&skip=0`. |
| `GET` | `/tools/search` | Search by query: `?q=weather&limit=10`. |
| `GET` | `/tools/{name}` | Tool detail: name, description, status, **parameters** (input schema), source URL. |
| `POST` | `/tools/{name}/execute` | Execute tool. Body: JSON with params (e.g. `{"river_name": "Delaware River"}`). Returns tool result. |

Optional:

- `GET /tools/{name}/code` — Generated Python code for the tool (for display).
- `GET /api/me` or `GET /api/keys` — API key management (create, list, revoke) when implemented.

---

## Example: list tools

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.universal-adapter.dev/tools
```

Response shape (example):

```json
{
  "tools": [
    {
      "id": "get_current_weather",
      "name": "OpenWeatherMap",
      "description": "Current weather by city",
      "status": "PROD-READY",
      "parameters": { "q": "string", "units": "metric | imperial (optional)" }
    }
  ]
}
```

---

## Example: execute a tool

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"river_name": "Delaware River"}' \
  https://api.universal-adapter.dev/tools/get_usgs_streamflow_data/execute
```

Response: structured result from the tool (e.g. weather API response).

---

## MCP alternative (optional)

For agents that speak MCP natively (e.g. Claude with MCP client), you can expose an **MCP server endpoint** that lists and runs our tools. The agent connects to our MCP server; we translate tool calls into our stored MCP definitions and execution. Same capability as REST; different protocol.

---

## Summary

- **Add API-level access:** Yes — it’s how “another agent gets an API key and has access to all our tools.”
- **Usefulness:** We create tools from the web (Firecrawl + MCP Forge); we store them; we run them. The API is how agents consume that without re-discovering or re-building.
- **Backend:** Universal Adapter API 2.0.0 implements `GET /tools`, `GET /tools/{name}`, `POST /tools/{name}/execute`, `/chat`, `/api/discovery/stream`, etc. See `/openapi.json` for the full OAS 3.1 spec. Frontend “API” tab documents this for users.
