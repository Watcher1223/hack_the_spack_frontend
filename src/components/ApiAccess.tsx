"use client";

import { Key, Code2, Server, Zap, Copy, Check, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.universal-adapter.dev";

function generateApiKey(): string {
  const prefix = "ua_live_";
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let suffix = "";
  for (let i = 0; i < 32; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
  return prefix + suffix;
}

function maskKey(key: string): string {
  if (key.length <= 12) return "••••••••";
  return key.slice(0, 8) + "••••••••••••" + key.slice(-4);
}

interface ApiKeyRow {
  id: string;
  fullKey: string;
  masked: string;
  createdAt: string;
}

export function ApiAccess() {
  const [copied, setCopied] = useState<string | null>(null);
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleGenerate = () => {
    const key = generateApiKey();
    setNewKey(key);
    setKeys((prev) => [
      { id: crypto.randomUUID(), fullKey: key, masked: maskKey(key), createdAt: new Date().toISOString() },
      ...prev,
    ]);
  };

  const handleDismissNewKey = () => {
    setNewKey(null);
    setKeys((prev) => prev.map((k) => (k.fullKey ? { ...k, fullKey: "" } : k)));
  };

  const revokeKey = (id: string) => {
    setKeys((prev) => prev.filter((k) => k.id !== id));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-zinc-100">
          API access for agents
        </h2>
        <p className="mt-2 text-zinc-400">
          Any agent or app can get an API key and use every tool in the marketplace—no need to build or host MCPs themselves. We run the tools; you call us.
        </p>
      </div>

      {/* Your API keys — generate & list */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
            <Key className="h-4 w-4 text-zinc-400" />
            Your API keys
          </h3>
          <button
            type="button"
            onClick={handleGenerate}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-200 hover:bg-zinc-700"
          >
            <Plus className="h-4 w-4" />
            Generate new key
          </button>
        </div>
        {newKey && (
          <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="text-xs font-medium text-emerald-200">New key created — copy it now. It won’t be shown again in full.</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 rounded bg-zinc-900/80 px-3 py-2 font-mono text-sm text-zinc-100">
                {newKey}
              </code>
              <button
                type="button"
                onClick={() => copy(newKey, "newkey")}
                className="rounded border border-zinc-600 bg-zinc-800 p-2 text-zinc-300 hover:bg-zinc-700"
                aria-label="Copy key"
              >
                {copied === "newkey" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={handleDismissNewKey}
                className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-400 hover:bg-zinc-700"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        <ul className="mt-4 space-y-2">
          {keys.length === 0 && !newKey && (
            <li className="py-4 text-center text-sm text-zinc-500">No API keys yet. Generate one to get started.</li>
          )}
          {keys.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2"
            >
              <code className="font-mono text-sm text-zinc-400">{row.masked}</code>
              <span className="text-xs text-zinc-500">
                {new Date(row.createdAt).toLocaleDateString()}
              </span>
              <div className="flex items-center gap-2">
                {row.fullKey && (
                  <button
                    type="button"
                    onClick={() => copy(row.fullKey, row.id)}
                    className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    aria-label="Copy key"
                  >
                    {copied === row.id ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => revokeKey(row.id)}
                  className="rounded p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                  aria-label="Revoke key"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <Key className="h-4 w-4 text-amber-400" />
          How it works
        </div>
        <ul className="mt-3 space-y-2 text-sm text-zinc-400">
          <li>• Get an API key from the dashboard (one per agent/app).</li>
          <li>• Call <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-zinc-300">GET /api/tools</code> to list all tools.</li>
          <li>• Call <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-zinc-300">POST /api/tools/:id/execute</code> with params to run a tool.</li>
          <li>• We execute the tool server-side and return structured results.</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <Server className="h-4 w-4" />
          Base URL
        </h3>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-300">
            {BASE_URL}
          </code>
          <button
            type="button"
            onClick={() => copy(BASE_URL, "base")}
            className="rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
            aria-label="Copy base URL"
          >
            {copied === "base" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <Code2 className="h-4 w-4" />
          Endpoints
        </h3>
        <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 font-mono text-sm">
          <div>
            <span className="text-emerald-400">GET</span>{" "}
            <span className="text-zinc-300">/api/tools</span>
            <p className="mt-1 text-xs text-zinc-500">List all tools. Optional: ?q=weather (search).</p>
          </div>
          <div>
            <span className="text-emerald-400">GET</span>{" "}
            <span className="text-zinc-300">/api/tools/:id</span>
            <p className="mt-1 text-xs text-zinc-500">Tool detail + input schema.</p>
          </div>
          <div>
            <span className="text-amber-400">POST</span>{" "}
            <span className="text-zinc-300">/api/tools/:id/execute</span>
            <p className="mt-1 text-xs text-zinc-500">Run tool with JSON body: {`{ "q": "San Francisco" }`}.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <Zap className="h-4 w-4" />
          Example (any agent)
        </h3>
        <pre className="relative rounded-lg border border-zinc-700 bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-300">
          <code>{`# List tools
curl -H "Authorization: Bearer YOUR_API_KEY" \\
  ${BASE_URL}/api/tools

# Execute a tool (e.g. get_current_weather)
curl -X POST \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"q": "New York", "units": "metric"}' \\
  ${BASE_URL}/api/tools/get_current_weather/execute`}</code>
          <button
            type="button"
            onClick={() => copy(`curl -H "Authorization: Bearer YOUR_API_KEY" ${BASE_URL}/api/tools`, "curl")}
            className="absolute right-2 top-2 rounded border border-zinc-700 bg-zinc-800 p-1.5 text-zinc-400 hover:bg-zinc-700"
            aria-label="Copy example"
          >
            {copied === "curl" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </pre>
      </div>

      <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-200">
        <p className="font-medium">Why this matters</p>
        <p className="mt-1 text-blue-200/90">
          One API key gives an agent access to every tool we’ve ever created—weather, Stripe, Slack, etc. New tools (from Firecrawl + MCP Forge) show up automatically. No per-tool integration; we are the single integration point.
        </p>
      </div>
    </div>
  );
}
