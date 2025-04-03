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
    { id: 'openai', name: 'OpenAI GPT-4o-mini', type: 'chat', censored: true, description: 'OpenAI GPT-4o-mini', baseModel: true, vision: true },
    { id: 'openai-large', name: 'OpenAI GPT-4o', type: 'chat', censored: true, description: 'OpenAI GPT-4o', baseModel: true, vision: true },
    { id: 'openai-reasoning', name: 'OpenAI o3-mini', type: 'chat', censored: true, description: 'OpenAI o3-mini', baseModel: true, reasoning: true },
    { id: 'qwen-coder', name: 'Qwen 2.5 Coder 32B', type: 'chat', censored: true, description: 'Qwen 2.5 Coder 32B', baseModel: true },
    { id: 'llama', name: 'Llama 3.3 70B', type: 'chat', censored: false, description: 'Llama 3.3 70B', baseModel: true },
    { id: 'mistral', name: 'Mistral Small 3.1 2503', type: 'chat', censored: false, description: 'Mistral Small 3.1 2503', baseModel: true, vision: true },
    { id: 'mistral-roblox', name: 'Mistral Roblox', type: 'chat', censored: false, description: 'Mistral Roblox on Scaleway', baseModel: true },
    { id: 'roblox-rp', name: 'Roblox Roleplay Assistant', type: 'chat', censored: true, description: 'Roblox Roleplay Assistant', baseModel: true },
    { id: 'unity', name: 'Unity Mistral Large', type: 'chat', censored: false, description: 'Unity with Mistral Large by Unity AI Lab', baseModel: false },
    { id: 'midijourney', name: 'Midijourney', type: 'chat', censored: true, description: 'Midijourney musical transformer', baseModel: false },
    { id: 'rtist', name: 'Rtist', type: 'chat', censored: true, description: 'Rtist image generator by @bqrio', baseModel: false },
    { id: 'searchgpt', name: 'SearchGPT', type: 'chat', censored: true, description: 'SearchGPT with realtime news and web search', baseModel: false },
    { id: 'evil', name: 'Evil', type: 'chat', censored: false, description: 'Evil Mode - Experimental', baseModel: false },
    { id: 'deepseek', name: 'DeepSeek-V3', type: 'chat', censored: true, description: 'DeepSeek-V3', baseModel: true },
    { id: 'deepseek-r1', name: 'DeepSeek-R1 Distill', type: 'chat', censored: true, description: 'DeepSeek-R1 Distill Qwen 32B', baseModel: true, reasoning: true, provider: 'cloudflare' },
    { id: 'deepseek-reasoner', name: 'DeepSeek R1 - Full', type: 'chat', censored: true, description: 'DeepSeek R1 - Full', baseModel: true, reasoning: true, provider: 'deepseek' },
    { id: 'deepseek-r1-llama', name: 'DeepSeek R1 - Llama 70B', type: 'chat', censored: true, description: 'DeepSeek R1 - Llama 70B', baseModel: true, reasoning: true, provider: 'scaleway' },
    { id: 'qwen-reasoning', name: 'Qwen QWQ 32B', type: 'chat', censored: true, description: 'Qwen QWQ 32B - Advanced Reasoning', baseModel: true, reasoning: true, provider: 'groq' },
    { id: 'llamalight', name: 'Llama 3.1 8B Instruct', type: 'chat', censored: false, description: 'Llama 3.1 8B Instruct', baseModel: true, maxTokens: 7168 },
    { id: 'llamaguard', name: 'Llamaguard 7B AWQ', type: 'safety', censored: false, description: 'Llamaguard 7B AWQ', baseModel: false, provider: 'cloudflare', maxTokens: 4000 },
    { id: 'phi', name: 'Phi-4 Instruct', type: 'chat', censored: true, description: 'Phi-4 Instruct', baseModel: true, provider: 'cloudflare' },
    { id: 'phi-mini', name: 'Phi-4 Mini Instruct', type: 'chat', censored: true, description: 'Phi-4 Mini Instruct', baseModel: true, provider: 'azure' },
    { id: 'llama-vision', name: 'Llama 3.2 11B Vision', type: 'chat', censored: false, description: 'Llama 3.2 11B Vision', baseModel: true, provider: 'cloudflare', vision: true },
    { id: 'pixtral', name: 'Pixtral 12B', type: 'chat', censored: false, description: 'Pixtral 12B', baseModel: true, provider: 'scaleway', vision: true },
    { id: 'gemini', name: 'Gemini 2.0 Flash', type: 'chat', censored: true, description: 'Gemini 2.0 Flash', baseModel: true, provider: 'google' },
    { id: 'gemini-thinking', name: 'Gemini 2.0 Flash Thinking', type: 'chat', censored: true, description: 'Gemini 2.0 Flash Thinking', baseModel: true, provider: 'google' },
    { id: 'hormoz', name: 'Hormoz 8b', type: 'chat', description: 'Hormoz 8b by Muhammadreza Haghiri', baseModel: true, provider: 'modal' },
    { id: 'hypnosis-tracy', name: 'Hypnosis Tracy 7B', type: 'chat', description: 'Hypnosis Tracy 7B - Self-help AI assistant', baseModel: false, provider: 'openai' },
    { id: 'sur', name: 'Sur AI Assistant', type: 'chat', censored: true, description: 'Sur AI Assistant', baseModel: false },
    { id: 'sur-mistral', name: 'Sur AI Assistant (Mistral)', type: 'chat', censored: true, description: 'Sur AI Assistant (Mistral)', baseModel: false },
    { id: 'llama-scaleway', name: 'Llama (Scaleway)', type: 'chat', censored: false, description: 'Llama (Scaleway)', baseModel: true },
    { id: 'openai-audio', name: 'OpenAI GPT-4o Audio', type: 'chat', censored: true, description: 'OpenAI GPT-4o-audio-preview', baseModel: true, audio: true, voices: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer', 'coral', 'verse', 'ballad', 'ash', 'sage', 'amuch', 'dan'] }
  ],
  IMAGE: [
    { id: 'flux', name: 'Flux' },
    { id: 'turbo', name: 'Turbo' }
  ]
};

