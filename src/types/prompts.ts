export interface Prompt {
  id: string;
  name: string;
  description: string;
  command: string;
  prompt: string;
  tags?: string[];
  category: 'general' | 'code' | 'image' | 'summary';
  metadata?: {
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  position?: number;
}

export interface PromptExecutionResult {
  content: string;
  success: boolean;
  error?: string;
  metadata?: {
    type: string;
    [key: string]: any;
  };
  // Search-specific properties
  isSearchResult?: boolean;
  searchQuery?: string;
  searchResults?: SearchResult[];
}

export interface PromptHistory {
  id: string;
  command: string;
  result: PromptExecutionResult;
  timestamp: string;
  userId: string;
}

export interface PromptCommand {
  command: string;
  args: string;
  prompt: Prompt;
}

export type SavedPrompt = Omit<Prompt, 'category' | 'metadata'>;

export interface PromptVariable {
  name: string;
  value: string;
}

export interface PromptExecutionContext {
  variables: PromptVariable[];
  systemMessage?: string;
  temperature?: number;
  maxTokens?: number;
}

// Helper type for prompt templates
export type PromptTemplate = (context: PromptExecutionContext) => string;

// Helper type for prompt processors
export type PromptProcessor = (prompt: string) => ProcessedPrompt;

// Helper type for variable extractors
export type VariableExtractor = (text: string) => string[]; 