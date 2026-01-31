"use client";

import { motion } from "framer-motion";
import { Activity, CheckCircle, Clock, XCircle, GitPullRequest } from "lucide-react";
import type { ActionFeedItem } from "@/types";

const DEMO_ACTIONS: ActionFeedItem[] = [
  {
    id: "1",
    title: "Agent called Stripe API",
    detail: "Charge created for $99.00",
    status: "success",
    timestamp: "2 min ago",
    githubPrUrl: "https://github.com/org/repo/pull/42",
  },
  {
    id: "2",
    title: "Notification sent to CTO",
    detail: "Resend → team@company.com",
    status: "success",
    timestamp: "2 min ago",
  },
  {
    id: "3",
    title: "MCP tool updated",
    detail: "get_current_weather — schema fix",
    status: "success",
    timestamp: "5 min ago",
    githubPrUrl: "https://github.com/org/repo/pull/41",
  },
  {
    id: "4",
    title: "Firecrawl ingestion",
    detail: "OpenWeatherMap docs → 12 endpoints",
    status: "success",
    timestamp: "8 min ago",
  },
  {
    id: "5",
    title: "Tool execution pending",
    detail: "Instagram media fetch",
    status: "pending",
    timestamp: "Just now",
  },
];

const STATUS_ICONS = {
  success: CheckCircle,
  pending: Clock,
  failed: XCircle,
};

const STATUS_STYLES = {
  success: "text-emerald-400",
  pending: "text-amber-400",
  failed: "text-red-400",
};

export function ActionCenter({
  actions = DEMO_ACTIONS,
  maxItems = 12,
}: {
  actions?: ActionFeedItem[];
  maxItems?: number;
}) {
  const items = actions.slice(0, maxItems);

  return (
    <div className="flex h-full flex-col rounded-lg border border-zinc-800 bg-zinc-950/80 shadow-xl">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-zinc-400" />
          <h2 className="font-semibold text-zinc-200">Action Center</h2>
        </div>
        <span className="text-xs text-zinc-500">Paper trail</span>
      </div>
      <div className="terminal-scroll flex-1 overflow-y-auto p-3">
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
                      <span className="text-xs text-zinc-600">{action.timestamp}</span>
                      {action.githubPrUrl && (
                        <a
                          href={action.githubPrUrl}
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
      </div>
    </div>
  );
}
