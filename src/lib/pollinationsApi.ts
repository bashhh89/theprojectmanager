/**
 * Pollinations API Client
 * A comprehensive client for interacting with the Pollinations.AI API services
 */

// Types for Pollinations API requests and responses
export type TextGenerationRequest = {
  prompt?: string;
  messages?: Array<{role: string; content: string}>;
  model?: string;
  system_prompt?: string;
  temperature?: number;
  max_tokens?: number;
  private?: boolean;
}

export type TextGenerationResponse = {
  text: string;
  [key: string]: any;
}

export type MCPDirective = {
  type: 'image' | 'audio';
  content: string;
}

// Available models for use with Pollinations API
export const AVAILABLE_MODELS = {
  TEXT: [
    { id: 'openai', name: 'OpenAI GPT-4', type: 'chat', censored: true, description: 'OpenAI GPT-4o-mini', vision: true },
    { id: 'openai-large', name: 'OpenAI GPT-4 Large', type: 'chat', censored: true, description: 'OpenAI GPT-4o', vision: true },
    { id: 'openai-reasoning', name: 'OpenAI Reasoning', type: 'chat', censored: true, description: 'OpenAI o3-mini', reasoning: true },
    { id: 'qwen-coder', name: 'Qwen 2.5 Coder', type: 'chat', censored: true, description: 'Qwen 2.5 Coder 32B' },
    { id: 'llama', name: 'Llama 3.3 70B', type: 'chat', censored: false },
    { id: 'mistral', name: 'Mistral Small 3.1', type: 'chat', censored: false, vision: true },
    { id: 'deepseek', name: 'DeepSeek-V3', type: 'chat', censored: true },
    { id: 'gemini', name: 'Gemini 2.0 Flash', type: 'chat', censored: true, provider: 'google' },
    { id: 'gemini-thinking', name: 'Gemini 2.0 Flash Thinking', type: 'chat', censored: true, provider: 'google' }
  ],
  IMAGE: [
    { id: 'flux', name: 'Flux' },
    { id: 'turbo', name: 'Turbo' }
  ]
};

// Base URL for Pollinations API
const POLLINATIONS_API_BASE_URL = 'https://text.pollinations.ai';

/**
 * Call the Pollinations API for chat completion
 * @param messages - Array of message objects with role and content
 * @param model - Model ID to use for completion
 * @param systemPrompt - Optional system prompt
 * @param stream - Whether to stream the response
 * @returns Response from the API
 */
