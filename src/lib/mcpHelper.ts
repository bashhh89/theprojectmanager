/**
 * Model Context Protocol (MCP) Helper Functions
 * 
 * These functions provide a simple interface to work with Pollinations' MCP
 * capabilities, allowing AI assistants to generate images and audio directly.
 */

import { MCPDirective } from './pollinationsApi';
import { useState } from 'react';
import { useChatStore, Message, MessageContent } from '@/store/chatStore';
import { useSettingsStore } from '@/store/settingsStore';

// Regular expressions for identifying MCP directives
const imageDirectiveRegex = /!generate\s+image:?\s*(.+?)(?=!generate|$)/gi;
const audioDirectiveRegex = /!generate\s+audio:?\s*(.+?)(?=!generate|$)/gi;

/**
 * React hook for handling MCP requests
 * @returns Object with sendRequest function
 */
export function useMcpRequest() {
  const addMessage = useChatStore(state => state.addMessage);
  const setIsGenerating = useChatStore(state => state.setIsGenerating);

  const sendRequest = async (userInput: string, agent: any = null, selectedAgentId: string | null = null) => {
    try {
      // Get the latest state inside the function where it's needed
      const settingsState = useSettingsStore.getState();
      
      // Enhanced debugging - log entire agent object
      console.log("===== MCP REQUEST DEBUG =====");
      console.log("Agent object received:", agent);
      console.log("Selected agent ID:", selectedAgentId);
      console.log("Active agent from store:", settingsState.activeAgent);
      
      // Important: Log the model that was selected for this agent
      if (agent?.modelPreferences?.textModel) {
        console.log("Agent's selected model:", agent.modelPreferences.textModel);
      } else if (settingsState.activeTextModel) {
        console.log("Global active model:", settingsState.activeTextModel);
      } else {
        console.log("No model explicitly selected, will use default");
      }
      console.log("============================");
      
      // Log what we received as input
      console.log("MCP Request received with:", {
        userInputLength: userInput.length,
        agent: agent ? (typeof agent === 'string' ? 'string prompt' : `Agent object: ${agent.name}`) : 'null',
        selectedAgentId
      });
      
      // Use provided agent or get active agent from settings
      const activeAgent = agent || settingsState.activeAgent;
      
      if (!activeAgent) {
        console.warn("No active agent found! Using default assistant behavior");
      }
      
      console.log("Using agent for request:", {
        name: activeAgent?.name,
        id: selectedAgentId || activeAgent?.id,
        systemPrompt: activeAgent?.systemPrompt?.substring(0, 50) + "..." || "None",
        system_prompt: activeAgent?.system_prompt?.substring(0, 50) + "..." || "None"
      });
      
      // Get the appropriate model for this agent
      // Use the agent's preferred model if available, otherwise use the global active model
      const textModel = activeAgent?.modelPreferences?.textModel || settingsState.activeTextModel;
      
      console.log("Using model for API request:", textModel || "default");
      
      // Ensure we have a valid system prompt - support both camelCase and snake_case formats
      // If agent is a string (legacy format), use it directly as the system prompt
      let systemPrompt;
      if (typeof agent === 'string') {
        systemPrompt = agent;
        console.log("Using provided string as system prompt");
      } else if (agent && agent.systemPrompt) {
        systemPrompt = agent.systemPrompt;
        console.log("Using agent.systemPrompt:", systemPrompt.substring(0, 50) + "...");
      } else if (agent && agent.system_prompt) {
        systemPrompt = agent.system_prompt;
        console.log("Using agent.system_prompt:", systemPrompt.substring(0, 50) + "...");
      } else if (activeAgent?.systemPrompt) {
        systemPrompt = activeAgent.systemPrompt;
        console.log("Using activeAgent.systemPrompt:", systemPrompt.substring(0, 50) + "...");
      } else if (activeAgent?.system_prompt) {
        systemPrompt = activeAgent.system_prompt;
        console.log("Using activeAgent.system_prompt:", systemPrompt.substring(0, 50) + "...");
      } else {
        systemPrompt = "You are a helpful assistant.";
        console.log("Using default system prompt");
      }
      
      // Add a prefix to the system prompt to make it obvious which agent is being used
      const enhancedSystemPrompt = `[USING AGENT: ${activeAgent?.name || "Default Assistant"}]\n\n${systemPrompt}`;
      
      console.log("Sending chat request with:", {
        agentName: activeAgent?.name,
        agentId: selectedAgentId || activeAgent?.id,
        model: textModel,
        systemPromptPreview: enhancedSystemPrompt.substring(0, 100) + "..."
      });
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: useChatStore.getState().getActiveChatMessages(),
          model: textModel,
          systemPrompt: enhancedSystemPrompt,
          agentId: selectedAgentId || activeAgent?.id,
          // Send the full agent directly in proper format to ensure it's used
          agent: {
            id: activeAgent?.id,
            name: activeAgent?.name,
            systemPrompt: systemPrompt,
            system_prompt: systemPrompt, // Include both formats
            description: activeAgent?.description
          }
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get response');
      }

      // Process mcpDirectives if any
      const assistantMessageContent: MessageContent[] = [{ type: 'text', content: data.message }];
      
      if (data.mcpDirectives && Array.isArray(data.mcpDirectives)) {
        // Get the latest settings state again to ensure we have the most up-to-date values
        const currentSettings = useSettingsStore.getState();
        
        data.mcpDirectives.forEach((directive: MCPDirective) => {
          // Use agent's preferred models for directives if available
          let content;
          if (directive.type === 'image') {
            const imageModel = activeAgent.modelPreferences?.imageModel || currentSettings.activeImageModel;
            content = generateMCPImageUrl(directive.content, { model: imageModel });
          } else {
            const voice = activeAgent.modelPreferences?.voiceModel || currentSettings.activeVoice;
            content = generateMCPAudioUrl(directive.content, voice);
          }
          
          assistantMessageContent.push({
            type: directive.type as "image" | "audio",
            content
          });
        });
      }
      
      // Add assistant response to chat
      const assistantMessage: Message = {
        role: 'assistant',
        content: assistantMessageContent
      };
      
      addMessage(assistantMessage);
    } catch (error) {
      console.error('Error in MCP request:', error);
      throw error;
    }
  };

  // Return the function
  return { sendRequest };
}

