"use client";

import { useState, useEffect, useMemo } from "react";
import { Search } from "lucide-react";
import { api } from "@/lib/api-client";
import type { EnhancedTool } from "@/types/api";

interface MarketplaceCenterProps {
  onSelectTool?: (tool: EnhancedTool) => void;
  marketplaceChecking?: boolean;
  /** Increment to soft-refresh the tools list (e.g. after agent completes and may have added a tool) */
  toolsRefreshKey?: number;
}

export function MarketplaceCenter({
  onSelectTool,
  marketplaceChecking = false,
  toolsRefreshKey = 0,
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
  }, [toolsRefreshKey]);

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
    <div className="scrollbar-hide flex h-full flex-col overflow-hidden rounded-xl bg-zinc-950/50">
      <div className="shrink-0 px-1 pb-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
            />
          </div>
          <span className="shrink-0 text-xs text-zinc-500">
            {filteredTools.length} tool{filteredTools.length !== 1 ? "s" : ""}
          </span>
        </div>
        {marketplaceChecking && (
          <p className="mt-2 text-xs text-zinc-500">Checking...</p>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-1">
        {loading ? (
          <p className="py-16 text-center text-sm text-zinc-500">Loading...</p>
        ) : filteredTools.length === 0 ? (
          <p className="py-16 text-center text-sm text-zinc-500">
            {searchQuery ? "No match" : "No tools yet."}
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTools.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => onSelectTool?.(t)}
                  className="w-full rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-800/40"
                >
                  {t.description ? (
                    <p className="text-sm leading-snug text-zinc-200 line-clamp-3">
                      {t.description}
                    </p>
                  ) : (
                    <p className="text-sm text-zinc-400">{t.name}</p>
                  )}
                  <span className="mt-2 block font-mono text-[10px] text-zinc-500">
                    {t.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
