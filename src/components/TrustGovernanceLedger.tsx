"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Play, ExternalLink, Cloud, Lock, AlertCircle, RefreshCw } from "lucide-react";
import { api } from "@/lib/api-client";
import type { VerifiedTool } from "@/types/api";

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: typeof Shield }
> = {
  DEPRECATED: {
    label: "DEPRECATED",
    className: "border-amber-500/50 bg-amber-500/10 text-amber-400",
    icon: AlertCircle,
  },
  BETA: {
    label: "BETA",
    className: "border-blue-500/50 bg-blue-500/10 text-blue-400",
    icon: Lock,
  },
  "PROD-READY": {
    label: "PROD-READY",
    className: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
    icon: Cloud,
  },
};

export function TrustGovernanceLedger() {
  const [tools, setTools] = useState<VerifiedTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVerifiedTools = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getVerifiedTools();
      setTools(data);
    } catch (err) {
      console.error('Failed to load verified tools:', err);
      setError(err instanceof Error ? err.message : 'Failed to load verified tools');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVerifiedTools();
  }, []);

  const getTrustScoreColor = (score: number): string => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };
  return (
    <div className="flex h-full flex-col rounded-lg border border-zinc-800 bg-zinc-950/80 shadow-xl">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-zinc-400" />
          <h2 className="font-semibold text-zinc-200">Audit Trail</h2>
        </div>
        <button
          onClick={loadVerifiedTools}
          disabled={loading}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-400 disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="terminal-scroll flex-1 overflow-y-auto p-3">
        {error && (
          <div className="mb-3 rounded-lg border border-red-800 bg-red-900/20 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}
        {loading && tools.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">
            Loading verified tools...
          </p>
        ) : tools.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">
            No verified tools yet
          </p>
        ) : (
          <ul className="space-y-2">
            {tools.map((tool, i) => {
              const config = STATUS_CONFIG[tool.status] || STATUS_CONFIG["PROD-READY"];
              const Icon = config.icon;
              return (
                <motion.li
                  key={tool.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 transition-colors hover:border-zinc-700"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-zinc-100">{tool.name}</p>
                      <p className="text-xs text-zinc-500">{tool.description}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium ${config.className}`}
                    >
                      <Icon className="h-3 w-3" />
                      {config.label}
                    </span>
                  </div>

                  {/* Verification Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-zinc-600">Trust Score:</span>
                      <span className={`ml-1 font-medium ${getTrustScoreColor(tool.verification.trust_score)}`}>
                        {tool.verification.trust_score}/100
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-600">Security:</span>
                      <span className={`ml-1 ${tool.verification.security_scan_passed ? 'text-emerald-400' : 'text-red-400'}`}>
                        {tool.verification.security_scan_passed ? '✓ Passed' : '✗ Failed'}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-600">Rate Limit:</span>
                      <span className="ml-1 text-zinc-400">
                        {tool.governance.rate_limit_per_minute}/min
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-600">Cost:</span>
                      <span className="ml-1 text-zinc-400">
                        ${tool.governance.cost_per_execution.toFixed(3)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {tool.mux_playback_id && (
                      <a
                        href={`https://mux.com/playback/${tool.mux_playback_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Watch Audit
                      </a>
                    )}
                    {tool.source_url && (
                      <a
                        href={tool.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Source
                      </a>
                    )}
                    <span className="text-zinc-600">
                      Last audit: {new Date(tool.verification.last_audit).toLocaleDateString()}
                    </span>
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
