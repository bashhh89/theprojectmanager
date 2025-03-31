/**
 * AnythingLLM API Client
 * 
 * This client handles interactions with the AnythingLLM API, providing
 * methods for workspace management, document handling, and chat functionality.
 */

// Define types for the AnythingLLM API
interface AnythingLLMWorkspace {
  id: string;
  slug: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface DocumentUploadResult {
  success: boolean;
  message: string;
  documents?: {
    id: string;
    name: string;
    size: number;
    type: string;
    tokens: number;
  }[];
}

interface ChatResponse {
  success: boolean;
  message: string;
  response: string;
}

class AnythingLLMClient {
  private baseUrl: string;
  private apiKey: string;

  /**
   * Create a new AnythingLLM API client
   * @param baseUrl - The base URL of the AnythingLLM instance
   * @param apiKey - The API key for authentication
   */
  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Make an API request to AnythingLLM
   * @param endpoint - The API endpoint
   * @param method - The HTTP method to use
   * @param data - The data to send in the request body
   * @returns The API response
   * @private
   */
  private async _makeRequest(endpoint: string, method: string = 'GET', data: any = null): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
    
    const options: RequestInit = {
      method,
      headers,
      body: data ? JSON.stringify(data) : null
    };
    
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`AnythingLLM API request failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`AnythingLLM API request failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Create a new workspace
   * @param name - The name of the workspace
   * @param options - Additional workspace options
   * @returns The created workspace
   */
  async createWorkspace(name: string, options: {
    similarityThreshold?: number;
    openAiHistory?: number;
  } = {}): Promise<AnythingLLMWorkspace> {
    const data = {
      name,
      similarityThreshold: options.similarityThreshold || 0.7,
      openAiHistory: options.openAiHistory || 20
    };
    
    return this._makeRequest('/v1/workspace/new', 'POST', data);
  }

  /**
   * Get a workspace by slug
   * @param slug - The workspace slug
   * @returns The workspace
   */
  async getWorkspace(slug: string): Promise<AnythingLLMWorkspace> {
    return this._makeRequest(`/v1/workspace/${slug}`);
  }

  /**
   * Upload a document to a workspace
   * @param workspaceSlug - The workspace slug
   * @param file - The file to upload
   * @returns The upload result
   */
  async uploadDocument(workspaceSlug: string, file: File): Promise<DocumentUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    
    const url = `${this.baseUrl}/v1/document/upload/${workspaceSlug}`;
    
    const headers: HeadersInit = {
      'Authorization': `Bearer ${this.apiKey}`,
      // Don't set Content-Type - browser will set it with boundary
    };
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Document upload failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Document upload failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Send a chat message to a workspace
   * @param workspaceSlug - The workspace slug
   * @param message - The message to send
   * @param options - Additional chat options
   * @returns The chat response
   */
  async chat(workspaceSlug: string, message: string, options: {
    mode?: 'chat' | 'query';
  } = {}): Promise<ChatResponse> {
    const data = {
      message,
      mode: options.mode || 'chat'
    };
    
    return this._makeRequest(`/v1/workspace/${workspaceSlug}/chat`, 'POST', data);
  }

  /**
   * Get a streaming chat response from a workspace
   * @param workspaceSlug - The workspace slug
   * @param message - The message to send
   * @param options - Additional chat options
   * @returns The streaming response
   */
  async streamChat(workspaceSlug: string, message: string, options: {
    mode?: 'chat' | 'query';
    onResponse?: (chunk: string) => void;
  } = {}): Promise<ReadableStream<Uint8Array> | null> {
    const url = `${this.baseUrl}/v1/workspace/${workspaceSlug}/stream-chat`;
    
    const headers: HeadersInit = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
    
    const data = {
      message,
      mode: options.mode || 'chat'
    };
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Stream chat failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }
      
      return response.body;
    } catch (error) {
      console.error(`Stream chat failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Validate the API key by making a test request
   * @returns Whether the API key is valid
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this._makeRequest('/v1/system/health');
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default AnythingLLMClient; 