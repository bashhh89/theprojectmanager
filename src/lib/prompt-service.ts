import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import {
  Prompt,
  PromptCommand,
  PromptExecutionContext,
  PromptExecutionResult,
  PromptHistory,
  PromptVariable,
  SavedPrompt
} from '@/types/prompts'
import {
  processPrompt,
  validatePromptTemplate,
  parseCommand,
  createExecutionContext
} from './prompt-utils'
import { useChatStore } from '@/store/chatStore'
import { Message } from '@/store/chatStore'

// Define default prompts
const defaultPrompts: SavedPrompt[] = [
  {
    id: 'imagegen',
    name: 'Image Generator',
    command: 'imagegen',
    description: 'Generate an image based on a description',
    prompt: `You are now operating in a system that requires specific response formatting to maintain stability and avoid errors. Please adhere to the following guidelines for all responses:

Provide complete, well-structured responses.
Avoid unexpected metadata or non-standard formatting characters.
Limit special characters, Unicode symbols, and non-ASCII characters.
Exclude system messages, tags, or delimiters from your output.
Start and end your response cleanly without trailing spaces or line breaks.
Structure paragraphs with standard spacing (single line breaks).
Properly close all formatting tags if used.
Keep responses concise and complete.
When generating images, follow this format:

![Generated Image](https://image.pollinations.ai/prompt/{description}?width=1280&height=1024&nologo=true)
Do NOT include seed parameter unless requested.
Image quality settings are mandatory:
width=1280
height=1024
nologo=true
For URLs:
Convert spaces to %20
Remove special characters
Keep prompts descriptive and detailed
Include the full parameters string: ?width=1280&height=1024&nologo=true
Detail prompts by including:
Subject details
Setting/background information
Lighting conditions
Style keywords
Mood/atmosphere descriptors
Effective style keywords include cinematic lighting, hyperrealistic, highly detailed, professional photography, 8k uhd, sharp focus, dramatic lighting, and studio quality.

Generate an image of: [description]`,
    tags: ['image', 'creative', 'generation'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'image',
    name: 'Quick Image',
    command: 'image',
    description: 'Quickly generate an image',
    prompt: 'Generate an image of [description]',
    tags: ['creative'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'summarize',
    name: 'Summarize',
    command: 'summarize',
    description: 'Summarize text into bullet points',
    prompt: 'Summarize the following text in bullet points: [text]',
    tags: ['productivity'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'code',
    name: 'Code Generator',
    command: 'code',
    description: 'Generate code in a specific language',
    prompt: 'Write [language] code for [description]',
    tags: ['development'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'explain',
    name: 'Explain',
    command: 'explain',
    description: 'Get a simple explanation of a concept',
    prompt: 'Explain [concept] in simple terms as if I were a beginner',
    tags: ['learning'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'translate',
    name: 'Translate',
    command: 'translate',
    description: 'Translate text to another language',
    prompt: 'Translate the following to [language]: [text]',
    tags: ['language'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'search',
    name: 'Web Search',
    command: 'search',
    description: 'Search the web for current information',
    prompt: 'Search the web for: [query]',
    tags: ['research', 'web'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

interface PromptState {
  prompts: SavedPrompt[]
  history: PromptHistory[]
  isLoading: boolean
  error: string | null
  addPrompt: (prompt: Omit<SavedPrompt, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updatePrompt: (id: string, prompt: Partial<SavedPrompt>) => Promise<void>
  deletePrompt: (id: string) => Promise<void>
  getPromptByCommand: (command: string) => SavedPrompt | undefined
  executeCommand: (command: string) => Promise<PromptExecutionResult>
  clearHistory: () => void
}

export const usePromptStore = create<PromptState>()(
  persist(
    (set, get) => ({
      prompts: defaultPrompts,
      history: [],
      isLoading: false,
      error: null,

      addPrompt: async (promptData) => {
        try {
          set({ isLoading: true, error: null })
          const newPrompt: SavedPrompt = {
            ...promptData,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          set((state) => ({ prompts: [...state.prompts, newPrompt] }))
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to add prompt' })
          throw error
        } finally {
          set({ isLoading: false })
        }
      },

      updatePrompt: async (id, promptData) => {
        try {
          set({ isLoading: true, error: null })
          set((state) => ({
            prompts: state.prompts.map(prompt =>
              prompt.id === id
                ? { ...prompt, ...promptData, updatedAt: new Date().toISOString() }
                : prompt
            )
          }))
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update prompt' })
          throw error
        } finally {
          set({ isLoading: false })
        }
      },

      deletePrompt: async (id) => {
        try {
          set({ isLoading: true, error: null })
          set((state) => ({
            prompts: state.prompts.filter(prompt => prompt.id !== id)
          }))
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete prompt' })
          throw error
        } finally {
          set({ isLoading: false })
        }
      },

      getPromptByCommand: (command) => {
        return get().prompts.find(p => p.command === command)
      },

      executeCommand: async (commandStr) => {
        try {
          set({ isLoading: true, error: null })
          
          const command = parseCommand(commandStr, get().prompts)
          if (!command) {
            const errorResult: PromptExecutionResult = {
              content: 'Invalid command format or prompt not found',
              success: false,
              error: 'Invalid command format or prompt not found'
            }
            set({ error: errorResult.error })
            return errorResult
          }

          const context = createExecutionContext([
            { name: 'content', value: command.args }
          ])

          const result = await executePrompt(command.prompt.prompt, context)
          
          // Add to history
          const historyEntry: PromptHistory = {
            id: uuidv4(),
            command: commandStr,
            result,
            timestamp: new Date().toISOString(),
            userId: 'default' // Replace with actual user ID when auth is implemented
          }

          set((state) => ({
            history: [...state.history, historyEntry]
          }))

          return result
        } catch (error) {
          const errorResult: PromptExecutionResult = {
            content: error instanceof Error ? error.message : 'Unknown error occurred',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          }
          set({ error: errorResult.error })
          return errorResult
        } finally {
          set({ isLoading: false })
        }
      },

      clearHistory: () => {
        set({ history: [] })
      }
    }),
    {
      name: 'prompt-store',
      skipHydration: true
    }
  )
)

/**
 * Executes a prompt with the given context or command
 */
export const executePrompt = async (
  input: string | PromptCommand,
  context?: PromptExecutionContext
): Promise<PromptExecutionResult> => {
  try {
    if (typeof input === 'string') {
      // Handle string template case
      if (!context) {
        throw new Error('Context is required when executing prompt with template string');
      }

      // Validate the prompt template
      if (!validatePromptTemplate(input)) {
        throw new Error('Invalid prompt template');
      }

      // Process the prompt template with variables
      const processed = processPrompt(input, context.variables);

      // Return the processed content
      return {
        content: processed.content,
        success: true,
        metadata: {
          type: 'text',
          variables: processed.variables,
          temperature: context.temperature,
          maxTokens: context.maxTokens
        }
      };
    } else {
      // Handle PromptCommand case
      const { prompt } = input;
      const processedTemplate = input.args ? prompt.prompt.replace(/\[text\]/g, input.args) : prompt.prompt;

      // Execute the prompt based on its category
      switch (prompt.category) {
        case 'image':
          return await handleImageGeneration(processedTemplate);
        case 'code':
          return await handleCodeGeneration(processedTemplate);
        case 'summary':
          return await handleSummaryGeneration(processedTemplate);
        default:
          return await handleTextGeneration(processedTemplate);
      }
    }
  } catch (error) {
    return {
      content: error instanceof Error ? error.message : 'Failed to execute prompt',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute prompt'
    };
  }
};

// Function to process a message with prompt commands
export const processMessageWithPrompts = (message: string): string => {
  // Check if message starts with a command
  if (!message.startsWith('/')) return message
  
  // Extract command and parameters
  const parts = message.trim().split(' ')
  const commandStr = parts[0].substring(1) // Remove the leading slash
  
  // Look up the command
  const promptStore = usePromptStore.getState()
  const promptCmd = promptStore.getPromptByCommand(commandStr)
  
  if (!promptCmd) return message // Command not found
  
  // Replace placeholders with remaining text if any
  let fullPrompt = promptCmd.prompt
  const remainingText = parts.slice(1).join(' ').trim()
  
  // Replace placeholders in the format [placeholder]
  const placeholders = fullPrompt.match(/\[(.*?)\]/g) || []
  
  // If there are placeholders and remaining text
  if (placeholders.length > 0 && remainingText) {
    // Try to intelligently map the remaining text to placeholders
    fullPrompt = fullPrompt.replace(/\[(.*?)\]/g, remainingText)
  }
  
  return fullPrompt
}

// Define command handlers
type CommandHandler = (args: Record<string, string>, content: string) => Promise<PromptExecutionResult>;

const commandHandlers: Record<string, CommandHandler> = {
  // Image generation command
  image: async (args, content) => {
    try {
      const size = args.size || 'medium';
      const style = args.style || 'natural';
      
      // Call your image generation API here
      // const response = await generateImage(content, { size, style });
      
      return {
        content: `Generating image: ${content} (Size: ${size}, Style: ${style})`,
        success: true,
        metadata: {
          type: 'image',
          size,
          style
        }
      };
    } catch (error) {
      return {
        content: '',
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate image'
      };
    }
  },

  // Code generation command
  code: async (args, content) => {
    try {
      const language = args.language || 'javascript';
      const type = args.type || 'function';
      
      // Call your code generation API here
      // const response = await generateCode(content, { language, type });
      
      return {
        content: `Generating ${type} in ${language}: ${content}`,
        success: true,
        metadata: {
          type: 'code',
          language,
          codeType: type
        }
      };
    } catch (error) {
      return {
        content: '',
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate code'
      };
    }
  },

  // Summary generation command
  summary: async (args, content) => {
    try {
      const length = args.length || 'medium';
      const format = args.format || 'paragraph';
      
      // Call your summarization API here
      // const response = await generateSummary(content, { length, format });
      
      return {
        content: `Generating ${length} summary in ${format} format: ${content}`,
        success: true,
        metadata: {
          type: 'summary',
          length,
          format
        }
      };
    } catch (error) {
      return {
        content: '',
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate summary'
      };
    }
  }
};

/**
 * Executes a command with the given input
 */
export const executeCommand = async (input: string): Promise<PromptExecutionResult> => {
  try {
    // Extract the command and content
    const parts = input.trim().split(/\s+/);
    const command = parts[0].toLowerCase().replace('/', '');
    
    // ... existing command checks ...
    
    // Add this check for search command
    if (command === 'search') {
      const searchQuery = parts.slice(1).join(' ');
      return handleWebSearch(`Search the web for: ${searchQuery}`);
    }
    
    // ... existing command handling ...
    
    // Default case for unrecognized commands
    return {
      content: `Unrecognized command: ${command}`,
      success: false,
      error: `Unrecognized command: ${command}`
    };
  } catch (error) {
    console.error('Error executing command:', error);
    return {
      content: `Error executing command: ${error instanceof Error ? error.message : 'Unknown error'}`,
      success: false,
      error: error instanceof Error ? error.message : 'Command execution failed'
    };
  }
};

/**
 * Creates a variable object from name and value
 */
export const createVariable = (name: string, value: string): PromptVariable => ({
  name,
  value
});

/**
 * Processes a message with any embedded commands
 */
export const processMessage = async (message: string): Promise<PromptExecutionResult> => {
  try {
    // Check if the message is a command
    if (message.startsWith('/')) {
      return await executeCommand(message);
    }

    // Otherwise, treat it as a regular message to the AI
    try {
      // Get the active chat messages from the store
      const chatStore = useChatStore.getState();
      const messages = chatStore.getActiveChatMessages();

      // Call the AI model with the message and history
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            ...messages.map((msg: Message) => ({
              role: msg.role,
              content: msg.content
            })),
            { role: 'user', content: message }
          ],
          model: 'gpt-4', // or whatever model is active
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get AI response');
      }

      return {
        content: data.message,
        success: true,
        metadata: {
          type: 'text',
          model: data.model,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      console.error('Error calling AI:', error);
      return {
        content: 'Failed to get AI response. Please try again.',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  } catch (error) {
    return {
      content: error instanceof Error ? error.message : 'Failed to process message',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process message'
    };
  }
};

async function handleImageGeneration(template: string): Promise<PromptExecutionResult> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: template }],
        model: 'gpt-4',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate image');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to generate image');
    }

    const imageUrl = extractImageUrl(data.message);
    
    return {
      content: data.message,
      success: true,
      metadata: {
        type: 'image',
        imageUrl,
      },
    };
  } catch (error) {
    return {
      content: error instanceof Error ? error.message : 'Failed to generate image',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate image',
    };
  }
}

async function handleCodeGeneration(template: string): Promise<PromptExecutionResult> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: template }],
        model: 'gpt-4',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate code');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to generate code');
    }

    const language = extractLanguage(data.message);
    
    return {
      content: data.message,
      success: true,
      metadata: {
        type: 'code',
        language,
      },
    };
  } catch (error) {
    return {
      content: error instanceof Error ? error.message : 'Failed to generate code',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate code',
    };
  }
}

async function handleSummaryGeneration(template: string): Promise<PromptExecutionResult> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: template }],
        model: 'gpt-4',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate summary');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to generate summary');
    }

    const { title, content, keyPoints } = extractSummary(data.message);
    
    return {
      content,
      success: true,
      metadata: {
        type: 'summary',
        title,
        keyPoints,
      },
    };
  } catch (error) {
    return {
      content: error instanceof Error ? error.message : 'Failed to generate summary',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate summary',
    };
  }
}

