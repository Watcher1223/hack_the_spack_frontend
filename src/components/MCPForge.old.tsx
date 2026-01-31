"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { FileCode, Code2, AlertTriangle, RefreshCw } from "lucide-react";

const SAMPLE_MARKDOWN = `# OpenWeatherMap API

## Current Weather
\`GET /data/2.5/weather\`

### Parameters
| Name   | Type   | Required | Description        |
|--------|--------|----------|--------------------|
| q      | string | Yes      | City name          |
| appid  | string | Yes      | API key            |
| units  | string | No       | metric \| imperial |

### Response
\`\`\`json
{
  "main": { "temp": 285.5, "humidity": 72 },
  "weather": [{ "description": "clear sky" }]
}
\`\`\`
`;

const GENERATED_TS = `// Auto-generated MCP tool from API docs
import { z } from "zod";

export const get_current_weather = {
  name: "get_current_weather",
  description: "Get current weather for a city",
  parameters: z.object({
    q: z.string().describe("City name"),
    units: z.enum(["metric", "imperial"]).optional(),
  }),
  execute: async (params: { q: string; units?: string }) => {
    const res = await fetch(
      \`https://api.openweathermap.org/data/2.5/weather?q=\${params.q}&units=\${params.units ?? "metric"}&appid=\${process.env.OPENWEATHER_API_KEY}\`
    );
    return res.json();
  },
};
`;

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
  const [rightCode, setRightCode] = useState("");
  const [isHealing, setIsHealing] = useState(false);
  const [healMessage, setHealMessage] = useState("");
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

  useEffect(() => {
    let i = 0;
    const full = GENERATED_TS;
    const interval = setInterval(() => {
      setRightCode(full.slice(0, i));
      i += 2;
      if (i >= full.length) clearInterval(interval);
    }, 20);
    return () => clearInterval(interval);
  }, [showSelfHeal]);

  const triggerSelfHeal = () => {
    setIsHealing(true);
    setHealMessage("Retrying with new context...");
    setRightCode("");
    setTimeout(() => {
      let i = 0;
      const full = GENERATED_TS.replace("optional()", "default(\"metric\")");
      const iv = setInterval(() => {
        setRightCode(full.slice(0, i));
        i += 2;
        if (i >= full.length) {
          clearInterval(iv);
          setHealMessage("");
          setIsHealing(false);
          onRetry?.();
        }
      }, 15);
    }, 800);
  };

  return (
    <motion.div
      className="flex h-full flex-col border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950/90 md:flex-row"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div ref={containerRef} className="flex h-full min-h-0 w-full flex-col md:flex-row md:flex-1 md:min-w-0" aria-hidden>
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
        </div>
        <div className="docs-markdown terminal-scroll flex-1 overflow-y-auto overflow-x-hidden p-4">
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
              code: ({ className, children, ...props }) => {
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
                  <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-amber-300" {...props}>
                    {children}
                  </code>
                );
              },
              pre: ({ children }) => <>{children}</>,
              table: ({ children }) => (
                <div className="my-3 overflow-x-auto rounded-lg border border-zinc-700">
                  <table className="w-full min-w-[240px] border-collapse text-xs">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-zinc-800/80 text-zinc-300">{children}</thead>
              ),
              th: ({ children }) => (
                <th className="border-b border-zinc-600 px-3 py-2 text-left font-medium">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border-b border-zinc-800 px-3 py-2 text-zinc-400">
                  {children}
                </td>
              ),
              tr: ({ children }) => (
                <tr className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/40">
                  {children}
                </tr>
              ),
              ul: ({ children }) => (
                <ul className="my-2 list-inside list-disc space-y-0.5 text-sm text-zinc-400">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="my-2 list-inside list-decimal space-y-0.5 text-sm text-zinc-400">
                  {children}
                </ol>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-zinc-300">{children}</strong>
              ),
            }}
          >
            {SAMPLE_MARKDOWN}
          </ReactMarkdown>
        </div>
      </div>

      {/* Resizable divider (md+) - wider hit area so it's easy to grab */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={leftPercent}
        aria-valuemin={MIN_LEFT_PERCENT}
        aria-valuemax={MAX_LEFT_PERCENT}
        className="forge-resizer relative z-10 hidden shrink-0 cursor-col-resize border-x border-zinc-600 bg-zinc-700/60 md:block md:w-2 hover:bg-zinc-600 active:bg-zinc-500"
        style={{ touchAction: "none", minWidth: 0 }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
      />

      {/* Right: Generated MCP code */}
      <div
        className={`flex min-w-0 flex-1 flex-col bg-[var(--forge-right)] ${isHealing ? "self-heal-flash" : ""}`}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-emerald-400" />
            <span className="font-medium text-zinc-300">Generated MCP (TypeScript)</span>
          </div>
          {showSelfHeal && (
            <button
              type="button"
              onClick={triggerSelfHeal}
              className="flex items-center gap-1 rounded border border-red-500/50 bg-red-500/10 px-2 py-1 text-xs text-red-400 hover:bg-red-500/20"
            >
              <AlertTriangle className="h-3 w-3" />
              Simulate failure
            </button>
          )}
        </div>
        {healMessage && (
          <div className="flex items-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-amber-400">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">{healMessage}</span>
          </div>
        )}
        <div className="scrollbar-hide flex-1 min-h-0 overflow-auto p-4">
          <SyntaxHighlighter
            language="typescript"
            style={oneDark}
            showLineNumbers={false}
            customStyle={{
              margin: 0,
              padding: "0.75rem 0",
              background: "transparent",
              fontSize: "0.75rem",
              lineHeight: 1.6,
              overflowX: "auto",
              overflowY: "visible",
            }}
            codeTagProps={{
              className: "font-mono text-xs",
              style: { background: "transparent" },
            }}
          >
            {rightCode}
          </SyntaxHighlighter>
          <span className="log-cursor inline-block h-4 w-0.5 bg-emerald-400 align-middle" aria-hidden />
        </div>
      </div>
      </div>
    </motion.div>
  );
}