export async function callPollinationsChat(
  messages: Array<{ role: string; content: string }>,
  model = 'openai',
  systemPrompt?: string,
  stream = false
) {
  try {
    // For single message simple requests
    if (messages.length === 1 && messages[0].role === 'user') {
      const prompt = encodeURIComponent(messages[0].content);
      const systemParam = systemPrompt ? `&system=${encodeURIComponent(systemPrompt)}` : '';
      const url = `${POLLINATIONS_API_BASE_URL}/${prompt}?model=${model}${systemParam}`;
      
      const response = await fetch(url);
      return response.text();
    }
    
    // For conversation with multiple messages
    const response = await fetch(`${POLLINATIONS_API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: systemPrompt 
          ? [{ role: 'system', content: systemPrompt }, ...messages]
          : messages,
        model,
        stream
      })
    });
    
    if (stream) {
      return response.body;
    }
    
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      // If not valid JSON, return the text directly
      return { message: { content: text } };
    }
  } catch (error) {
    console.error('Error calling Pollinations API:', error);
    throw error;
  }
}

/**
 * Generate audio from text using Pollinations API
 * @param text - Text to convert to speech
 * @param voice - Voice ID to use
 * @returns URL to the generated audio
 */
export function generateAudioUrl(text: string, voice = 'alloy') {
  const encodedText = encodeURIComponent(text);
  return `${POLLINATIONS_API_BASE_URL}/audio?text=${encodedText}&model=openai-audio&voice=${voice}&t=${Date.now()}`;
}

/**
 * Generate an image URL from a prompt using the correct Pollinations image endpoint.
 * @param prompt - Text prompt for image generation
 * @param width - Desired image width (default: 256)
 * @param height - Desired image height (default: 256)
 * @returns URL to the generated image conforming to Pollinations requirements.
 */
export function generateImageUrl(prompt: string, width = 256, height = 256) {
  // Encode the prompt for URL usage (replaces spaces with %20, etc.)
  const encodedPrompt = encodeURIComponent(prompt);
  // Construct the URL using the image.pollinations.ai endpoint and required parameters
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true`;
}

/**
 * Generate text using the Pollinations API with retry logic
 */
export async function generateText(options: TextGenerationRequest): Promise<TextGenerationResponse> {
  // Validate input options
  if (!options) {
    throw new Error("No options provided to generateText");
  }
  
  // Handle provider-based model format
  if (options.model?.startsWith('pollinations-')) {
    options.model = options.model.replace('pollinations-', '');
  }
  
  // Validate the messages array, since invalid messages can cause "Invalid messages array" errors
  if (options.messages) {
    // Check that messages is actually an array
    if (!Array.isArray(options.messages)) {
      throw new Error("Messages must be an array");
    }
    
    // Validate each message in the array has the required properties
    for (let i = 0; i < options.messages.length; i++) {
      const msg = options.messages[i];
      if (!msg || typeof msg !== 'object') {
        throw new Error(`Invalid message at index ${i}: message must be an object`);
      }
      
      if (!msg.role || typeof msg.role !== 'string') {
        throw new Error(`Invalid message at index ${i}: missing or invalid 'role' property`);
      }
      
      if (msg.content === undefined || msg.content === null) {
        throw new Error(`Invalid message at index ${i}: missing 'content' property`);
      }
      
      // Make sure role is one of the allowed values
      if (!['user', 'assistant', 'system'].includes(msg.role)) {
        console.warn(`Warning: message at index ${i} has non-standard role '${msg.role}', which may not be supported by all models`);
      }
    }
  }
  
  // Log the request for debugging
  console.log("Pollinations API request:", {
    model: options.model || "openai",
    hasMessages: !!options.messages && options.messages.length > 0,
    messageCount: options.messages?.length || 0,
    hasPrompt: !!options.prompt,
    maxTokens: options.max_tokens || 2000,
    temperature: options.temperature || 0.7
  });
  
  // Try up to 3 times with increasing timeouts
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`API attempt ${attempt}/3 with model ${options.model || 'openai'}`);
      
      // Add timeout to prevent hanging requests - increase timeout for later attempts
      const timeoutMs = attempt === 1 ? 15000 : (attempt === 2 ? 25000 : 40000);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      // Prepare the request payload, ensuring proper structure for messages
      const requestBody = {
        prompt: options.prompt,
        messages: options.messages,
        model: options.model || "openai",
        system_prompt: options.system_prompt,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2000,
        private: options.private || false
      };
      
      // Log the formatted request body for debugging
      console.log("Request body structure:", {
        hasPrompt: !!requestBody.prompt,
        messageCount: requestBody.messages?.length || 0,
        firstMessageRole: requestBody.messages?.[0]?.role || 'none',
        model: requestBody.model,
        hasSystemPrompt: !!requestBody.system_prompt
      });
      
      const response = await fetch("https://text.pollinations.ai/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      // Clear the timeout as we got a response
      clearTimeout(timeoutId);

      // First handle non-200 responses
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Pollinations API error response:", {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText.substring(0, 200),
          attempt
        });
        
        // Check for common error patterns
        if (errorText.includes("More credits are required") || errorText.includes("credits")) {
          throw new Error("More credits are required to run this request. Please check your Pollinations account.");
        }
        
        if (errorText.includes("rate limit") || errorText.includes("ratelimit")) {
          throw new Error("Rate limit exceeded. Please try again later or switch to a different model.");
        }
        
        if (errorText.includes("unavailable") || errorText.includes("not available")) {
          throw new Error("The selected model is currently unavailable. Please try another model.");
        }
        
        if (errorText.includes("Invalid messages array")) {
          console.error("Invalid messages array error. Messages structure:", 
                       JSON.stringify(options.messages).substring(0, 300));
          throw new Error("Invalid messages array format. Please check the structure of your messages.");
        }
        
        // Allow retrying for certain status codes
        if (response.status === 429 || response.status === 503 || response.status === 502) {
          lastError = new Error(`Error ${response.status}: ${errorText.substring(0, 100)}`);
          // Wait longer before the next retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        
        throw new Error(`Error ${response.status}: ${errorText.substring(0, 100)}`);
      }

      // Log successful response
      console.log(`Pollinations API response received for model: ${options.model || "openai"} (attempt ${attempt})`);
      
      // Now handle successful responses
      const contentType = response.headers.get("content-type");
      const textContent = await response.text();
      
      // Handle empty responses
      if (!textContent || textContent.trim() === '') {
        if (attempt < 3) {
          lastError = new Error("Received empty response from Pollinations API");
          // Wait before the next retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        throw new Error("Received empty response from Pollinations API");
      }
      
      // Log truncated response content
      console.log("Response content (truncated):", textContent.substring(0, 100) + (textContent.length > 100 ? "..." : ""));
      
      try {
        // Always try to parse as JSON first, regardless of content-type
        // This handles cases where the content-type header is incorrect
        const jsonData = JSON.parse(textContent);
        
        // Check if the JSON response has the expected structure
        if (!jsonData.text && !jsonData.result && !jsonData.message && !jsonData.response) {
          console.warn("JSON response missing expected fields:", Object.keys(jsonData).join(", "));
          // Try to find any property that could contain the response text
          const possibleTextFields = Object.keys(jsonData).find(key => typeof jsonData[key] === 'string' && jsonData[key].length > 10);
          if (possibleTextFields) {
            return { text: jsonData[possibleTextFields] };
          }
          
          if (attempt < 3) {
            lastError = new Error("Invalid response structure from Pollinations API");
            // Wait before the next retry
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }
          
          throw new Error("Invalid response structure from Pollinations API");
        }
        
        // Normalize response structure
        return {
          text: jsonData.text || jsonData.result || jsonData.message || jsonData.response || "",
          ...jsonData
        };
      } catch (e) {
        console.warn("Response is not valid JSON, handling as plain text");
        console.log("Raw text content (truncated):", textContent.substring(0, 200) + "...");
        
        // If the response starts with a quote or bracket but isn't valid JSON, 
        // it might be a malformed JSON response - try to fix common issues
        if (textContent.trim().startsWith('{') || textContent.trim().startsWith('[')) {
          try {
            // Try to clean up the JSON by removing invalid control characters
            const cleanedText = textContent.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
            const jsonData = JSON.parse(cleanedText);
            console.log("Successfully parsed after cleaning:", jsonData);
            return {
              text: jsonData.text || jsonData.result || jsonData.message || jsonData.response || textContent,
              ...jsonData
            };
          } catch (cleanError) {
            console.warn("Failed to clean and parse JSON:", cleanError);
          }
        }
        
        // If it contains "As of my last" or similar AI preface responses
        if (textContent.match(/As of my (last|knowledge|training|current)/i)) {
          // It's probably a non-JSON text response from the model
          return { text: textContent };
        }
        
        // If it contains any error-like text
        if (
          textContent.toLowerCase().includes("error") || 
          textContent.toLowerCase().includes("credits") || 
          textContent.toLowerCase().includes("limit") ||
          textContent.toLowerCase().includes("unavailable")
        ) {
          if (attempt < 3) {
            lastError = new Error(textContent.trim());
            // Wait before the next retry
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }
          throw new Error(textContent.trim());
        }
        
        // Otherwise, just return as text
        return { text: textContent };
      }
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on these error types
      if (
        error.message.includes("More credits are required") ||
        error.message.includes("Invalid response structure") ||
        error.name === 'SyntaxError'
      ) {
        throw error;
      }
      
      // For timeout errors or network errors, retry
      if (error.name === 'AbortError' || error.name === 'TypeError' || error.message.includes("NetworkError")) {
        console.error(`Attempt ${attempt} failed with timeout or network error:`, error.message);
        if (attempt < 3) {
          // Wait longer before next retry
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          continue;
        }
      }
      
      // If we've tried 3 times, give up and throw the last error
      if (attempt === 3) {
        console.error("All retry attempts failed for model:", options.model);
        throw lastError;
      }
    }
  }
  
  // If we get here after all retries, throw the last error
  throw lastError || new Error("Failed to generate text after multiple attempts");
}

