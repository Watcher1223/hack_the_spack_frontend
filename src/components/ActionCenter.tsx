"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, CheckCircle, Clock, XCircle, GitPullRequest, RefreshCw } from "lucide-react";
import { api } from "@/lib/api-client";
import type { Action } from "@/types/api";

const STATUS_ICONS = {
  success: CheckCircle,
  pending: Clock,
  error: XCircle,
};

const STATUS_STYLES = {
  success: "text-emerald-400",
  pending: "text-amber-400",
  error: "text-red-400",
};

interface ActionCenterProps {
  maxItems?: number;
  conversationId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function ActionCenter({
  maxItems = 12,
  conversationId,
  autoRefresh = false,
  refreshInterval = 5000,
}: ActionCenterProps) {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActions = async () => {
    try {
      setError(null);
      const data = await api.getActions(conversationId, maxItems + 10, 0);
      setActions(data);
    } catch (err) {
      console.error('Failed to load actions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load actions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActions();

    if (autoRefresh) {
      const interval = setInterval(loadActions, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [conversationId, autoRefresh, refreshInterval, maxItems]);

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  };

  const items = actions.slice(0, maxItems);

  return (
    <div className="flex h-full flex-col rounded-lg border border-zinc-800 bg-zinc-950/80 shadow-xl">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-zinc-400" />
          <h2 className="font-semibold text-zinc-200">Action Center</h2>
        </div>
        <button
          onClick={loadActions}
          disabled={loading}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-400 disabled:opacity-50"
          title="Refresh actions"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      <div className="terminal-scroll flex-1 overflow-y-auto p-3">
        {error && (
          <div className="mb-3 rounded-lg border border-red-800 bg-red-900/20 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}
        {loading && items.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">
            Loading actions...
          </p>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">
            No actions yet
          </p>
        ) : (
          <ul className="space-y-0">
            {items.map((action, i) => {
              const Icon = STATUS_ICONS[action.status];
              const style = STATUS_STYLES[action.status];
              return (
                <motion.li
                  key={action.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="group border-b border-zinc-800/80 py-3 last:border-0"
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style}`} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-zinc-200">{action.title}</p>
                      <p className="text-xs text-zinc-500">{action.detail}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-zinc-600">
                          {formatTimestamp(action.timestamp)}
                        </span>
                        {action.tool_name && (
                          <span className="text-xs text-zinc-600">
                            · {action.tool_name}
                          </span>
                        )}
                        {action.github_pr_url && (
                          <a
                            href={action.github_pr_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline"
                          >
                            <GitPullRequest className="h-3 w-3" />
                            View PR
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
