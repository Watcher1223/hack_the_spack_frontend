"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Globe, FileCode, Zap } from "lucide-react";
import type { LogEntry } from "@/types";

const SOURCE_ICONS = {
  firecrawl: Globe,
  mcp: FileCode,
  agent: Zap,
  system: Radio,
};

const SOURCE_COLORS = {
  firecrawl: "text-orange-500",
  mcp: "text-blue-400",
  agent: "text-emerald-400",
  system: "text-zinc-500",
};

const DEMO_LOGS: Omit<LogEntry, "id">[] = [
  { timestamp: "00:00:01", source: "firecrawl", message: "Crawling https://api.openweathermap.org/docs..." },
  { timestamp: "00:00:02", source: "firecrawl", message: "[Firecrawl] Found /api/docs/current... Ingesting..." },
  { timestamp: "00:00:03", source: "firecrawl", message: "[Firecrawl] Extracted 12 endpoints, 3 auth params" },
  { timestamp: "00:00:04", source: "mcp", message: "Generating MCP tool: get_current_weather" },
  { timestamp: "00:00:05", source: "mcp", message: "TypeScript definition written to marketplace" },
  { timestamp: "00:00:06", source: "agent", message: "Tool registered. Executing get_current_weather..." },
  { timestamp: "00:00:07", source: "system", message: "Success → Notification sent to CTO" },
];

export function LiveDiscoveryHUD({ logs: externalLogs, maxLines = 14 }: { logs?: LogEntry[]; maxLines?: number }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (externalLogs?.length) {
      setLogs(externalLogs);
      return;
    }
    let idx = 0;
    const interval = setInterval(() => {
      if (idx >= DEMO_LOGS.length) {
        setIsStreaming(false);
        clearInterval(interval);
        return;
      }
      const entry = DEMO_LOGS[idx];
      setLogs((prev) => [
        ...prev.slice(-(maxLines - 1)),
        { ...entry, id: `log-${Date.now()}-${idx}` },
      ]);
      idx++;
      containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: "smooth" });
    }, 600);
    return () => clearInterval(interval);
  }, [externalLogs, maxLines]);

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/80 font-mono text-sm shadow-xl">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="font-medium text-zinc-300">Live Discovery</span>
          {isStreaming && (
            <span className="text-xs text-zinc-500">Streaming...</span>
          )}
        </div>
        <span className="text-xs text-zinc-500">Firecrawl → MCP</span>
      </div>
      <div
        ref={containerRef}
        className="terminal-scroll flex-1 overflow-x-hidden overflow-y-auto p-3 text-xs"
      >
        <AnimatePresence initial={false}>
          {logs.map((log) => {
            const Icon = SOURCE_ICONS[log.source];
            const colorClass = SOURCE_COLORS[log.source];
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex min-w-0 gap-2 py-0.5 leading-relaxed"
              >
                <span className="shrink-0 text-zinc-600">{log.timestamp}</span>
                <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${colorClass}`} />
                <span className="min-w-0 shrink text-zinc-300 break-words">{log.message}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {isStreaming && (
          <span className="log-cursor mt-1 inline-block h-4 w-0.5 bg-emerald-400" />
        )}
      </div>
    </div>
  );
}
