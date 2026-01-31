export type ViewMode = "home" | "ledger" | "api";

export type ToolStatus = "UNVERIFIED" | "SANDBOXED" | "PROD-READY";

export interface VerifiedCapability {
  id: string;
  name: string;
  description: string;
  status: ToolStatus;
  sourceUrl?: string;
  muxPlaybackId?: string;
  createdAt: string;
  /** Optional snippet for marketplace preview (e.g. MCP tool name or params) */
  previewSnippet?: string;
}

export interface ActionFeedItem {
  id: string;
  title: string;
  detail: string;
  status: "success" | "pending" | "failed";
  timestamp: string;
  githubPrUrl?: string;
  icon?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  source: "firecrawl" | "mcp" | "agent" | "system";
  message: string;
  level?: "info" | "warn" | "error";
}
