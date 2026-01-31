# API access for agents

This doc describes how external agents or apps integrate with the Universal Adapter marketplace. **One API key gives access to all tools** we’ve created (and that we create over time).

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

## Endpoints (suggested for backend)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/tools` | List all tools. Optional query: `?q=weather` (search by name/description). |
| `GET` | `/api/tools/:id` | Tool detail: name, description, status, **input schema** (params), source URL. |
| `POST` | `/api/tools/:id/execute` | Execute tool. Body: JSON with params (e.g. `{"q": "San Francisco", "units": "metric"}`). Returns tool output (e.g. weather object). |

Optional:

- `GET /api/tools/:id/mcp` — Export MCP definition for that tool (for clients that want to run MCP locally).
- `GET /api/me` or `GET /api/keys` — API key management (create, list, revoke).

---

## Example: list tools

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.universal-adapter.dev/api/tools
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
  -d '{"q": "New York", "units": "metric"}' \
  https://api.universal-adapter.dev/api/tools/get_current_weather/execute
```

Response: structured result from the tool (e.g. weather API response).

---

## MCP alternative (optional)

For agents that speak MCP natively (e.g. Claude with MCP client), you can expose an **MCP server endpoint** that lists and runs our tools. The agent connects to our MCP server; we translate tool calls into our stored MCP definitions and execution. Same capability as REST; different protocol.

---

## Summary

- **Add API-level access:** Yes — it’s how “another agent gets an API key and has access to all our tools.”
- **Usefulness:** We create tools from the web (Firecrawl + MCP Forge); we store them; we run them. The API is how agents consume that without re-discovering or re-building.
- **Backend:** Implement `GET /api/tools`, `GET /api/tools/:id`, `POST /api/tools/:id/execute` + API key auth; optionally MCP server. Frontend “API” tab already documents this for users.