/**
 * Generate an image URL for MCP
 * @param prompt The text prompt to generate an image from
 * @param options Optional settings like dimensions and model
 * @returns Image URL that can be embedded directly
 */
export function generateMCPImageUrl(
  prompt: string,
  options: {
    width?: number;
    height?: number;
    model?: string;
    negativePrompt?: string;
  } = {}
): string {
  const encodedPrompt = encodeURIComponent(prompt);
  const width = options.width || 1024;
  const height = options.height || 1024;
  const model = options.model || 'flux.schnell';
  const negativePrompt = options.negativePrompt ? `&negative=${encodeURIComponent(options.negativePrompt)}` : '';
  
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${model}${negativePrompt}&nologo=true`;
}

/**
 * Generate audio URL for MCP
 * @param text The text to convert to speech
 * @param voice Voice ID to use
 * @returns Audio URL that can be embedded directly
 */
export function generateMCPAudioUrl(
  text: string,
  voice: string = 'alloy'
): string {
  // Add a special prefix to force the API to treat this as plain TTS rather than a new query
  const speechText = `Read this text: ${text}`;
  const encodedText = encodeURIComponent(speechText);
  return `https://text.pollinations.ai/${encodedText}?model=openai-audio&voice=${voice}&format=speech`;
}

/**
 * Helper function to create an MCP image markdown string
 * @param prompt Image description
 * @param options Image generation options
 * @returns Markdown string for MCP
 */
export function mcpImageMarkdown(
  prompt: string,
  options: {
    width?: number;
    height?: number;
    model?: string;
    alt?: string;
  } = {}
): string {
  const imageUrl = generateMCPImageUrl(prompt, options);
  const alt = options.alt || prompt;
  return `![${alt}](${imageUrl})`;
}

/**
 * Helper function to create an MCP audio markdown string
 * @param text Text to convert to speech
 * @param voice Voice ID
 * @returns Markdown string for MCP
 */
export function mcpAudioMarkdown(text: string, voice: string = 'alloy'): string {
  const audioUrl = generateMCPAudioUrl(text, voice);
  return `<audio controls src="${audioUrl}"></audio>`;
}

/**
 * Generate a full MCP response with both text and media
 * @param text Text response
 * @param mediaOptions Options for generating media
 * @returns Combined MCP response
 */
export function createMCPResponse(
  text: string,
  mediaOptions?: {
    imagePrompt?: string;
    imageModel?: string;
    audioText?: string;
    audioVoice?: string;
  }
): string {
  let response = text;
  
  if (mediaOptions?.imagePrompt) {
    const imageMarkdown = mcpImageMarkdown(mediaOptions.imagePrompt, {
      model: mediaOptions.imageModel || 'flux.schnell'
    });
    response += '\n\n' + imageMarkdown;
  }
  
  if (mediaOptions?.audioText) {
    const audioMarkdown = mcpAudioMarkdown(
      mediaOptions.audioText,
      mediaOptions.audioVoice || 'alloy'
    );
    response += '\n\n' + audioMarkdown;
  }
  
  return response;
}

/**
 * Extract MCP directives from a text response
 */
