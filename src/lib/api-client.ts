import type {
  ChatRequest,
  ChatResponse,
  EnhancedTool,
  ToolExecuteResponse,
  ForgeRequest,
  ForgeResponse,
  Action,
  VerifiedTool,
  APIError,
  DiscoveryLog
} from '@/types/api';

/** Universal Adapter API 2.0.0 — OAS 3.1, AI agent with tool marketplace and governance. See /openapi.json on the backend. */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export class UniversalAdapterAPI {
  private baseURL: string;

  constructor(baseURL: string = API_BASE) {
    this.baseURL = baseURL;
  }

  // ============================================
  // Chat & Agent
  // ============================================

  /**
   * Send message to agent with enhanced workflow tracking
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${this.baseURL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      let errMsg = response.statusText;
      try {
        const body = await response.json();
        if (body?.error?.message) errMsg = body.error.message;
      } catch {
        // ignore
      }
      throw new APIClientError(errMsg, 'CHAT_ERROR', response.status);
    }

    return await response.json();
  }

  // ============================================
  // Discovery Stream (SSE)
  // ============================================

  /**
   * Open Server-Sent Events connection for discovery logs
   */
  openDiscoveryStream(
    conversationId?: string,
    onMessage?: (log: DiscoveryLog) => void,
    onDone?: () => void,
    onError?: (error: Error) => void
  ): EventSource {
    const url = conversationId
      ? `${this.baseURL}/api/discovery/stream?conversation_id=${conversationId}`
      : `${this.baseURL}/api/discovery/stream`;

    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      if (event.data === '[DONE]') {
        eventSource.close();
        onDone?.();
        return;
      }

      try {
        const log: DiscoveryLog = JSON.parse(event.data);
        onMessage?.(log);
      } catch (error) {
        console.error('Failed to parse discovery log:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Discovery stream error:', error);
      onError?.(new Error('Discovery stream connection failed'));
      eventSource.close();
    };

    return eventSource;
  }

  // ============================================
  // Tools
  // ============================================

  /** Normalize backend tool shape to EnhancedTool (id, created_at, status, etc.) */
  private normalizeTool(t: Record<string, unknown>): EnhancedTool {
    const id = t._id != null ? String(t._id) : t.id != null ? String(t.id) : t.name != null ? String(t.name) : '';
    const params = t.parameters && typeof t.parameters === 'object'
      ? (t.parameters as EnhancedTool['parameters'])
      : { type: 'object' as const, properties: {} as Record<string, unknown> };
    return {
      id,
      name: t.name != null ? String(t.name) : 'unknown',
      description: t.description != null ? String(t.description) : '',
      status: (t.status === 'BETA' || t.status === 'DEPRECATED' ? t.status : 'PROD-READY') as EnhancedTool['status'],
      category: t.category != null ? String(t.category) : 'general',
      tags: Array.isArray(t.tags) ? (t.tags as string[]) : [],
      verified: Boolean(t.verified),
      usage_count: typeof t.usage_count === 'number' ? t.usage_count : 0,
      parameters: params,
      preview_snippet: t.preview_snippet != null ? String(t.preview_snippet) : undefined,
      code: t.code != null ? String(t.code) : undefined,
      created_at: t.created_at != null ? String(t.created_at) : undefined,
      source_url: t.source_url != null ? String(t.source_url) : undefined,
      mux_playback_id: t.mux_playback_id != null ? String(t.mux_playback_id) : undefined,
      similarity_score: typeof t.similarity_score === 'number' ? t.similarity_score : undefined,
    };
  }

  /**
   * List all tools with enhanced UI fields
   */
  async listTools(limit = 50, skip = 0): Promise<EnhancedTool[]> {
    const response = await fetch(
      `${this.baseURL}/tools?limit=${limit}&skip=${skip}`
    );

    if (!response.ok) {
      throw new Error(`Failed to list tools: ${response.statusText}`);
    }

    const data = await response.json();
    const raw = Array.isArray(data) ? data : (data.tools ?? []);
    return raw.map((t: Record<string, unknown>) => this.normalizeTool(t));
  }

  /**
   * Search tools semantically
   */
  async searchTools(query: string, limit = 10): Promise<{
    query: string;
    count: number;
    tools: EnhancedTool[];
  }> {
    const response = await fetch(
      `${this.baseURL}/tools/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`Failed to search tools: ${response.statusText}`);
    }

    const data = await response.json();
    const tools = (data.tools ?? []).map((t: Record<string, unknown>) => this.normalizeTool(t));
    return { query: data.query ?? query, count: data.count ?? tools.length, tools };
  }

  /**
   * Get specific tool by name
   */
  async getTool(name: string): Promise<EnhancedTool> {
    const response = await fetch(`${this.baseURL}/tools/${encodeURIComponent(name)}`);

    if (!response.ok) {
      throw new Error(`Failed to get tool: ${response.statusText}`);
    }

    const data = await response.json();
    const tool = data.tool ?? data;
    return this.normalizeTool(typeof tool === 'object' && tool !== null ? tool : { name });
  }

  /**
   * Get generated tool code (for display in MCP Forge / code block).
   * GET /tools/{name}/code per API docs.
   */
  async getToolCode(toolName: string): Promise<{
    success: boolean;
    name: string;
    description: string;
    parameters?: Record<string, unknown>;
    code: string;
    language: string;
    preview_snippet?: string;
    created_at?: string;
  }> {
    const response = await fetch(`${this.baseURL}/tools/${encodeURIComponent(toolName)}/code`);
    if (!response.ok) {
      if (response.status === 404) throw new Error(`Tool or code not found: ${toolName}`);
      throw new Error(`Failed to get tool code: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Delete a tool
   */
  async deleteTool(name: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseURL}/tools/${name}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete tool: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Execute a tool with parameters
   */
  async executeTool(
    toolName: string,
    params: Record<string, any>
  ): Promise<ToolExecuteResponse> {
    const response = await fetch(`${this.baseURL}/tools/${toolName}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Failed to execute tool: ${response.statusText}`);
    }

    return await response.json();
  }

  // ============================================
  // Forge (Tool Generation)
  // ============================================

  /**
   * Generate MCP tool from API documentation URL
   */
  async forgeGenerate(request: ForgeRequest): Promise<ForgeResponse> {
    const response = await fetch(`${this.baseURL}/api/forge/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate tool: ${response.statusText}`);
    }

    return await response.json();
  }

  // ============================================
  // Actions
  // ============================================

  /**
   * Get action feed with optional conversation filter
   */
  async getActions(
    conversationId?: string,
    limit = 50,
    offset = 0
  ): Promise<Action[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (conversationId) {
      params.append('conversation_id', conversationId);
    }

    const response = await fetch(`${this.baseURL}/api/actions?${params}`);

    if (!response.ok) {
      throw new Error(`Failed to get actions: ${response.statusText}`);
    }

    return await response.json();
  }

  // ============================================
  // Governance
  // ============================================

  /**
   * Get verified tools with governance metadata
   */
  async getVerifiedTools(): Promise<VerifiedTool[]> {
    const response = await fetch(`${this.baseURL}/api/governance/verified-tools`);

    if (!response.ok) {
      throw new Error(`Failed to get verified tools: ${response.statusText}`);
    }

    return await response.json();
  }

  // ============================================
  // Health Check
  // ============================================

  async healthCheck(): Promise<{
    status: string;
    service: string;
    version: string;
  }> {
    const response = await fetch(`${this.baseURL}/health`);

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    return await response.json();
  }
}

/** Custom API error class */
export class APIClientError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number
  ) {
    super(message);
    this.name = 'APIClientError';
  }
}

/** Singleton API client instance */
export const api = new UniversalAdapterAPI();
