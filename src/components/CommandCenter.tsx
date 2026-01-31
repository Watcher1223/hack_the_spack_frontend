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
import { api } from "@/lib/api-client";
import type { ChatResponse } from "@/types/api";

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
  const [chatResponse, setChatResponse] = useState<ChatResponse | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (value: string) => {
    setLastPrompt(value);
    setLoading(true);
    setError(null);
    setShowResult(false);
    setDemoStep("idle");

    try {
      // Call real API
      const response = await api.chat({
        message: value,
        conversation_id: conversationId,
        context: {
          ui_mode: "command_center",
        },
      });

      // Store conversation ID for context
      setConversationId(response.conversation_id);
      setChatResponse(response);

      // Animate through workflow steps
      for (const step of response.workflow_steps) {
        setDemoStep(step.step as "checking" | "discovering" | "forging" | "done");
        // Wait for step duration (for animation)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.min(step.duration_ms, 1000))
        );
      }

      // Check if tools were reused (no new tools created)
      setReusedTool(response.tool_calls.length > 0 && !response.actions_logged.some(a => a.title.includes('MCP tool')));

      // Show results
      setShowResult(true);
      setDemoStep("done");

      // Reset to idle after a moment
      setTimeout(() => setDemoStep("idle"), 1000);
    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process command');
      setDemoStep("idle");
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

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
                <CommandInput onSubmit={handleSubmit} disabled={loading || demoStep === "forging"} />
                {error && (
                  <div className="rounded-lg border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}
                {showResult && chatResponse && chatResponse.tool_calls.length > 0 && (
                  <>
                    {chatResponse.tool_calls.map((toolCall, idx) => (
                      <ResultCard
                        key={idx}
                        title={chatResponse.response}
                        subtitle={lastPrompt}
                        data={toolCall.result || {}}
                        source={`${toolCall.name} (MCP)`}
                        reused={reusedTool}
                      />
                    ))}
                  </>
                )}
                {showResult && chatResponse && chatResponse.tool_calls.length === 0 && (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-400">
                    {chatResponse.response}
                  </div>
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