async function handleTextGeneration(template: string): Promise<PromptExecutionResult> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: template }],
        model: 'gpt-4',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate text');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to generate text');
    }
    
    return {
      content: data.message,
      success: true,
      metadata: {
        type: 'text',
      },
    };
  } catch (error) {
    return {
      content: error instanceof Error ? error.message : 'Failed to generate text',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate text',
    };
  }
}

function extractImageUrl(text: string): string | undefined {
  const imageUrlMatch = text.match(/!\[.*?\]\((.*?)\)/);
  return imageUrlMatch ? imageUrlMatch[1] : undefined;
}

function extractLanguage(text: string): string {
  const languageMatch = text.match(/```(\w+)/);
  return languageMatch ? languageMatch[1] : 'plaintext';
}

function extractSummary(text: string): { title?: string; content: string; keyPoints?: string[] } {
  const titleMatch = text.match(/^#\s+(.+)$/m);
  const keyPointsMatch = text.match(/- (.+)$/gm);
  
  return {
    title: titleMatch ? titleMatch[1] : undefined,
    content: text,
    keyPoints: keyPointsMatch ? keyPointsMatch.map(point => point.replace(/^- /, '')) : undefined,
  };
}

async function handleWebSearch(template: string): Promise<PromptExecutionResult> {
  try {
    // Extract the search query
    const searchQuery = template.replace(/^search\s+the\s+web\s+for:\s*/i, '').trim();
    
    if (!searchQuery) {
      return {
        content: "Please provide a search query.",
        success: false,
        error: "No search query provided"
      };
    }
    
    // Call the search API
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: searchQuery }),
    });
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return {
        content: `No results found for "${searchQuery}".`,
        success: true,
        isSearchResult: true,
        searchQuery
      };
    }
    
    // Format the results into markdown
    const formattedResults = data.results.map((result: any, index: number) => 
      `${index + 1}. [${result.title}](${result.url})\n   ${result.snippet}`
    ).join('\n\n');
    
    return {
      content: `### Search results for: "${searchQuery}"\n\n${formattedResults}`,
      success: true,
      isSearchResult: true,
      searchResults: data.results,
      searchQuery
    };
  } catch (error) {
    console.error('Search error:', error);
    return {
      content: `Error searching for "${template}": ${error instanceof Error ? error.message : 'Unknown error'}`,
      success: false,
      error: error instanceof Error ? error.message : 'Search failed'
    };
  }
} 