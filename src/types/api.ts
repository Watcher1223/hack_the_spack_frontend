// ============================================
// Enhanced API Types for Backend v2.0
// ============================================

/** Workflow step in agent execution */
export interface WorkflowStep {
  step: 'checking' | 'discovering' | 'forging' | 'done';
  status: 'completed' | 'failed';
  duration_ms: number;
  message: string;
}

/** Tool call with execution results */
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result: Record<string, any> | null;
  execution_time_ms: number;
  status: 'success' | 'error';
}

/** Action log entry for action feed */
export interface ActionLog {
  id: string;
  title: string;
  detail: string;
  status: 'success' | 'pending' | 'error';
  timestamp: string;
  github_pr_url?: string;
  tool_name?: string;
  execution_id?: string;
}

/** Chat response metadata */
export interface ChatMetadata {
  total_duration_ms: number;
  tokens_used: number;
  cost_usd: number;
}

/** Enhanced chat request */
export interface ChatRequest {
  message: string;
  conversation_id?: string;
  model?: string;
  stream?: boolean;
  context?: {
    ui_mode?: string;
    view?: string;
  };
}

/** Enhanced chat response with workflow tracking */
export interface ChatResponse {
  success: boolean;
  response: string;
  conversation_id: string;
  model: string;
  workflow_steps: WorkflowStep[];
  tool_calls: ToolCall[];
  actions_logged: ActionLog[];
  metadata: ChatMetadata;
}

/** Enhanced tool with UI fields */
export interface EnhancedTool {
  id: string;
  name: string;
  description: string;
  status: 'PROD-READY' | 'BETA' | 'DEPRECATED';
  source_url?: string;
  preview_snippet?: string;
  category: string;
  tags: string[];
  verified: boolean;
  usage_count: number;
  mux_playback_id?: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  code?: string;
  created_at?: string;
  similarity_score?: number;
}

/** Discovery log entry for SSE streaming */
export interface DiscoveryLog {
  id?: string;
  timestamp: string;
  source: 'firecrawl' | 'mcp' | 'agent' | 'system';
  message: string;
  level: 'info' | 'success' | 'error' | 'warning';
  metadata?: Record<string, any>;
}

/** Tool execution response */
export interface ToolExecuteResponse {
  success: boolean;
  tool_name: string;
  execution_id: string;
  result: Record<string, any>;
  execution_metadata: {
    started_at: string;
    completed_at: string;
    duration_ms: number;
    api_calls_made: number;
    cached: boolean;
  };
  logs: Array<{
    timestamp: string;
    message: string;
  }>;
}

/** Forge generation request */
export interface ForgeRequest {
  source_url: string;
  force_regenerate?: boolean;
}

/** Forge generation response */
export interface ForgeResponse {
  success: boolean;
  tool_id: string;
  documentation: {
    markdown: string;
    endpoints_found: number;
    auth_params: string[];
    base_url: string;
  };
  generated_code: {
    typescript: string;
    language: string;
    framework: string;
  };
  discovery_logs: DiscoveryLog[];
  metadata: {
    generation_time_ms: number;
    firecrawl_pages_crawled: number;
    tokens_used: number;
  };
}

/** Action from action feed */
export interface Action {
  id: string;
  conversation_id?: string;
  title: string;
  detail: string;
  status: 'success' | 'pending' | 'error';
  timestamp: string;
  github_pr_url?: string;
  tool_name?: string;
  execution_id?: string;
}

/** Verified tool with governance */
export interface VerifiedTool extends EnhancedTool {
  verification: {
    verified: boolean;
    verified_at: string;
    verified_by: string;
    trust_score: number;
    security_scan_passed: boolean;
    last_audit: string;
  };
  governance: {
    approval_required: boolean;
    allowed_users: string[];
    rate_limit_per_minute: number;
    cost_per_execution: number;
  };
}

/** Error response */
export interface APIError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}
