"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Link2,
  Play,
  FileCode,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";
import { api } from "@/lib/api-client";
import type { EnhancedTool } from "@/types/api";

export interface ReferenceItem {
  url: string;
  label?: string;
}

interface DashboardMiddlePanelProps {
  /** Last marketplace search from agent (for "matches" hint when non-empty) */
  marketplaceSearchResults?: EnhancedTool[];
  marketplaceChecking?: boolean;
  references: ReferenceItem[];
  currentTool: EnhancedTool | null;
  justCreatedToolId?: string | null;
  onSelectTool?: (tool: EnhancedTool) => void;
}

export function DashboardMiddlePanel({
  marketplaceSearchResults = [],
  marketplaceChecking = false,
  references,
  currentTool,
  justCreatedToolId = null,
  onSelectTool,
}: DashboardMiddlePanelProps) {
  const [allTools, setAllTools] = useState<EnhancedTool[]>([]);
  const [toolsLoading, setToolsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [executeResult, setExecuteResult] = useState<Record<string, unknown> | null>(null);
  const [executeLoading, setExecuteLoading] = useState(false);
  const [executeError, setExecuteError] = useState<string | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [showRefs, setShowRefs] = useState(true);
  const [showMarketplace, setShowMarketplace] = useState(true);
  const [showTool, setShowTool] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setToolsLoading(true);
    api
      .listTools(100, 0)
      .then((tools) => {
        if (!cancelled) setAllTools(tools);
      })
      .catch(() => {
        if (!cancelled) setAllTools([]);
      })
      .finally(() => {
        if (!cancelled) setToolsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [justCreatedToolId]); // refetch when a new tool was just created

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return allTools;
    const q = searchQuery.toLowerCase();
    return allTools.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
    );
  }, [allTools, searchQuery]);

  /** When used as sidebar (e.g. forge mode), show new tool at top */
  const sortedTools = useMemo(() => {
    if (!justCreatedToolId) return filteredTools;
    const created = filteredTools.find(
      (t) => t.id === justCreatedToolId || t.name === justCreatedToolId
    );
    const rest = filteredTools.filter(
      (t) => t.id !== justCreatedToolId && t.name !== justCreatedToolId
    );
    return created ? [created, ...rest] : filteredTools;
  }, [filteredTools, justCreatedToolId]);

  const properties = currentTool?.parameters?.properties ?? {};
  const required = new Set(currentTool?.parameters?.required ?? []);

  const handleExecute = useCallback(async () => {
    if (!currentTool) return;
    setExecuteLoading(true);
    setExecuteError(null);
    setExecuteResult(null);
    try {
      const params: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(paramValues)) {
        if (val === "" && !required.has(key)) continue;
        params[key] = val;
      }
      const res = await api.executeTool(currentTool.name, params);
      setExecuteResult(
        typeof res.result === "object" && res.result != null ? res.result : { result: res }
      );
    } catch (err) {
      setExecuteError(err instanceof Error ? err.message : "Execution failed");
    } finally {
      setExecuteLoading(false);
    }
  }, [currentTool, paramValues, required]);

  return (
    <aside className="scrollbar-hide flex w-72 shrink-0 flex-col overflow-y-auto border-r border-zinc-800 bg-zinc-950/50 lg:flex">
      <div className="flex flex-col gap-4 p-4">
        {/* Marketplace: all tools (always visible) */}
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/50">
          <button
            type="button"
            onClick={() => setShowMarketplace((v) => !v)}
            className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <Package className="h-4 w-4 text-zinc-500" />
              Marketplace
            </span>
            <span className="shrink-0 text-xs text-zinc-500">
              {sortedTools.length} tool{sortedTools.length !== 1 ? "s" : ""}
            </span>
            {showMarketplace ? (
              <ChevronUp className="h-4 w-4 shrink-0 text-zinc-500" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500" />
            )}
          </button>
          {showMarketplace && (
            <div className="border-t border-zinc-800 px-3 pb-3 pt-2">
              <div className="relative mb-2">
                <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                <input
                  type="search"
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded border border-zinc-700 bg-zinc-800 py-1.5 pl-8 pr-2 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-600"
                />
              </div>
              {marketplaceChecking && marketplaceSearchResults.length === 0 && (
                <p className="mb-2 text-xs text-zinc-500">Checking for existing tools…</p>
              )}
              {toolsLoading ? (
                <p className="py-4 text-center text-xs text-zinc-500">Loading tools...</p>
              ) : sortedTools.length === 0 ? (
                <p className="py-4 text-center text-xs text-zinc-500">
                  {searchQuery ? "No tools match" : "No tools yet"}
                </p>
              ) : (
                <ul className="max-h-64 space-y-1.5 overflow-y-auto">
                  {sortedTools.map((t) => {
                    const isSelected =
                      currentTool && (currentTool.id === t.id || currentTool.name === t.name);
                    const isJustCreated =
                      justCreatedToolId === t.id || justCreatedToolId === t.name;
                    return (
                      <li key={t.id}>
                        <button
                          type="button"
                          onClick={() => onSelectTool?.(t)}
                          className={`w-full rounded border px-2 py-1.5 text-left text-xs transition-colors ${
                            isSelected
                              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                              : isJustCreated
                                ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-300"
                                : "border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800"
                          }`}
                        >
                          <span className="font-medium">{t.name}</span>
                          {t.description && (
                            <p className="mt-0.5 line-clamp-2 text-zinc-500">{t.description}</p>
                          )}
                          {isJustCreated && (
                            <span className="mt-1 inline-block text-[10px] text-emerald-400">
                              Just created
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </section>

        {/* References (links from discovery) */}
        {references.length > 0 && (
          <section className="rounded-lg border border-zinc-800 bg-zinc-900/50">
            <button
              type="button"
              onClick={() => setShowRefs((v) => !v)}
              className="flex w-full items-center justify-between px-3 py-2.5 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                <Link2 className="h-4 w-4 text-zinc-500" />
                References
              </span>
              {showRefs ? (
                <ChevronUp className="h-4 w-4 text-zinc-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-zinc-500" />
              )}
            </button>
            {showRefs && (
              <div className="max-h-40 overflow-y-auto border-t border-zinc-800 px-3 pb-3 pt-1">
                <ul className="space-y-1.5">
                  {references.map((ref, i) => (
                    <li key={`${ref.url}-${i}`}>
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 rounded border border-zinc-700 bg-zinc-800/50 px-2 py-1.5 text-xs text-blue-400 hover:bg-zinc-800 hover:underline"
                      >
                        <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span className="line-clamp-2 break-all">
                          {ref.label || ref.url}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Current tool: show and execute */}
        {currentTool && (
          <section className="rounded-lg border border-emerald-800/50 bg-emerald-950/20">
            <button
              type="button"
              onClick={() => setShowTool((v) => !v)}
              className="flex w-full items-center justify-between px-3 py-2.5 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-emerald-300">
                <FileCode className="h-4 w-4 text-emerald-500" />
                Tool
              </span>
              {showTool ? (
                <ChevronUp className="h-4 w-4 text-zinc-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-zinc-500" />
              )}
            </button>
            {showTool && (
              <div className="space-y-3 border-t border-zinc-800 px-3 pb-3 pt-2">
                <div>
                  <h3 className="font-medium text-zinc-100">{currentTool.name}</h3>
                  {currentTool.description && (
                    <p className="mt-0.5 text-xs text-zinc-500">{currentTool.description}</p>
                  )}
                </div>
                {((currentTool as any).api_reference_url || currentTool.source_url) && (
                  <div className="rounded-lg border border-blue-800/50 bg-blue-900/10 p-2">
                    <p className="text-xs font-medium text-blue-300 mb-1">API Reference</p>
                    <a
                      href={(currentTool as any).api_reference_url || currentTool.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-blue-400 hover:underline break-all"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      {(currentTool as any).api_reference_url || currentTool.source_url}
                    </a>
                  </div>
                )}
                {currentTool.code && (
                  <div className="rounded-lg border border-zinc-700 bg-zinc-900/50">
                    <div className="border-b border-zinc-700 px-2 py-1.5 flex items-center gap-1.5">
                      <FileCode className="h-3.5 w-3.5 text-zinc-400" />
                      <p className="text-xs font-medium text-zinc-400">Source Code</p>
                    </div>
                    <pre className="max-h-64 overflow-auto p-2 text-xs text-zinc-300 whitespace-pre-wrap break-words">
                      {currentTool.code}
                    </pre>
                  </div>
                )}
                {Object.keys(properties).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-zinc-500">Parameters</p>
                    <div className="space-y-1.5">
                      {Object.entries(properties).map(([key, schema]) => (
                        <div key={key}>
                          <label className="block text-xs text-zinc-500">
                            {key}
                            {required.has(key) && " *"}
                          </label>
                          <input
                            type="text"
                            value={paramValues[key] ?? ""}
                            onChange={(e) =>
                              setParamValues((prev) => ({ ...prev, [key]: e.target.value }))
                            }
                            placeholder={
                              typeof schema === "object" && schema && "description" in schema
                                ? String((schema as { description?: string }).description ?? "")
                                : ""
                            }
                            className="mt-0.5 w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-600"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleExecute}
                  disabled={executeLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-600 bg-emerald-600/20 px-3 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-600/30 disabled:opacity-50"
                >
                  <Play className="h-4 w-4" />
                  {executeLoading ? "Running…" : "Execute"}
                </button>
                {executeError && (
                  <div className="rounded border border-red-800/60 bg-red-950/30 px-2 py-1.5">
                    <p className="text-xs text-red-400">{executeError}</p>
                  </div>
                )}
                {executeResult != null && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded border border-zinc-700 bg-zinc-900/80 p-2"
                  >
                    <p className="mb-1 text-xs font-medium text-zinc-500">Result</p>
                    <pre className="max-h-40 overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words text-xs text-zinc-300">
                      {JSON.stringify(executeResult, null, 2)}
                    </pre>
                  </motion.div>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </aside>
  );
}
