"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Shield,
  Settings,
  Check,
  FileCode,
  Radio,
  Globe,
  Zap,
  CheckCircle,
  XCircle,
  Loader2,
  X,
  ExternalLink,
  Play,
  Code2,
  Link2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { TrustGovernanceLedger } from "./TrustGovernanceLedger";
import { Settings as SettingsView } from "./Settings";
import { UniversalAdapterLogo } from "./UniversalAdapterLogo";
import { CommandInput } from "./CommandInput";
import { ResultCard } from "./ResultCard";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { DashboardMiddlePanel, type ReferenceItem } from "./DashboardMiddlePanel";
import { MarketplaceCenter } from "./MarketplaceCenter";
import { DraggableResizer } from "./DraggableResizer";
import type { ViewMode } from "@/types";
import type { LogEntry } from "@/types";
import { api } from "@/lib/api-client";
import { formatExecutionResultForDisplay } from "@/lib/formatExecutionResult";
import { getToolDocUrls } from "@/lib/tool-doc-urls";
import type { ChatResponse, DiscoveryLog } from "@/types/api";
import type { EnhancedTool } from "@/types/api";

const TABS: { id: ViewMode; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "home", label: "Dashboard", icon: LayoutDashboard },
  { id: "ledger", label: "Audit Trail", icon: Shield },
  { id: "settings", label: "Settings", icon: Settings },
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
  const [selectedToolForDrawer, setSelectedToolForDrawer] = useState<EnhancedTool | null>(null);
  const [toolExecuting, setToolExecuting] = useState(false);
  const [toolExecutionResult, setToolExecutionResult] = useState<any>(null);
  const [toolExecutionError, setToolExecutionError] = useState<string | null>(null);
  const [toolParamInputs, setToolParamInputs] = useState<Record<string, any>>({});
  const [toolResultExpanded, setToolResultExpanded] = useState(true);
  const [rightSidebarWidthPx, setRightSidebarWidthPx] = useState(380);
  const [leftSidebarWidthPx, setLeftSidebarWidthPx] = useState(288);
  const eventSourceRef = useRef<EventSource | null>(null);
  const chatSentRef = useRef(false);
  const pendingNavigateToolRef = useRef<string | null>(null);
  const hasNavigatedToForgeRef = useRef(false);

  /** When agent generates a new tool, switch to forge layout: marketplace on left, code + refs in center */
  const forgeMode = !!(
    forgeToolName ||
    forgeToolCode ||
    demoStep === "forging" ||
    (showResult && (chatResponse?.tool_calls?.length ?? 0) > 0 && !reusedTool)
  );

  // Initialize tool parameters when drawer opens
  useEffect(() => {
    if (selectedToolForDrawer) {
      const defaults: Record<string, any> = {};
      if (selectedToolForDrawer.parameters?.properties) {
        Object.entries(selectedToolForDrawer.parameters.properties).forEach(([name, param]: [string, any]) => {
          if (param.default !== undefined) {
            defaults[name] = param.default;
          } else if (param.type === 'integer') {
            defaults[name] = 0;
          } else if (param.type === 'string') {
            defaults[name] = '';
          } else if (param.type === 'boolean') {
            defaults[name] = false;
          }
        });
      }
      setToolParamInputs(defaults);
      setToolExecutionResult(null);
      setToolExecutionError(null);
    }
  }, [selectedToolForDrawer]);

  const handleToolExecute = useCallback(async () => {
    if (!selectedToolForDrawer) return;

    setToolExecuting(true);
    setToolExecutionError(null);
    setToolExecutionResult(null);

    try {
      const result = await api.executeTool(selectedToolForDrawer.name, toolParamInputs);
      setToolExecutionResult(result);
      setToolResultExpanded(true);
    } catch (err) {
      console.error('Tool execution failed:', err);
      setToolExecutionError(err instanceof Error ? err.message : 'Execution failed');
    } finally {
      setToolExecuting(false);
    }
  }, [selectedToolForDrawer, toolParamInputs]);

  const handleToolParamChange = useCallback((name: string, value: any, type: string) => {
    let parsedValue = value;

    // Type conversion
    if (type === 'integer') {
      parsedValue = value === '' ? 0 : parseInt(value, 10);
    } else if (type === 'number') {
      parsedValue = value === '' ? 0 : parseFloat(value);
    } else if (type === 'boolean') {
      parsedValue = value === 'true' || value === true;
    }

    setToolParamInputs(prev => ({ ...prev, [name]: parsedValue }));
  }, []);

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

      const streamUrl = `${process.env.NEXT_PUBLIC_API_URL || "https://forge.api.opentest.live"}/api/discovery/stream`;
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
              MCP Hub
            </h1>
            <p className="text-xs text-zinc-500">
              One server. Everyone&apos;s tools.
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
          <>
            <div
              className="shrink-0 overflow-hidden"
              style={{ width: leftSidebarWidthPx, minWidth: 200, maxWidth: 480 }}
            >
              <DashboardMiddlePanel
                marketplaceSearchResults={marketplaceSearchResults}
                marketplaceChecking={loading && demoStep === "checking"}
                references={references}
                currentTool={currentToolForPanel}
                justCreatedToolId={justCreatedToolId}
                onSelectTool={setCurrentToolForPanel}
              />
            </div>
            <DraggableResizer
              width={leftSidebarWidthPx}
              onResize={setLeftSidebarWidthPx}
              minWidth={200}
              maxWidth={480}
              invert={false}
            />
          </>
        )}
        {/* Main: default = Marketplace center; forge = Code | References split */}
        <main className="scrollbar-hide min-w-0 flex-1 overflow-auto p-6">
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
                    One MCP server. Everyone&apos;s tools.
                  </h2>
                  <p className="mt-2 text-sm text-zinc-500">
                    Add tools once. Everyone with access runs them.
                  </p>
                </div>

                <div className="flex-1 min-h-0">
                  <MarketplaceCenter
                    onSelectTool={(tool) => {
                      setCurrentToolForPanel(tool);
                      setSelectedToolForDrawer(tool);
                    }}
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

            {view === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="scrollbar-hide overflow-y-auto pb-8"
              >
                <SettingsView />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Right sidebar: Conversations (top) + chat (Agent Stream) + input (bottom) when on home */}
        {view === "home" && (
          <>
            <DraggableResizer
              width={rightSidebarWidthPx}
              onResize={setRightSidebarWidthPx}
              minWidth={320}
              maxWidth={500}
              invert={true}
              className="hidden xl:block"
            />
            <aside
              className="hidden shrink-0 flex-col border-l border-zinc-800 xl:flex"
              style={{ width: rightSidebarWidthPx, minWidth: 320, maxWidth: 500 }}
            >
            <div className="shrink-0 border-b border-zinc-800 px-5 py-3">
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
            {/* Chat: streamed messages above input (no section box) */}
            <div className="scrollbar-hide flex-1 min-h-0 overflow-y-auto px-4 py-3 pr-6">
              {lastPrompt && (
                <div className="mb-2 flex justify-end">
                  <div className="max-w-[90%] rounded-2xl rounded-br-md bg-emerald-500/20 px-3 py-2 text-sm text-zinc-100">
                    {lastPrompt}
                  </div>
                </div>
              )}
              {streamingEvents.map((event, idx) => {
                if (event.type === "assistant_message") {
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-2 flex justify-start"
                    >
                      <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-zinc-800/80 px-3 py-2 text-sm text-zinc-200">
                        {event.iteration != null && (
                          <span className="mb-1 block text-[10px] text-zinc-500">Iteration {event.iteration}</span>
                        )}
                        <p className="leading-relaxed">{event.content}</p>
                      </div>
                    </motion.div>
                  );
                }
                if (event.type === "tool_call") {
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-2 flex justify-start"
                    >
                      <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-zinc-700/50 bg-zinc-800/80 px-3 py-2 text-sm">
                        <span className="text-[10px] font-medium text-zinc-400">Calling {event.tool_name}</span>
                        {event.arguments && Object.keys(event.arguments).length > 0 && (
                          <pre className="mt-1 overflow-x-auto rounded bg-zinc-950/50 p-2 text-[10px] text-zinc-400">
                            {JSON.stringify(event.arguments, null, 2)}
                          </pre>
                        )}
                      </div>
                    </motion.div>
                  );
                }
                if (event.type === "tool_result") {
                  const isSuccess = event.status === "success";
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-2 flex justify-start"
                    >
                      <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-zinc-700/50 bg-zinc-800/80 px-3 py-2 text-sm">
                        <span
                          className={`text-[10px] font-medium ${isSuccess ? "text-zinc-400" : "text-red-400"}`}
                        >
                          {event.tool_name} · {event.status}
                        </span>
                        {event.result_preview && (
                          <pre className="mt-1 overflow-x-auto rounded bg-zinc-950/50 p-2 text-[10px] text-zinc-400">
                            {event.result_preview}
                          </pre>
                        )}
                        {event.error && <p className="mt-1 text-[10px] text-red-400">{event.error}</p>}
                      </div>
                    </motion.div>
                  );
                }
                return null;
              })}
            </div>
            <div className="shrink-0 border-t border-zinc-800 px-5 py-4 pr-6">
              <CommandInput onSubmit={handleSubmit} disabled={loading || demoStep === "forging"} />
            </div>
          </aside>
          </>
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

      {/* Tool Details Drawer */}
      <AnimatePresence>
        {selectedToolForDrawer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end bg-black/50"
            onClick={() => setSelectedToolForDrawer(null)}
          >
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.2 }}
              className="flex h-full w-full max-w-3xl flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                <div className="flex items-center gap-2">
                  <FileCode className="h-5 w-5 text-zinc-400" />
                  <h2 className="font-semibold text-zinc-100">Tool Details</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedToolForDrawer(null)}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="terminal-scroll flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Header */}
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-zinc-100">{selectedToolForDrawer.name}</h3>
                        <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{selectedToolForDrawer.description}</p>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-500">
                      {selectedToolForDrawer.category && (
                        <div>
                          <span className="text-zinc-600">Category:</span>{' '}
                          <span className="text-zinc-400">{selectedToolForDrawer.category}</span>
                        </div>
                      )}
                      {selectedToolForDrawer.usage_count !== undefined && (
                        <div>
                          <span className="text-zinc-600">Usage:</span>{' '}
                          <span className="text-zinc-400">{selectedToolForDrawer.usage_count} times</span>
                        </div>
                      )}
                      {selectedToolForDrawer.verified && (
                        <div className="flex items-center gap-1 text-emerald-400">
                          <span>✓</span> Verified
                        </div>
                      )}
                      {selectedToolForDrawer.created_at && (
                        <div>
                          <span className="text-zinc-600">Created:</span>{' '}
                          <span className="text-zinc-400">
                            {new Date(selectedToolForDrawer.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {selectedToolForDrawer.tags && selectedToolForDrawer.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {selectedToolForDrawer.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* API & documentation – all related URLs */}
                  {getToolDocUrls(selectedToolForDrawer).length > 0 && (
                    <div className="rounded-lg border border-blue-800/50 bg-blue-900/10 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Link2 className="h-4 w-4 text-blue-400" />
                        <h4 className="text-sm font-medium text-blue-300">API & documentation</h4>
                      </div>
                      <ul className="space-y-2">
                        {getToolDocUrls(selectedToolForDrawer).map(({ label, url }) => (
                          <li key={url}>
                            <span className="text-xs font-medium text-blue-400/90">{label}</span>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-0.5 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 hover:underline break-all"
                            >
                              {url}
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Preview Snippet */}
                  {selectedToolForDrawer.preview_snippet && (
                    <div className="rounded-lg border border-zinc-700 bg-zinc-900/80 p-4 overflow-hidden">
                      <p className="mb-2 text-xs font-medium text-zinc-500">
                        Function Signature
                      </p>
                      <div className="[&_pre]:!whitespace-pre-wrap [&_pre]:!break-words [&_pre]:!overflow-x-hidden [&_pre]:!text-xs">
                        <SyntaxHighlighter
                          language="python"
                          style={oneDark}
                          wrapLongLines
                          customStyle={{
                            margin: 0,
                            padding: "0.75rem 1rem",
                            background: "rgb(24 24 27)",
                            borderRadius: "0.5rem",
                            fontSize: "0.75rem",
                            lineHeight: 1.6,
                          }}
                          codeTagProps={{ style: { background: "transparent" } }}
                          showLineNumbers={false}
                        >
                          {selectedToolForDrawer.preview_snippet}
                        </SyntaxHighlighter>
                      </div>
                    </div>
                  )}

                  {/* Parameters Schema */}
                  {selectedToolForDrawer.parameters && Object.keys(selectedToolForDrawer.parameters.properties || {}).length > 0 && (
                    <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Code2 className="h-4 w-4 text-zinc-400" />
                        <h4 className="text-sm font-medium text-zinc-300">Parameters</h4>
                      </div>
                      <div className="space-y-3">
                        {Object.entries(selectedToolForDrawer.parameters.properties).map(([name, param]: [string, any]) => (
                          <div key={name} className="border-l-2 border-emerald-800/50 pl-3">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <code className="text-sm font-medium text-emerald-400">{name}</code>
                              <span className="text-xs text-blue-400">{param.type}</span>
                              {selectedToolForDrawer.parameters.required?.includes(name) && (
                                <span className="text-xs text-red-400">required</span>
                              )}
                            </div>
                            {param.description && (
                              <p className="text-xs text-zinc-500">{param.description}</p>
                            )}
                            {param.default !== undefined && (
                              <p className="text-xs text-zinc-500 mt-1">
                                Default: <code className="text-amber-300/90">{JSON.stringify(param.default)}</code>
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Execute Tool Section */}
                  {selectedToolForDrawer.parameters && Object.keys(selectedToolForDrawer.parameters.properties || {}).length > 0 && (
                    <div className="rounded-lg border border-emerald-800/50 bg-emerald-900/10 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="h-4 w-4 text-emerald-400" />
                        <h4 className="text-sm font-medium text-emerald-300">Execute Tool</h4>
                      </div>

                      {/* Parameter Input Form */}
                      <div className="space-y-3 mb-4">
                        {Object.entries(selectedToolForDrawer.parameters.properties).map(([name, param]: [string, any]) => (
                          <div key={name}>
                            <label className="block text-xs font-medium text-zinc-400 mb-1">
                              {name}
                              {selectedToolForDrawer.parameters.required?.includes(name) && (
                                <span className="text-red-400 ml-1">*</span>
                              )}
                            </label>
                            {param.type === 'boolean' ? (
                              <select
                                value={toolParamInputs[name]?.toString() || 'false'}
                                onChange={(e) => handleToolParamChange(name, e.target.value, param.type)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleToolExecute();
                                  }
                                }}
                                className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:border-emerald-500 focus:outline-none"
                              >
                                <option value="false">false</option>
                                <option value="true">true</option>
                              </select>
                            ) : (
                              <input
                                type={param.type === 'integer' || param.type === 'number' ? 'number' : 'text'}
                                value={toolParamInputs[name] ?? ''}
                                onChange={(e) => handleToolParamChange(name, e.target.value, param.type)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleToolExecute();
                                  }
                                }}
                                placeholder={param.description || `Enter ${name}`}
                                className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                              />
                            )}
                            {param.description && (
                              <p className="text-xs text-zinc-600 mt-1">{param.description}</p>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Execute Button */}
                      <button
                        type="button"
                        onClick={handleToolExecute}
                        disabled={toolExecuting}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {toolExecuting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Executing...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            Run Tool
                          </>
                        )}
                      </button>

                      {/* Execution Result */}
                      {toolExecutionResult && (() => {
                        const resultPayload = toolExecutionResult.result;
                        const humanReadable = formatExecutionResultForDisplay(resultPayload);
                        return (
                          <div className="mt-4 rounded-lg border border-emerald-700 bg-emerald-900/20 p-4">
                            <button
                              type="button"
                              onClick={() => setToolResultExpanded((e) => !e)}
                              className="flex w-full items-center justify-between gap-2 text-left"
                            >
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-emerald-400" />
                                <h5 className="text-sm font-medium text-emerald-300">Execution Result</h5>
                              </div>
                              {toolResultExpanded ? (
                                <ChevronUp className="h-4 w-4 shrink-0 text-zinc-500" />
                              ) : (
                                <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500" />
                              )}
                            </button>
                            {toolExecutionResult.execution_metadata && (
                              <div className="mb-2 mt-2 flex flex-wrap gap-3 text-xs text-zinc-400">
                                <div>
                                  Duration: <span className="text-zinc-300">{toolExecutionResult.execution_metadata.duration_ms}ms</span>
                                </div>
                                {toolExecutionResult.execution_metadata.cached && (
                                  <div className="text-blue-400">✓ Cached</div>
                                )}
                                {toolExecutionResult.execution_metadata.api_calls_made !== undefined && (
                                  <div>
                                    API Calls: <span className="text-zinc-300">{toolExecutionResult.execution_metadata.api_calls_made}</span>
                                  </div>
                                )}
                              </div>
                            )}
                            {humanReadable && (
                              <p className="mb-3 text-sm leading-snug text-zinc-200">
                                {humanReadable}
                              </p>
                            )}
                            {toolResultExpanded && (
                              <div className="rounded border border-zinc-800 bg-zinc-950 p-3 overflow-x-auto max-h-80 overflow-y-auto">
                                <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">Raw result</p>
                                <pre className="font-mono text-xs text-zinc-300 whitespace-pre-wrap break-words">
                                  {JSON.stringify(resultPayload, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Execution Error */}
                      {toolExecutionError && (
                        <div className="mt-4 rounded-lg border border-red-700 bg-red-900/20 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <XCircle className="h-4 w-4 text-red-400" />
                            <h5 className="text-sm font-medium text-red-300">Execution Failed</h5>
                          </div>
                          <p className="text-sm text-red-400">{toolExecutionError}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Code Block */}
                  {selectedToolForDrawer.code && (
                    <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 overflow-hidden">
                      <div className="flex items-center gap-2 mb-3">
                        <Code2 className="h-4 w-4 text-zinc-400" />
                        <h4 className="text-sm font-medium text-zinc-300">Source Code</h4>
                        <span className="text-xs text-zinc-500">Python</span>
                      </div>
                      <div className="rounded border border-zinc-800 overflow-hidden [&_pre]:!whitespace-pre-wrap [&_pre]:!break-words [&_pre]:!overflow-x-hidden">
                        <SyntaxHighlighter
                          language="python"
                          style={oneDark}
                          wrapLongLines
                          customStyle={{
                            margin: 0,
                            padding: "1rem",
                            background: "rgb(9 9 11)",
                            borderRadius: "0.375rem",
                            fontSize: "0.75rem",
                            lineHeight: 1.5,
                          }}
                          codeTagProps={{ style: { background: "transparent" } }}
                          showLineNumbers={true}
                        >
                          {selectedToolForDrawer.code}
                        </SyntaxHighlighter>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
