"use client";

import { motion } from "framer-motion";
import { Shield, Play, ExternalLink, Cloud, Lock, AlertCircle } from "lucide-react";
import type { VerifiedCapability, ToolStatus } from "@/types";

const STATUS_CONFIG: Record<
  ToolStatus,
  { label: string; className: string; icon: typeof Shield }
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

const DEMO_CAPABILITIES: VerifiedCapability[] = [
  {
    id: "1",
    name: "OpenWeatherMap",
    description: "Current weather by city",
    status: "PROD-READY",
    sourceUrl: "https://api.openweathermap.org/docs",
    muxPlaybackId: "demo-playback-id",
    createdAt: "2025-01-30T10:00:00Z",
  },
  {
    id: "2",
    name: "Instagram Graph API",
    description: "Media and profile read",
    status: "SANDBOXED",
    sourceUrl: "https://developers.facebook.com/docs/instagram-api",
    createdAt: "2025-01-29T14:00:00Z",
  },
  {
    id: "3",
    name: "Stripe Payments",
    description: "Charges and customers",
    status: "PROD-READY",
    muxPlaybackId: "stripe-audit-id",
    createdAt: "2025-01-28T09:00:00Z",
  },
  {
    id: "4",
    name: "Custom Internal API",
    description: "Internal docs (new)",
    status: "UNVERIFIED",
    createdAt: "2025-01-30T11:30:00Z",
  },
];

export function TrustGovernanceLedger({
  capabilities = DEMO_CAPABILITIES,
}: {
  capabilities?: VerifiedCapability[];
}) {
  return (
    <div className="flex h-full flex-col rounded-lg border border-zinc-800 bg-zinc-950/80 shadow-xl">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-zinc-400" />
          <h2 className="font-semibold text-zinc-200">Audit Trail</h2>
        </div>
        <span className="text-xs text-zinc-500">Verified capabilities</span>
      </div>
      <div className="terminal-scroll flex-1 overflow-y-auto p-3">
        <ul className="space-y-2">
          {capabilities.map((cap, i) => {
            const config = STATUS_CONFIG[cap.status];
            const Icon = config.icon;
            return (
              <motion.li
                key={cap.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 transition-colors hover:border-zinc-700"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-zinc-100">{cap.name}</p>
                    <p className="text-xs text-zinc-500">{cap.description}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium ${config.className}`}
                  >
                    <Icon className="h-3 w-3" />
                    {config.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {cap.muxPlaybackId && (
                    <a
                      href={`https://mux.com/playback/${cap.muxPlaybackId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white"
                    >
                      <Play className="h-3.5 w-3.5" />
                      Watch Audit
                    </a>
                  )}
                  {cap.sourceUrl && (
                    <a
                      href={cap.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Source
                    </a>
                  )}
                </div>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
