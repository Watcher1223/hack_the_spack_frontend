"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Package,
  Play,
  ExternalLink,
  X,
  Cloud,
  Lock,
  AlertCircle,
} from "lucide-react";
import type { VerifiedCapability, ToolStatus } from "@/types";
import { api } from "@/lib/api-client";
import type { EnhancedTool } from "@/types/api";

const STATUS_CONFIG: Record<
  ToolStatus,
  { label: string; className: string; icon: typeof Cloud }
> = {
  UNVERIFIED: {
    label: "UNVERIFIED",
    className: "border-amber-500/50 bg-amber-500/10 text-amber-400",
    icon: AlertCircle,
  },
  SANDBOXED: {
    label: "SANDBOXED",
    className: "border-blue-500/50 bg-blue-500/10 text-blue-400",
    icon: Lock,
  },
  "PROD-READY": {
    label: "PROD-READY",
    className: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
    icon: Cloud,
  },
};

function ToolPreviewDrawer({
  tool,
  onClose,
}: {
  tool: VerifiedCapability;
  onClose: () => void;
}) {
  const config = STATUS_CONFIG[tool.status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex justify-end bg-black/50"
      onClick={onClose}
    >
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.2 }}
        className="flex h-full w-full max-w-md flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl sm:max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h2 className="font-semibold text-zinc-100">Tool preview</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="terminal-scroll flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-zinc-100">{tool.name}</h3>
              <p className="mt-1 text-sm text-zinc-500">{tool.description}</p>
              <span
                className={`mt-2 inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium ${config.className}`}
              >
                <Icon className="h-3 w-3" />
                {config.label}
              </span>
            </div>
            {tool.sourceUrl && (
              <a
                href={tool.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-400 hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                View source docs
              </a>
            )}
            {tool.muxPlaybackId && (
              <a
                href={`https://mux.com/playback/${tool.muxPlaybackId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                <Play className="h-4 w-4" />
                Watch audit
              </a>
            )}
            {tool.previewSnippet && (
              <div className="rounded-lg border border-zinc-700 bg-zinc-900/80 p-3">
                <p className="mb-2 text-xs font-medium text-zinc-500">
                  MCP tool signature
                </p>
                <pre className="font-mono text-xs leading-relaxed text-zinc-300">
                  {tool.previewSnippet}
                </pre>
              </div>
            )}
            <p className="text-xs text-zinc-500">
              Added {new Date(tool.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </motion.aside>
    </motion.div>
  );
}

export function ToolMarketplace({
  justCreatedToolId = null,
}: {
  justCreatedToolId?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [previewTool, setPreviewTool] = useState<any | null>(null);
  const [tools, setTools] = useState<EnhancedTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState(false);

  // Fetch tools on mount
  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listTools(100, 0);
      setTools(data);
    } catch (err) {
      console.error('Failed to load tools:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tools');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      setSearchMode(false);
      loadTools();
      return;
    }

    setLoading(true);
    setError(null);
    setSearchMode(true);
    try {
      const result = await api.searchTools(query, 20);
      setTools(result.tools);
    } catch (err) {
      console.error('Search failed:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return tools;
  }, [tools]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-full flex-col rounded-lg border border-zinc-800 bg-zinc-950/80 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-zinc-400" />
            <h2 className="font-semibold text-zinc-200">Tool marketplace</h2>
          </div>
          <span className="text-xs text-zinc-500">
            {filtered.length} tool{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="border-b border-zinc-800 px-4 py-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="search"
                placeholder="Search by name or description..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-500"
                aria-label="Search tools"
                disabled={loading}
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          {searchMode && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSearchMode(false);
                loadTools();
              }}
              className="mt-2 text-xs text-zinc-500 hover:text-zinc-400"
            >
              ← Back to all tools
            </button>
          )}
        </div>
        <div className="terminal-scroll flex-1 overflow-y-auto p-4">
          {error && (
            <div className="rounded-lg border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
          {loading ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              Loading tools...
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              {query ? `No tools match "${query}"` : 'No tools available'}
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((tool) => {
                const config = STATUS_CONFIG[tool.status];
                const Icon = config.icon;
                return (
                  <motion.li
                    key={tool.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-800/50"
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewTool(tool)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-zinc-100">{tool.name}</h3>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {justCreatedToolId === tool.id && (
                            <span className="rounded border border-emerald-500/50 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                              Just created
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] font-medium ${config.className}`}
                          >
                            <Icon className="h-2.5 w-2.5" />
                            {config.label}
                          </span>
                        </div>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                        {tool.description}
                      </p>
                      <span className="mt-2 inline-block text-xs text-blue-400">
                        Preview →
                      </span>
                    </button>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <AnimatePresence>
        {previewTool && (
          <ToolPreviewDrawer
            tool={previewTool}
            onClose={() => setPreviewTool(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
