"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Cloud, MapPin, Thermometer, Droplets } from "lucide-react";

interface ResultCardProps {
  title: string;
  subtitle?: string;
  data?: Record<string, unknown>;
  source?: string;
  reused?: boolean;
}

const DEFAULT_WEATHER = {
  city: "San Francisco",
  temp: "15°C",
  condition: "Clear sky",
  humidity: "72%",
};

export function ResultCard({
  title,
  subtitle,
  data = DEFAULT_WEATHER,
  source = "OpenWeatherMap (MCP)",
  reused = false,
}: ResultCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900/80 p-5 shadow-xl"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="chat-markdown font-semibold text-zinc-100 [&>p]:mb-0 [&>p:first-child]:mt-0">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{title}</ReactMarkdown>
          </div>
          {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
        </div>
        {reused && (
          <span className="rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
            Reused
          </span>
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-zinc-800/60 p-3">
          <MapPin className="h-4 w-4 text-zinc-500" />
          <span className="text-sm text-zinc-300">
            {(data as { city?: string }).city ?? "—"}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-zinc-800/60 p-3">
          <Thermometer className="h-4 w-4 text-zinc-500" />
          <span className="text-sm text-zinc-300">
            {(data as { temp?: string }).temp ?? "—"}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-zinc-800/60 p-3">
          <Cloud className="h-4 w-4 text-zinc-500" />
          <span className="text-sm text-zinc-300">
            {(data as { condition?: string }).condition ?? "—"}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-zinc-800/60 p-3">
          <Droplets className="h-4 w-4 text-zinc-500" />
          <span className="text-sm text-zinc-300">
            {(data as { humidity?: string }).humidity ?? "—"}
          </span>
        </div>
      </div>
      <p className="mt-3 text-xs text-zinc-500">Source: {source}</p>
    </motion.div>
  );
}