/**
 * Process conversation history into a format accepted by Pollinations API
 */
export function processConversationHistory(messages: any[]): {
  processedMessages: Array<{role: string; content: string}>;
  contextString: string;
} {
  // Process messages to extract text content
  const processedMessages = messages.map(message => {
    if (message.role === "user" || message.role === "assistant") {
      // Extract text content from structured messages
      if (Array.isArray(message.content)) {
        const textContent = message.content
          .filter((item: any) => item.type === "text")
          .map((item: any) => item.content)
          .join("\n");
        
        return {
          role: message.role,
          content: textContent
        };
      } else if (typeof message.content === "string") {
        // Handle if content is already a string
        return {
          role: message.role,
          content: message.content
        };
      }
    }
    return message;
  });

  // Create context string from conversation history
  const contextString = processedMessages.map(msg => 
    `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
  ).join("\n\n");

  return { processedMessages, contextString };
}

/**
 * Subscribe to the image feed
 * Returns an EventSource that can be used to listen for new images
 */
export function subscribeToImageFeed(
  onMessage: (data: any) => void,
  onError?: (error: Event) => void
): EventSource {
  const eventSource = new EventSource('https://image.pollinations.ai/feed');
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('Error parsing image feed data:', error);
    }
  };
  
  if (onError) {
    eventSource.onerror = onError;
  } else {
    eventSource.onerror = (error) => {
      console.error('Image feed error:', error);
    };
  }
  
  return eventSource;
}

/**
 * Subscribe to the text feed
 * Returns an EventSource that can be used to listen for new text generations
 */
export function subscribeToTextFeed(
  onMessage: (data: any) => void,
  onError?: (error: Event) => void
): EventSource {
  const eventSource = new EventSource('https://text.pollinations.ai/feed');
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('Error parsing text feed data:', error);
    }
  };
  
  if (onError) {
    eventSource.onerror = onError;
  } else {
    eventSource.onerror = (error) => {
      console.error('Text feed error:', error);
    };
  }
  
  return eventSource;
}

export async function generateGeminiResponse(prompt: string, model: string): Promise<string> {
  try {
    const response = await fetch('https://text.pollinations.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate response')
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error('Error generating response:', error)
    throw error
  }
}

// Define available models for Pollinations
export const POLLINATIONS_MODELS = {
  flux: 'Flux',
  turbo: 'Turbo'
};

export async function generatePollinationsResponse(prompt: string, model: string = 'flux'): Promise<string> {
  try {
    const response = await fetch('https://text.pollinations.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate response');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Pollinations API error:', error);
    throw error;
  }
}