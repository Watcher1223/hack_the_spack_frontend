"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Globe, FileCode, Zap } from "lucide-react";
import type { LogEntry } from "@/types";
import { api } from "@/lib/api-client";
import type { DiscoveryLog } from "@/types/api";

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

interface LiveDiscoveryHUDProps {
  logs?: LogEntry[];
  maxLines?: number;
  conversationId?: string;
  autoStart?: boolean;
}

export function LiveDiscoveryHUD({
  logs: externalLogs,
  maxLines = 14,
  conversationId,
  autoStart = true,
}: LiveDiscoveryHUDProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [logs]);

  useEffect(() => {
    // If external logs provided, use those
    if (externalLogs?.length) {
      setLogs(externalLogs);
      return;
    }

    // Otherwise, connect to SSE stream if autoStart
    if (!autoStart) return;

    setIsStreaming(true);
    setError(null);
    setLogs([]);

    try {
      eventSourceRef.current = api.openDiscoveryStream(
        conversationId,
        // onMessage
        (log: DiscoveryLog) => {
          setLogs((prev) => [
            ...prev.slice(-(maxLines - 1)),
            {
              ...log,
              id: log.id || `log-${Date.now()}-${Math.random()}`,
            } as LogEntry,
          ]);
        },
        // onDone
        () => {
          setIsStreaming(false);
          console.log('Discovery stream completed');
        },
        // onError
        (err) => {
          setError(err.message);
          setIsStreaming(false);
        }
      );
    } catch (err) {
      console.error('Failed to start discovery stream:', err);
      setError('Failed to connect to discovery stream');
      setIsStreaming(false);
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [externalLogs, conversationId, maxLines, autoStart]);

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/80 font-mono text-sm shadow-xl">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isStreaming ? 'bg-emerald-500' : error ? 'bg-red-500' : 'bg-zinc-600'}`} />
          <span className="font-medium text-zinc-300">Live Discovery</span>
          {isStreaming && (
            <span className="text-xs text-zinc-500">Streaming...</span>
          )}
          {error && (
            <span className="text-xs text-red-400">Error</span>
          )}
        </div>
        <span className="text-xs text-zinc-500">Firecrawl → MCP</span>
      </div>
      <div
        ref={containerRef}
        className="terminal-scroll flex-1 overflow-x-hidden overflow-y-auto p-3 text-xs"
      >
        {error && (
          <div className="text-red-400 mb-2">{error}</div>
        )}
        {logs.length === 0 && !error && !isStreaming && (
          <div className="text-zinc-500 text-center py-4">No events yet</div>
        )}
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