export function extractMCPDirectives(text: string): { 
  cleanText: string;
  mcpDirectives: MCPDirective[];
} {
  let cleanText = text;
  const mcpDirectives: MCPDirective[] = [];
  
  // Extract image directives
  const imageMatches = [...text.matchAll(imageDirectiveRegex)];
  for (const match of imageMatches) {
    const [fullMatch, content] = match;
    if (content && content.trim()) {
      mcpDirectives.push({
        type: 'image',
        content: content.trim()
      });
      
      // Remove directive from clean text
      cleanText = cleanText.replace(fullMatch, '');
    }
  }
  
  // Extract audio directives
  const audioMatches = [...text.matchAll(audioDirectiveRegex)];
  for (const match of audioMatches) {
    const [fullMatch, content] = match;
    if (content && content.trim()) {
      mcpDirectives.push({
        type: 'audio',
        content: content.trim()
      });
      
      // Remove directive from clean text
      cleanText = cleanText.replace(fullMatch, '');
    }
  }
  
  // Clean up any extra whitespace
  cleanText = cleanText.trim();
  
  return {
    cleanText,
    mcpDirectives
  };
}

/**
 * Create a system prompt that enables MCP capabilities
 */
export function createMCPSystemPrompt(basePrompt: string): string {
  // First preserve the original system prompt exactly as is
  // The API will still work without appending MCP capability instructions
  // These instructions likely confuse the model and override the agent's personality
  return basePrompt;
  
  // Commented out the old version that appended MCP instructions
  /*
  return `${basePrompt}

You can generate images and audio for the user with these commands:
- To generate an image: !generate image: [detailed image description]
- To generate audio (text-to-speech): !generate audio: [text to convert to speech]

Example for generating an image:
!generate image: A beautiful mountain landscape at sunset with purple and orange sky

Example for generating audio:
!generate audio: Hello, this is a test of the text-to-speech system.`;
  */
}

/**
 * Parse the response from Pollinations API to handle MCP directives
 * @param response The API response to parse 
 * @returns Parsed message and MCP directives
 */
export function parseMCPResponse(response: any): {
  message: string;
  mcpDirectives: MCPDirective[];
} {
  try {
    console.log("Parsing MCP response:", typeof response, response ? JSON.stringify(response).substring(0, 100) + "..." : "null");
    
    // Handle different types of responses from the API
    let text = '';
    
    // Handle case where response is already a string
    if (typeof response === 'string') {
      // Check if it's a JSON string containing structured message
      if ((response.startsWith('[{') || response.startsWith('{"')) && 
          (response.includes('"type":"text"') || response.includes('"content":'))) {
        try {
          const parsed = JSON.parse(response);
          
          // Handle array of content items
          if (Array.isArray(parsed)) {
            const textItems = parsed.filter(item => 
              item.type === "text" && typeof item.content === "string"
            );
            
            if (textItems.length > 0) {
              text = textItems.map(item => item.content).join("\n");
              console.log("Extracted text from JSON array:", text.substring(0, 50) + "...");
            } else {
              text = response;
            }
          } 
          // Handle object with content property
          else if (parsed.content && typeof parsed.content === "string") {
            text = parsed.content;
            console.log("Extracted content from JSON object:", text.substring(0, 50) + "...");
          } else {
            text = response;
          }
        } catch (e) {
          // If parsing fails, use the original response
          text = response;
          console.log("Response is a string (not parseable JSON)");
        }
      } else {
        text = response;
        console.log("Response is a plain string");
      }
    }
    // Handle case where response contains text field
    else if (response && typeof response.text === 'string') {
      text = response.text;
      console.log("Using response.text");
    }
    // Handle case where response might be structured differently
    else if (response && typeof response.content === 'string') {
      text = response.content;
      console.log("Using response.content");
    }
    // Handle case where response has a message field (common in our API)
    else if (response && typeof response.message === 'string') {
      text = response.message;
      console.log("Using response.message");
    }
    // Handle case where response has a choices array (like OpenAI format)
    else if (response && Array.isArray(response.choices) && response.choices.length > 0) {
      const choice = response.choices[0];
      if (choice.message && typeof choice.message.content === 'string') {
        text = choice.message.content;
        console.log("Using response.choices[0].message.content");
      } else if (typeof choice.text === 'string') {
        text = choice.text;
        console.log("Using response.choices[0].text");
      }
    }
    // Handle unexpected response format
    else {
      try {
        // Try to stringify and use the whole response as text
        text = JSON.stringify(response);
        console.log("Stringified entire response");
      } catch (e) {
        // Fallback if stringification fails
        text = "Couldn't parse response from the AI.";
        console.error("Failed to stringify response:", e);
      }
    }
    
    // Extract MCP directives from the text
    const { cleanText, mcpDirectives } = extractMCPDirectives(text);
    
    console.log("Parsed MCP response:", {
      messagePreview: cleanText.substring(0, 50) + "...",
      directives: mcpDirectives.length
    });
    
    return {
      message: cleanText,
      mcpDirectives
    };
  } catch (error) {
    console.error("Error parsing MCP response:", error);
    return {
      message: "There was an error processing the AI's response.",
      mcpDirectives: []
    };
  }
}