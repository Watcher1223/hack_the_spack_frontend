"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Flame,
  Shield,
  Activity,
  ChevronRight,
  Package,
  KeyRound,
} from "lucide-react";
import { LiveDiscoveryHUD } from "./LiveDiscoveryHUD";
import { MCPForge } from "./MCPForge";
import { TrustGovernanceLedger } from "./TrustGovernanceLedger";
import { ActionCenter } from "./ActionCenter";
import { ToolMarketplace } from "./ToolMarketplace";
import { ApiAccess } from "./ApiAccess";
import { UniversalAdapterLogo } from "./UniversalAdapterLogo";
import { CommandInput } from "./CommandInput";
import { ResultCard } from "./ResultCard";
import type { ViewMode } from "@/types";

const TABS: { id: ViewMode; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "home", label: "Dashboard", icon: LayoutDashboard },
  { id: "marketplace", label: "Marketplace", icon: Package },
  { id: "forge", label: "MCP Forge", icon: Flame },
  { id: "ledger", label: "Audit Trail", icon: Shield },
  { id: "action", label: "Action Center", icon: Activity },
  { id: "api", label: "API", icon: KeyRound },
];

export function CommandCenter() {
  const [view, setView] = useState<ViewMode>("home");
  const [lastPrompt, setLastPrompt] = useState("");
  const [showForgeTransition, setShowForgeTransition] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [reusedTool, setReusedTool] = useState(false);
  const [demoStep, setDemoStep] = useState<"idle" | "checking" | "discovering" | "forging" | "done">("idle");
  const [justCreatedToolId, setJustCreatedToolId] = useState<string | null>(null);

  const handleSubmit = useCallback((value: string) => {
    setLastPrompt(value);
    const isWeatherNY = /new york|nyc|new york city/i.test(value);
    if (isWeatherNY) {
      setReusedTool(true);
      setShowResult(true);
      setView("home");
      setDemoStep("idle");
      return;
    }
    setReusedTool(false);
    setJustCreatedToolId("1"); // OpenWeatherMap = first tool "created" in demo
    setDemoStep("checking");
    setView("home");
    setTimeout(() => setDemoStep("discovering"), 600);
    setTimeout(() => {
      setShowForgeTransition(true);
      setView("forge");
      setDemoStep("forging");
    }, 1200);
    setTimeout(() => setShowForgeTransition(false), 1600);
    setTimeout(() => {
      setDemoStep("done");
      setShowResult(true);
    }, 4500);
  }, []);

  return (
    <div className="flex h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
      {/* Top bar */}
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 ring-1 ring-zinc-700">
            <UniversalAdapterLogo size={28} />
          </div>
          <div>
            <h1 className="font-semibold tracking-tight text-zinc-100">
              Universal Adapter
            </h1>
            <p className="text-xs text-zinc-500">
              Self-extending agent marketplace
            </p>
          </div>
        </div>
        <nav className="flex items-center gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setView(tab.id)}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                view === tab.id
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: Live Discovery HUD (always visible when not full Forge) */}
        {view !== "forge" && (
          <aside className="hidden w-96 shrink-0 overflow-x-hidden border-r border-zinc-800 p-4 lg:block">
            <LiveDiscoveryHUD maxLines={18} />
          </aside>
        )}
        {/* Main content */}
        <main className="scrollbar-hide flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">
            {view === "home" && (
              <motion.div
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mx-auto flex max-w-2xl flex-col items-center gap-6 pt-16"
              >
                <div className="text-center">
                  <h2 className="text-xl font-medium tracking-tight text-zinc-100 sm:text-2xl">
                    Agents that grow their own tools
                  </h2>
                  <p className="mt-2 text-sm text-zinc-500">
                    One request. Discover → build → save → reuse.
                  </p>
                </div>
                {/* Compact flow indicator */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-zinc-600">
                  <span className={demoStep === "checking" || demoStep === "discovering" ? "text-zinc-400" : ""}>
                    Marketplace
                  </span>
                  <span className="text-zinc-700">·</span>
                  <span className={demoStep === "discovering" || demoStep === "forging" ? "text-zinc-400" : ""}>
                    Discover
                  </span>
                  <span className="text-zinc-700">·</span>
                  <span className={demoStep === "forging" ? "text-zinc-400" : ""}>
                    MCP
                  </span>
                  <span className="text-zinc-700">·</span>
                  <span>Save & run</span>
                  <span className="text-zinc-700">·</span>
                  <span>Reuse</span>
                </div>
                {demoStep === "checking" && (
                  <p className="text-xs text-zinc-500">Checking marketplace…</p>
                )}
                {demoStep === "discovering" && (
                  <p className="text-xs text-zinc-500">Discovering API…</p>
                )}
                <CommandInput onSubmit={handleSubmit} disabled={demoStep === "forging"} />
                {showResult && (
                  <>
                  <ResultCard
                    title="Weather summary"
                    subtitle={lastPrompt}
                    data={{
                      city: reusedTool ? "New York" : "San Francisco",
                      temp: reusedTool ? "12°C" : "15°C",
                      condition: "Clear sky",
                      humidity: "72%",
                    }}
                    source="OpenWeatherMap (MCP)"
                    reused={reusedTool}
                  />
                  </>
                )}
              </motion.div>
            )}

            {view === "forge" && (
              <motion.div
                key="forge"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{
                  opacity: 1,
                  scale: showForgeTransition ? 1.02 : 1,
                }}
                exit={{ opacity: 0 }}
                className="flex h-[calc(100vh-8rem)] flex-col gap-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="hidden lg:flex items-center gap-2 text-zinc-400">
                    <span className="text-sm">Building tool from prompt:</span>
                    <span className="font-mono text-zinc-300">
                      &quot;{lastPrompt || "Get weather in San Francisco"}&quot;
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setView("home")}
                    className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700"
                  >
                    ← Back to Dashboard
                  </button>
                </div>
                <div className="lg:hidden h-44 shrink-0">
                  <LiveDiscoveryHUD maxLines={6} />
                </div>
                <div className="flex-1 min-h-0">
                  <MCPForge showSelfHeal />
                </div>
              </motion.div>
            )}

            {view === "marketplace" && (
              <motion.div
                key="marketplace"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-[calc(100vh-8rem)]"
              >
                <ToolMarketplace justCreatedToolId={justCreatedToolId} />
              </motion.div>
            )}

            {view === "ledger" && (
              <motion.div
                key="ledger"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-[calc(100vh-8rem)]"
              >
                <TrustGovernanceLedger />
              </motion.div>
            )}

            {view === "action" && (
              <motion.div
                key="action"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-[calc(100vh-8rem)]"
              >
                <ActionCenter />
              </motion.div>
            )}

            {view === "api" && (
              <motion.div
                key="api"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="scrollbar-hide overflow-y-auto pb-8"
              >
                <ApiAccess />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Right rail: Action Center when on home/forge */}
        {view === "home" && (
          <aside className="hidden w-72 shrink-0 border-l border-zinc-800 p-4 xl:block">
            <ActionCenter maxItems={8} />
          </aside>
        )}
      </div>
      {/* Sponsor alignment strip */}
      <footer className="shrink-0 border-t border-zinc-800 bg-zinc-950/95 px-4 py-2">
        <p className="text-center text-xs text-zinc-500">
          Powered by{" "}
          <span className="text-zinc-400">Firecrawl</span>
          {" · "}
          <span className="text-zinc-400">MongoDB</span>
          {" · "}
          <span className="text-zinc-400">Resend</span>
          {" · "}
          <span className="text-zinc-400">Mux</span>
          {" · "}
          <span className="text-zinc-400">Lovable</span>
          {" · "}
          <span className="text-zinc-400">Algolia</span>
        </p>
      </footer>
    </div>
  );
}
