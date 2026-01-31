"use client";

import { useState, useEffect, useMemo } from "react";
import { Package, Search } from "lucide-react";
import { api } from "@/lib/api-client";
import type { EnhancedTool } from "@/types/api";

interface MarketplaceCenterProps {
  onSelectTool?: (tool: EnhancedTool) => void;
  marketplaceChecking?: boolean;
}

export function MarketplaceCenter({
  onSelectTool,
  marketplaceChecking = false,
}: MarketplaceCenterProps) {
  const [allTools, setAllTools] = useState<EnhancedTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .listTools(100, 0)
      .then((tools) => {
        if (!cancelled) setAllTools(tools);
      })
      .catch(() => {
        if (!cancelled) setAllTools([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return allTools;
    const q = searchQuery.toLowerCase();
    return allTools.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
    );
  }, [allTools, searchQuery]);

  return (
    <div className="scrollbar-hide flex h-full flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/80">
      <div className="shrink-0 border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-zinc-400" />
          <h2 className="font-semibold text-zinc-200">Marketplace</h2>
          <span className="text-sm text-zinc-500">
            {filteredTools.length} tool{filteredTools.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="search"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-500"
          />
        </div>
        {marketplaceChecking && (
          <p className="mt-2 text-xs text-zinc-500">Checking for existing tools...</p>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="py-12 text-center text-sm text-zinc-500">Loading tools...</p>
        ) : filteredTools.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-500">
            {searchQuery ? "No tools match" : "No tools yet. Ask the agent to discover and build one."}
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTools.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => onSelectTool?.(t)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-800/50"
                >
                  <span className="font-medium text-zinc-100">{t.name}</span>
                  {t.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{t.description}</p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
