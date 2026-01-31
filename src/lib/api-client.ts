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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
      const error: APIError = await response.json();
      throw new APIClientError(
        error.error.message,
        error.error.code,
        response.status
      );
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

    return await response.json();
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

    return await response.json();
  }

  /**
   * Get specific tool by name
   */
  async getTool(name: string): Promise<EnhancedTool> {
    const response = await fetch(`${this.baseURL}/tools/${name}`);

    if (!response.ok) {
      throw new Error(`Failed to get tool: ${response.statusText}`);
    }

    return await response.json();
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