// Base URL for Pollinations API
const POLLINATIONS_API_BASE_URL = 'https://text.pollinations.ai';

/**
 * Call the Pollinations API for chat completion (or simple text gen)
 * Uses the OpenAI-compatible POST endpoint for chat
 */
export async function callPollinationsChat(
  messages: Array<{ role: string; content: string }>,
  model = 'openai',
  systemPrompt?: string,
  stream = false
) {
  try {
    // --- Keep GET logic for simple, single-message prompts --- 
    if (messages.length === 1 && messages[0].role === 'user' && !systemPrompt && !stream) {
      const prompt = encodeURIComponent(messages[0].content);
      const url = `${POLLINATIONS_API_BASE_URL}/${prompt}?model=${model}`;
      console.log("Using simple GET request for single prompt:", url);
      
      const response = await fetch(url);
      if (!response.ok) {
         const errorText = await response.text();
         console.error("Simple GET request failed:", response.status, errorText);
         throw new Error(`Simple request failed with status ${response.status}: ${errorText.substring(0,100)}`);
      }
      return response.text(); // Returns plain text for simple GET
    }
    
    // --- Use OpenAI-compatible POST endpoint for conversations or complex requests ---
    console.log("Using POST request (OpenAI compatible endpoint) for chat/complex request");
    const response = await fetch(`${POLLINATIONS_API_BASE_URL}/openai`, { // Corrected endpoint
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: systemPrompt 
          ? [{ role: 'system', content: systemPrompt }, ...messages]
          : messages,
        stream
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("POST request failed:", response.status, errorText);
      throw new Error(`API request failed with status ${response.status}: ${errorText.substring(0,100)}`);
    }

    if (stream) {
      console.log("Returning stream body");
      return response.body;
    }
    
    console.log("Attempting to parse JSON response from POST");
    const responseData = await response.json(); 
    console.log("POST request successful, returning parsed JSON:", responseData);
    return responseData; // Return parsed JSON for standard POST

  } catch (error: any) {
    console.error('Error calling Pollinations API:', error.message);
    // Re-throw the error so the calling function (handleSubmit) can catch it
    throw error; 
  }
}

/**
 * Generate audio URL from text using Pollinations API
 * @param text - Text to convert to speech
 * @param voice - Voice ID to use
 * @returns URL to the generated audio
 */
export function generateAudioUrl(text: string, voice = 'alloy') {
  const encodedText = encodeURIComponent(text);
  return `${POLLINATIONS_API_BASE_URL}/${encodedText}?model=openai-audio&voice=${voice}&t=${Date.now()}`;
}

/**
 * Generate audio using Pollinations API and return a playable URL
 * @param text - Text to convert to speech
 * @param voice - Voice ID to use (e.g., 'nova', 'alloy', 'echo')
 * @param exact - If true, will read the exact text. If false, will generate a response about the text.
 * @returns Promise resolving to the URL of the generated audio or null if failed
 */
export async function generatePollinationsAudio(text: string, voice: string = 'nova', exact: boolean = true): Promise<string | null> {
  try {
    console.log(`Generating Pollinations audio with voice: ${voice}, exact mode: ${exact}`);
    
    // For exact repetition, we need to use the right format to prevent it from responding
    // instead of repeating the exact content
    const promptText = exact 
      ? `Read the following text verbatim without additional commentary: ${text.substring(0, 3900)}` 
      : `Give a natural conversational response about: ${text.substring(0, 3800)}`;
    
    // Create the URL with proper encoding
    const encodedText = encodeURIComponent(promptText);
    const audioUrl = `https://text.pollinations.ai/${encodedText}?model=openai-audio&voice=${voice}`;
    
    console.log("Requesting audio from:", audioUrl);
    console.log("Audio mode:", exact ? "Exact repetition" : "Normal response");
    
    return audioUrl;
  } catch (error) {
    console.error('Error generating audio:', error);
    return null;
  }
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
      const errorText = await response.text();
      console.error(`Pollinations API error (${response.status}): ${errorText}`);
      
      // Handle specific error types
      if (errorText.includes("Cannot read properties of undefined") && errorText.includes("reading 'length'")) {
        throw new Error("The Pollinations API returned invalid data. This may be a temporary issue. Please try again with a different model.");
      }
      
      throw new Error(`Failed to generate response: ${errorText}`);
    }

    // Try to parse the response as text first to check for errors
    const rawText = await response.text();
    
    try {
      const data = JSON.parse(rawText);
      
      // Safely access the data
      if (data && data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
    return data.choices[0].message.content;
      } else {
        console.warn("Unexpected response structure from Pollinations API:", rawText.substring(0, 200));
        if (typeof data === "string") {
          return data;
        } else if (typeof data.text === "string") {
          return data.text; 
        } else if (typeof data.message === "string") {
          return data.message;
        } else {
          return "The AI model returned an unexpected response format.";
        }
      }
    } catch (e) {
      // If parsing fails, return the raw text
      console.error("Failed to parse JSON response:", e);
      return rawText;
    }
  } catch (error) {
    console.error('Pollinations API error:', error);
    throw error;
  }
}