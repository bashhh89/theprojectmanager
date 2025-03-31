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

// Available Models for Pollinations API
export const AVAILABLE_MODELS = {
  text: [
    // Google Models - always respect system prompts/agent personas
    { id: "google-gemini-1.5-flash", name: "Google Gemini 1.5 Flash", description: "Google Gemini 1.5 Flash - Fastest model with full persona support" },
    { id: "google-gemini-1.5-pro-latest", name: "Google Gemini 1.5 Pro (Latest)", description: "Google Gemini 1.5 Pro - Best quality with full persona support" },
    { id: "google-gemini-pro", name: "Google Gemini Pro (Direct)", description: "Google Gemini Pro - Direct API access with persona support" },
    { id: "google-gemini-flash", name: "Google Gemini Flash (Direct)", description: "Google Gemini 1.5 Flash - Direct API access with persona support" },

    // Pollinations models that support system prompts/agent personas
    { id: "pollinations-llama", name: "Llama 3.3 (Supports Personas)", description: "Latest Llama model - Respects agent personas/system prompts" },
    { id: "pollinations-mistral", name: "Mistral (Supports Personas)", description: "Mistral Small model - Respects agent personas/system prompts" },
    { id: "pollinations-deepseek", name: "DeepSeek (Supports Personas)", description: "DeepSeek model - Respects agent personas/system prompts" },
    
    // Pollinations models that don't support system prompts/agent personas
    { id: "openai", name: "OpenAI GPT-4o-mini", description: "OpenAI via Pollinations (NOTE: Does not follow agent personas)" },
    { id: "gpt4all", name: "GPT4All", description: "Open-source GPT4All (NOTE: May not follow agent personas)" },
    { id: "gpt4", name: "GPT-4 (Legacy via Pollinations)", description: "GPT-4 via Pollinations (NOTE: Does not follow agent personas)" },
    { id: "openai-large", name: "OpenAI GPT-4o", description: "OpenAI GPT-4o", baseModel: true, vision: true, censored: true },
    { id: "openai-reasoning", name: "OpenAI o3-mini", description: "OpenAI o3-mini", baseModel: true, reasoning: true, censored: true },
    { id: "qwen-coder", name: "Qwen 2.5 Coder", description: "Qwen 2.5 Coder 32B", baseModel: true, censored: true },
    { id: "gemini-1.5-pro-001", name: "Gemini 1.5 Pro 001", description: "Google Gemini 1.5 Pro 001", baseModel: true, vision: true, censored: false },
    { id: "gemini-1.5-pro-002", name: "Gemini 1.5 Pro 002", description: "Google Gemini 1.5 Pro 002", baseModel: true, vision: true, censored: false },
    { id: "gemini-1.5-flash-001", name: "Gemini 1.5 Flash 001", description: "Google Gemini 1.5 Flash 001", baseModel: true, vision: true, censored: false },
    { id: "gemini-1.5-flash-002", name: "Gemini 1.5 Flash 002", description: "Google Gemini 1.5 Flash 002", baseModel: true, vision: true, censored: false },
    { id: "gemini-1.5-flash-8b", name: "Gemini 1.5 Flash 8B", description: "Google Gemini 1.5 Flash 8B - smaller model", baseModel: true, vision: true, censored: false },
    { id: "gemini-1.5-flash-8b-latest", name: "Gemini 1.5 Flash 8B Latest", description: "Google's latest Gemini 1.5 Flash 8B model", baseModel: true, vision: true, censored: false },
    { id: "gemini-2.0-pro-exp", name: "Gemini 2.0 Pro Experimental", description: "Google Gemini 2.0 Pro Experimental", baseModel: true, vision: true, censored: false },
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", description: "Google Gemini 2.0 Flash", baseModel: true, vision: true, censored: false },
    { id: "gemini-2.0-flash-001", name: "Gemini 2.0 Flash 001", description: "Google Gemini 2.0 Flash 001", baseModel: true, vision: true, censored: false },
    { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash Lite", description: "Google Gemini 2.0 Flash Lite - fast and efficient", baseModel: true, vision: true, censored: false },
    { id: "chat-bison-001", name: "Chat Bison 001", description: "Google Chat Bison 001 model", baseModel: true, censored: true },
    { id: "text-bison-001", name: "Text Bison 001", description: "Google Text Bison 001 model", baseModel: true, censored: true },
    { id: "gemma-3-27b-it", name: "Gemma 3 27B IT", description: "Google Gemma 3 27B Instruction Tuned", baseModel: true, censored: false },
    { id: "mistral-roblox", name: "Mistral Roblox", description: "Mistral Roblox on Scaleway", baseModel: true, censored: false },
    { id: "roblox-rp", name: "Roblox Roleplay", description: "Roblox Roleplay Assistant", baseModel: true, censored: true },
    { id: "unity", name: "Unity", description: "Unity with Mistral Large by Unity AI Lab", baseModel: false, censored: false },
    { id: "midijourney", name: "Midijourney", description: "Midijourney musical transformer", baseModel: false, censored: true },
    { id: "rtist", name: "Rtist", description: "Rtist image generator by @bqrio", baseModel: false, censored: true },
    { id: "searchgpt", name: "SearchGPT", description: "SearchGPT with realtime news and web search", baseModel: false, censored: true },
    { id: "evil", name: "Evil Mode", description: "Evil Mode - Experimental", baseModel: false, censored: false },
    { id: "deepseek-r1", name: "DeepSeek-R1 Distill", description: "DeepSeek-R1 Distill Qwen 32B", baseModel: true, reasoning: true, censored: true },
    { id: "deepseek-reasoner", name: "DeepSeek R1 Full", description: "DeepSeek R1 - Full", baseModel: true, reasoning: true, censored: true },
    { id: "deepseek-r1-llama", name: "DeepSeek R1 Llama", description: "DeepSeek R1 - Llama 70B", baseModel: true, reasoning: true, censored: true },
    { id: "qwen-reasoning", name: "Qwen QWQ", description: "Qwen QWQ 32B - Advanced Reasoning", baseModel: true, reasoning: true, censored: true },
    { id: "llamalight", name: "Llama 3.1 Light", description: "Llama 3.1 8B Instruct", baseModel: true, maxTokens: 7168, censored: false },
    { id: "llamaguard", name: "Llamaguard", description: "Llamaguard 7B AWQ", baseModel: false, maxTokens: 4000, censored: false },
    { id: "phi", name: "Phi-4", description: "Phi-4 Instruct", baseModel: true, censored: true },
    { id: "phi-mini", name: "Phi-4 Mini", description: "Phi-4 Mini Instruct", baseModel: true, censored: true },
    { id: "llama-vision", name: "Llama 3.2 Vision", description: "Llama 3.2 11B Vision", baseModel: true, vision: true, censored: false },
    { id: "pixtral", name: "Pixtral", description: "Pixtral 12B", baseModel: true, vision: true, censored: false },
    { id: "gemini", name: "Gemini 2.0", description: "Gemini 2.0 Flash", baseModel: true, censored: true },
    { id: "gemini-thinking", name: "Gemini Thinking", description: "Gemini 2.0 Flash Thinking", baseModel: true, censored: true },
    { id: "hormoz", name: "Hormoz", description: "Hormoz 8b by Muhammadreza Haghiri", baseModel: true, censored: false },
    { id: "hypnosis-tracy", name: "Hypnosis Tracy", description: "Hypnosis Tracy 7B - Self-help AI assistant", baseModel: false, censored: false },
    { id: "sur", name: "Sur AI", description: "Sur AI Assistant", baseModel: false, censored: true },
    { id: "sur-mistral", name: "Sur AI (Mistral)", description: "Sur AI Assistant (Mistral)", baseModel: false, censored: true },
    { id: "llama-scaleway", name: "Llama (Scaleway)", description: "Llama (Scaleway)", baseModel: true, censored: false },
    { id: "openai-audio", name: "OpenAI Audio", description: "OpenAI GPT-4o-audio-preview", baseModel: true, audio: true, censored: true }
  ],
  image: [
    { id: "turbo", name: "Turbo - Fast Generation", description: "Fast image generation with good quality" },
    { id: "flux", name: "Flux - High Quality", description: "High quality image generation (slower but better results)" }
  ],
  voices: [
    { id: "alloy", name: "Alloy", description: "Neutral voice" },
    { id: "echo", name: "Echo", description: "Echo voice" },
    { id: "fable", name: "Fable", description: "Fable voice" },
    { id: "onyx", name: "Onyx", description: "Deep, serious voice" },
    { id: "nova", name: "Nova", description: "Female voice" },
    { id: "shimmer", name: "Shimmer", description: "Soft, calming voice" },
    { id: "coral", name: "Coral", description: "Coral voice" },
    { id: "verse", name: "Verse", description: "Verse voice" },
    { id: "ballad", name: "Ballad", description: "Ballad voice" },
    { id: "ash", name: "Ash", description: "Ash voice" },
    { id: "sage", name: "Sage", description: "Sage voice" },
    { id: "amuch", name: "Amuch", description: "Amuch voice" },
    { id: "dan", name: "Dan", description: "Dan voice" }
  ],
  audio: [
    { id: "openai-audio", name: "OpenAI TTS", description: "Text-to-speech by OpenAI" }
  ],
  voice: [
    { id: "elevenlabs", name: "ElevenLabs", description: "ElevenLabs TTS" },
    { id: "openai", name: "OpenAI TTS", description: "OpenAI Text-to-Speech" }
  ]
};

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
 * Generate an image URL based on a prompt
 */
export function generateImageUrl(
  prompt: string, 
  options: { 
    width?: number; 
    height?: number; 
    seed?: number; 
    model?: string;
    nologo?: boolean;
  } = {}
): string {
  const { width = 512, height = 512, seed, model = 'flux', nologo } = options;
  
  let url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}`;
  
  if (seed !== undefined) {
    url += `&seed=${seed}`;
  }
  
  if (model) {
    url += `&model=${model}`;
  }
  
  if (nologo) {
    url += `&nologo=true`;
  }
  
  // Always add safety=off parameter
  url += `&safety=off`;
  
  return url;
}

/**
 * Generate an audio URL based on text
 * Ensures proper encoding and URL validity
 */
export function generateAudioUrl(text: string, voice?: string): string {
  // Ensure text is not empty
  if (!text || text.trim() === '') {
    console.error("Empty text passed to generateAudioUrl");
    text = "Audio generation requires text input";
  }
  
  // Truncate extremely long texts to avoid URL length issues
  // 2000 chars is a safe limit for most modern browsers and servers
  if (text.length > 2000) {
    console.warn("Text too long for audio URL, truncating to 2000 chars");
    text = text.substring(0, 1997) + "...";
  }
  
  try {
    // Build the URL with proper query parameters using URLSearchParams
    const params = new URLSearchParams();
    params.append('text', text); 
    params.append('model', 'openai-audio');
    
    // Add voice parameter if provided
    if (voice && voice.trim()) {
      params.append('voice', voice.trim());
    } else {
      // Default voice if none is provided
      params.append('voice', 'alloy');
    }
    
    // Add cache-busting parameter to prevent browser caching issues
    params.append('t', Date.now().toString());
    
    // Construct the final URL - use POST endpoint for more reliable handling
    const url = `https://text.pollinations.ai/audio?${params.toString()}`;
    
    console.log("Generated audio URL:", url);
    return url;
  } catch (error) {
    console.error("Error generating audio URL:", error);
    
    // Fallback to a simple encoding method if the above fails
    const fallbackUrl = `https://text.pollinations.ai/audio?text=${encodeURIComponent(text.substring(0, 1000))}&voice=${voice || 'alloy'}&t=${Date.now()}`;
    console.log("Using fallback audio URL:", fallbackUrl);
    return fallbackUrl;
  }
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