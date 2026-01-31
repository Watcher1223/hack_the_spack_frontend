"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Shield,
  KeyRound,
  Check,
  FileCode,
  Radio,
  Globe,
  Zap,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { TrustGovernanceLedger } from "./TrustGovernanceLedger";
import { ApiAccess } from "./ApiAccess";
import { UniversalAdapterLogo } from "./UniversalAdapterLogo";
import { CommandInput } from "./CommandInput";
import { ResultCard } from "./ResultCard";
import { DashboardMiddlePanel, type ReferenceItem } from "./DashboardMiddlePanel";
import { MarketplaceCenter } from "./MarketplaceCenter";
import type { ViewMode } from "@/types";
import type { LogEntry } from "@/types";
import { api } from "@/lib/api-client";
import type { ChatResponse, DiscoveryLog } from "@/types/api";
import type { EnhancedTool } from "@/types/api";

const TABS: { id: ViewMode; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "home", label: "Dashboard", icon: LayoutDashboard },
  { id: "ledger", label: "Audit Trail", icon: Shield },
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
  const [conversations, setConversations] = useState<{ id: string; prompt?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discoveryLogs, setDiscoveryLogs] = useState<LogEntry[]>([]);
  const [streamingEvents, setStreamingEvents] = useState<DiscoveryLog[]>([]);
  const [forgeToolName, setForgeToolName] = useState<string | null>(null);
  const [forgeToolCode, setForgeToolCode] = useState<string | null>(null);
  const [forgeDocsMarkdown, setForgeDocsMarkdown] = useState<string | null>(null);
  const [marketplaceSearchResults, setMarketplaceSearchResults] = useState<EnhancedTool[]>([]);
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [currentToolForPanel, setCurrentToolForPanel] = useState<EnhancedTool | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const chatSentRef = useRef(false);
  const pendingNavigateToolRef = useRef<string | null>(null);
  const hasNavigatedToForgeRef = useRef(false);
  const [showStreamingEvents, setShowStreamingEvents] = useState(true);

  /** When agent generates a new tool, switch to forge layout: marketplace on left, code + refs in center */
  const forgeMode = !!(
    forgeToolName ||
    forgeToolCode ||
    demoStep === "forging" ||
    (showResult && (chatResponse?.tool_calls?.length ?? 0) > 0 && !reusedTool)
  );

  // When chatResponse arrives after [DONE], show code + tool in middle panel (stay on dashboard)
  useEffect(() => {
    if (!showResult || !chatResponse?.tool_calls?.length || hasNavigatedToForgeRef.current) return;
    const toolName = chatResponse.tool_calls[0].name;
    if (!toolName) return;
    hasNavigatedToForgeRef.current = true;
    api
      .getToolCode(toolName)
      .then((codeRes) => {
        setForgeToolName(codeRes.name);
        setForgeToolCode(codeRes.code);
        setJustCreatedToolId(toolName);
      })
      .catch(() => setJustCreatedToolId(toolName));
  }, [showResult, chatResponse]);

  // When we have a forged/current tool name, load full tool for middle panel (execute form)
  useEffect(() => {
    const name = forgeToolName || justCreatedToolId;
    if (!name) {
      setCurrentToolForPanel(null);
      return;
    }
    api
      .getTool(name)
      .then(setCurrentToolForPanel)
      .catch(() => setCurrentToolForPanel(null));
  }, [forgeToolName, justCreatedToolId]);

  const handleSubmit = useCallback(async (value: string) => {
    setLastPrompt(value);
    setLoading(true);
    setError(null);
    setShowResult(false);
    setDemoStep("checking");
    setDiscoveryLogs([]);
    setStreamingEvents([]);
    setForgeToolName(null);
    setForgeToolCode(null);
    setForgeDocsMarkdown(null);
    setJustCreatedToolId(null);
    setMarketplaceSearchResults([]);
    setReferences([]);
    setCurrentToolForPanel(null);
    chatSentRef.current = false;
    pendingNavigateToolRef.current = null;
    hasNavigatedToForgeRef.current = false;

    const maxLogs = 50;
    const pushLog = (log: DiscoveryLog) => {
      // Capture streaming events for real-time display
      if (log.type === 'assistant_message' || log.type === 'tool_call' || log.type === 'tool_result') {
        setStreamingEvents((prev) => [...prev.slice(-(maxLogs - 1)), log]);
      }

      // Capture tool name from "Tool 'X' registered in marketplace" so we can navigate even if chat response is late
      if (log.tool_name && (log.message?.includes("registered") || log.message?.includes("registered in marketplace"))) {
        pendingNavigateToolRef.current = log.tool_name;
      }
      const urlToAdd = log.url || (log.metadata && typeof log.metadata.url === "string" ? log.metadata.url : null);
      if (urlToAdd) {
        setReferences((prev) => {
          if (prev.some((r) => r.url === urlToAdd)) return prev;
          return [...prev, { url: urlToAdd, label: log.message?.slice(0, 80) }];
        });
      }
      // Also extract URLs from message (e.g. "Crawled https://...")
      const urlInMessage = log.message?.match(/https?:\/\/[^\s)]+/);
      if (urlInMessage?.[0]) {
        const u = urlInMessage[0];
        setReferences((prev) => {
          if (prev.some((r) => r.url === u)) return prev;
          return [...prev, { url: u, label: log.message?.slice(0, 60) }];
        });
      }
      const level = log.level === "success" ? "info" : log.level === "warning" ? "warn" : log.level;
      const entry: LogEntry = {
        id: log.id ?? `log-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: log.timestamp ?? new Date().toISOString().slice(11, 23),
        source: log.source ?? "system",
        message: log.message ?? "",
        level: level as LogEntry["level"],
      };
      setDiscoveryLogs((prev) => [...prev.slice(-(maxLogs - 1)), entry]);
    };

    try {
      // Agent first checks marketplace: run search so user sees results in middle panel
      api.searchTools(value, 10).then((r) => setMarketplaceSearchResults(r.tools)).catch(() => {});

      const streamUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"}/api/discovery/stream`;
      const es = new EventSource(streamUrl);
      eventSourceRef.current = es;

      es.onmessage = (event: MessageEvent) => {
        const raw = typeof event.data === "string" ? event.data.trim() : String(event.data ?? "").trim();
        if (raw === "[DONE]") {
          es.close();
          eventSourceRef.current = null;
          setLoading(false);
          setDemoStep("done");
          setShowResult(true);
          const toolToShow = pendingNavigateToolRef.current;
          if (toolToShow) {
            hasNavigatedToForgeRef.current = true;
            api
              .getToolCode(toolToShow)
              .then((codeRes) => {
                setForgeToolName(codeRes.name);
                setForgeToolCode(codeRes.code);
                setJustCreatedToolId(toolToShow);
              })
              .catch(() => setJustCreatedToolId(toolToShow));
          }
          return;
        }
        let log: DiscoveryLog | null = null;
        try {
          log = typeof event.data === "object" && event.data !== null
            ? (event.data as DiscoveryLog)
            : JSON.parse(event.data as string);
        } catch {
          return;
        }
        if (!log || (log.source == null && log.message == null && log.conversation_id == null)) return;
        // First event may be { type: "connected", conversation_id } — use it for POST /chat
        const cid = log.conversation_id;
        if (cid && !chatSentRef.current) {
          chatSentRef.current = true;
          setConversationId(cid);
          setConversations((prev) =>
            prev.some((c) => c.id === cid) ? prev : [...prev, { id: cid, prompt: value }]
          );
          setDemoStep("discovering");
            api
              .chat({
                message: value,
                conversation_id: cid,
                context: { ui_mode: "command_center" },
              })
            .then((response) => {
              setChatResponse(response);
              if (response.tool_calls?.length) {
                pendingNavigateToolRef.current = response.tool_calls[0].name;
              }
              setReusedTool(
                (response.tool_calls?.length ?? 0) > 0 &&
                  !(response.actions_logged ?? []).some((a) => a.title?.includes("MCP tool"))
              );
            })
            .catch((err) => {
              setError(err instanceof Error ? err.message : "Chat failed");
            });
        }
        if (log.source != null || log.message != null) pushLog(log);
      };

      es.onerror = () => {
        es.close();
        eventSourceRef.current = null;
        if (!chatSentRef.current) {
          setError("Discovery stream failed. Is the backend running?");
          setLoading(false);
        }
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start discovery stream");
      setLoading(false);
    }
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
        {/* Left sidebar only when agent is generating a new tool (forge mode) */}
        {view === "home" && forgeMode && (
          <DashboardMiddlePanel
            marketplaceSearchResults={marketplaceSearchResults}
            marketplaceChecking={loading && demoStep === "checking"}
            references={references}
            currentTool={currentToolForPanel}
            justCreatedToolId={justCreatedToolId}
            onSelectTool={setCurrentToolForPanel}
          />
        )}
        {/* Main: default = Marketplace center; forge = Code | References split */}
        <main className="scrollbar-hide flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">
            {view === "home" && !forgeMode && (
              <motion.div
                key="home-default"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full flex-col gap-6"
              >
                <div className="shrink-0 text-center">
                  <h2 className="text-xl font-medium tracking-tight text-zinc-100 sm:text-2xl">
                    Agents that grow their own tools
                  </h2>
                  <p className="mt-2 text-sm text-zinc-500">
                    Discover → build → save → reuse.
                  </p>
                </div>

                {/* Streaming Agent Messages */}
                {streamingEvents.length > 0 && (
                  <div className="shrink-0 rounded-lg border border-zinc-800 bg-zinc-950/80 shadow-xl">
                    <button
                      onClick={() => setShowStreamingEvents(!showStreamingEvents)}
                      className="flex w-full items-center justify-between border-b border-zinc-800 px-4 py-3 hover:bg-zinc-900/50"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${loading ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
                        <span className="font-medium text-zinc-300">Agent Stream</span>
                        {loading && (
                          <Loader2 className="h-3 w-3 animate-spin text-zinc-500" />
                        )}
                      </div>
                      <span className="text-xs text-zinc-500">
                        {streamingEvents.length} event{streamingEvents.length !== 1 ? 's' : ''}
                      </span>
                    </button>
                    {showStreamingEvents && (
                      <div className="terminal-scroll max-h-96 overflow-y-auto p-4 space-y-3">
                        {streamingEvents.map((event, idx) => {
                          // Assistant message - show prominently
                          if (event.type === 'assistant_message') {
                            return (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-3"
                              >
                                <div className="flex items-start gap-2">
                                  <Zap className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs text-zinc-500 mb-1">
                                      Agent · Iteration {event.iteration}
                                    </div>
                                    <p className="text-sm text-zinc-200 leading-relaxed">
                                      {event.content}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          }

                          // Tool call - show with arguments
                          if (event.type === 'tool_call') {
                            return (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-lg border border-blue-800/50 bg-blue-900/10 p-3"
                              >
                                <div className="flex items-start gap-2">
                                  <Zap className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs text-blue-400 font-medium mb-1">
                                      Calling: {event.tool_name}
                                    </div>
                                    {event.arguments && Object.keys(event.arguments).length > 0 && (
                                      <pre className="text-xs text-zinc-400 bg-zinc-950/50 rounded p-2 overflow-x-auto">
                                        {JSON.stringify(event.arguments, null, 2)}
                                      </pre>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          }

                          // Tool result - show with status
                          if (event.type === 'tool_result') {
                            const isSuccess = event.status === 'success';
                            return (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`rounded-lg border p-3 ${
                                  isSuccess
                                    ? 'border-emerald-800/50 bg-emerald-900/10'
                                    : 'border-red-800/50 bg-red-900/10'
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  {isSuccess ? (
                                    <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className={`text-xs font-medium mb-1 ${
                                      isSuccess ? 'text-emerald-400' : 'text-red-400'
                                    }`}>
                                      {event.tool_name} · {event.status}
                                    </div>
                                    {event.result_preview && (
                                      <pre className="text-xs text-zinc-400 bg-zinc-950/50 rounded p-2 overflow-x-auto">
                                        {event.result_preview}
                                      </pre>
                                    )}
                                    {event.error && (
                                      <p className="text-xs text-red-400">{event.error}</p>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          }

                          return null;
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex-1 min-h-0">
                  <MarketplaceCenter
                    onSelectTool={setCurrentToolForPanel}
                    marketplaceChecking={loading && demoStep === "checking"}
                  />
                </div>
              </motion.div>
            )}
            {view === "home" && forgeMode && (
              <motion.div
                key="home-forge"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full flex-col gap-4"
              >
                <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-2">
                  <div className="flex min-h-0 flex-col rounded-lg border border-zinc-700 bg-zinc-900/80 overflow-hidden">
                    <div className="flex items-center gap-2 border-b border-zinc-700 bg-zinc-800/50 px-4 py-2">
                      <FileCode className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="text-sm font-medium text-zinc-300">Compiled tool code</span>
                    </div>
                    <pre className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap break-words">
                      {forgeToolCode ?? "Loading…"}
                    </pre>
                  </div>
                  <div className="flex min-h-0 flex-col rounded-lg border border-zinc-700 bg-zinc-900/80 overflow-hidden">
                    <div className="flex items-center gap-2 border-b border-zinc-700 bg-zinc-800/50 px-4 py-2">
                      <Globe className="h-4 w-4 text-orange-500 shrink-0" />
                      <span className="text-sm font-medium text-zinc-300">References</span>
                    </div>
                    <div className="flex-1 overflow-auto p-4">
                      {references.length === 0 ? (
                        <p className="text-sm text-zinc-500">No references yet</p>
                      ) : (
                        <ul className="space-y-2">
                          {references.map((ref, i) => (
                            <li key={`${ref.url}-${i}`}>
                              <a
                                href={ref.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start gap-2 rounded border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-blue-400 hover:bg-zinc-800 hover:underline"
                              >
                                <span className="line-clamp-2 break-all">{ref.label || ref.url}</span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
                {error && (
                  <div className="rounded-lg border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}
                {showResult && chatResponse && (chatResponse.tool_calls?.length ?? 0) > 0 && (
                  <div className="space-y-4">
                    {(chatResponse.tool_calls ?? []).map((toolCall, idx) => (
                      <ResultCard
                        key={idx}
                        title={chatResponse.response}
                        subtitle={lastPrompt}
                        data={toolCall.result || {}}
                        source={`${toolCall.name} (MCP)`}
                        reused={reusedTool}
                      />
                    ))}
                  </div>
                )}
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

        {/* Right sidebar: Conversations (top) + chat input (bottom) when on home */}
        {view === "home" && (
          <aside className="hidden w-80 shrink-0 flex flex-col border-l border-zinc-800 xl:flex">
            <div className="shrink-0 border-b border-zinc-800 p-3">
              <p className="mb-2 text-xs font-medium text-zinc-500">Conversations</p>
              <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
                {conversations.length === 0 ? (
                  <span className="shrink-0 text-xs text-zinc-600">No conversations yet</span>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => setConversationId(conv.id)}
                      className={`shrink-0 rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                        conversationId === conv.id
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                          : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
                      }`}
                    >
                      <span className="line-clamp-2 block max-w-[200px]">
                        {conv.prompt ? (conv.prompt.length > 36 ? `${conv.prompt.slice(0, 36)}…` : conv.prompt) : conv.id.slice(0, 8)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="flex-1 min-h-0" />
            <div className="shrink-0 border-t border-zinc-800 p-4">
              <CommandInput onSubmit={handleSubmit} disabled={loading || demoStep === "forging"} />
            </div>
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
