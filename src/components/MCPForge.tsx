"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { FileCode, Code2, AlertTriangle, RefreshCw, Send } from "lucide-react";
import { api } from "@/lib/api-client";
import type { ForgeResponse } from "@/types/api";

const MIN_LEFT_PERCENT = 25;
const MAX_LEFT_PERCENT = 45;
const DEFAULT_LEFT_PERCENT = 33;

export function MCPForge({
  onRetry,
  showSelfHeal = false,
}: {
  onRetry?: () => void;
  showSelfHeal?: boolean;
}) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgeData, setForgeData] = useState<ForgeResponse | null>(null);
  const [rightCode, setRightCode] = useState("");
  const [leftPercent, setLeftPercent] = useState(DEFAULT_LEFT_PERCENT);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleResize = useCallback(
    (clientX: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const pct = ((clientX - rect.left) / rect.width) * 100;
      setLeftPercent(Math.min(MAX_LEFT_PERCENT, Math.max(MIN_LEFT_PERCENT, pct)));
    },
    []
  );

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => handleResize(e.clientX);
    const onUp = () => setIsDragging(false);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, handleResize]);

  // Typewriter effect for generated code
  useEffect(() => {
    if (!forgeData?.generated_code.typescript) {
      setRightCode("");
      return;
    }

    let i = 0;
    const full = forgeData.generated_code.typescript;
    const interval = setInterval(() => {
      setRightCode(full.slice(0, i));
      i += 2;
      if (i >= full.length) clearInterval(interval);
    }, 20);
    return () => clearInterval(interval);
  }, [forgeData]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || loading) return;

    setLoading(true);
    setError(null);
    setForgeData(null);
    setRightCode("");

    try {
      const response = await api.forgeGenerate({
        source_url: url,
        force_regenerate: false,
      });

      setForgeData(response);
    } catch (err) {
      console.error('Forge generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate tool');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* URL Input Form */}
      <form onSubmit={handleGenerate} className="border-b border-zinc-800 p-4">
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://api.example.com/docs"
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/80 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-500"
            disabled={loading}
            required
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Generate Tool
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-4 rounded-lg border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Split Pane */}
      <motion.div
        className="flex h-full flex-col border-t border-zinc-800 bg-zinc-950/90 md:flex-row flex-1 min-h-0"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div ref={containerRef} className="flex h-full min-h-0 w-full flex-col md:flex-row md:flex-1 md:min-w-0">
          {/* Left: Raw docs (rendered Markdown) */}
          <div
            className="forge-left-panel flex min-w-0 flex-col bg-[var(--forge-left)] md:shrink-0"
            style={
              { "--left-pct": `${leftPercent}%` } as React.CSSProperties & { "--left-pct": string }
            }
          >
            <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-2">
              <FileCode className="h-4 w-4 text-blue-400" />
              <span className="font-medium text-zinc-300">Raw documentation</span>
              {forgeData && (
                <span className="ml-auto text-xs text-zinc-500">
                  {forgeData.documentation.endpoints_found} endpoints
                </span>
              )}
            </div>
            <div className="docs-markdown terminal-scroll flex-1 overflow-y-auto overflow-x-hidden p-4">
              {!forgeData && !loading && (
                <p className="text-center text-sm text-zinc-500 py-8">
                  Enter an API documentation URL above to generate an MCP tool
                </p>
              )}
              {loading && (
                <p className="text-center text-sm text-zinc-500 py-8">
                  Crawling documentation...
                </p>
              )}
              {forgeData && (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="mb-3 mt-0 border-b border-zinc-700 pb-2 text-lg font-semibold text-zinc-100">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="mb-2 mt-4 text-base font-semibold text-zinc-200">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="mb-1.5 mt-3 text-sm font-medium text-blue-300">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="mb-2 text-sm leading-relaxed text-zinc-400">
                        {children}
                      </p>
                    ),
                    code: ({ className, children }) => {
                      const isBlock = className?.includes("language-");
                      if (isBlock) {
                        return (
                          <div className="docs-code-block my-2 overflow-x-auto rounded-lg border border-zinc-700 bg-zinc-900/80">
                            <pre className="p-3 font-mono text-[0.7rem] leading-relaxed text-zinc-300">
                              <code>{String(children).replace(/\n$/, "")}</code>
                            </pre>
                          </div>
                        );
                      }
                      return (
                        <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[0.7rem] text-blue-300">
                          {children}
                        </code>
                      );
                    },
                    table: ({ children }) => (
                      <div className="my-2 overflow-x-auto rounded-lg border border-zinc-700">
                        <table className="min-w-full text-xs">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="bg-zinc-800/50">
                        {children}
                      </thead>
                    ),
                    th: ({ children }) => (
                      <th className="border-b border-zinc-700 px-3 py-1.5 text-left font-medium text-zinc-300">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border-b border-zinc-800 px-3 py-1.5 text-zinc-400">
                        {children}
                      </td>
                    ),
                  }}
                >
                  {forgeData.documentation.markdown}
                </ReactMarkdown>
              )}
            </div>
          </div>

          {/* Resize Handle */}
          <div
            className="hidden md:block w-1 cursor-col-resize bg-zinc-800 hover:bg-zinc-700 transition-colors"
            onMouseDown={() => setIsDragging(true)}
          />

          {/* Right: Generated TypeScript */}
          <div className="flex flex-1 min-w-0 flex-col bg-[var(--forge-right)]">
            <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-2">
              <Code2 className="h-4 w-4 text-purple-400" />
              <span className="font-medium text-zinc-300">Generated MCP tool</span>
              {forgeData && (
                <span className="ml-auto text-xs text-zinc-500">
                  {forgeData.metadata.generation_time_ms}ms
                </span>
              )}
            </div>
            <div className="terminal-scroll flex-1 overflow-y-auto overflow-x-hidden font-mono text-[0.7rem]">
              {!forgeData && !loading && (
                <p className="text-center text-sm text-zinc-500 py-8">
                  Generated code will appear here
                </p>
              )}
              {loading && (
                <p className="text-center text-sm text-zinc-500 py-8">
                  Generating tool code...
                </p>
              )}
              {forgeData && (
                <SyntaxHighlighter
                  language="typescript"
                  style={oneDark}
                  customStyle={{
                    margin: 0,
                    padding: "1rem",
                    background: "transparent",
                    fontSize: "0.7rem",
                  }}
                  showLineNumbers
                >
                  {rightCode}
                </SyntaxHighlighter>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
