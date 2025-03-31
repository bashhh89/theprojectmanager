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
import { toast } from '@/components/ui/use-toast';

interface MCPDirectives {
  image?: {
    url: string;
    description?: string;
  };
  audio?: {
    url: string;
    description?: string;
  };
}

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
      let textModel = activeAgent?.modelPreferences?.textModel || settingsState.activeTextModel;
      
      // Ensure model has correct provider prefix
      if (!textModel.startsWith('google-') && !textModel.startsWith('pollinations-')) {
        // If no prefix, default to Google
        console.log("Model missing provider prefix, adding 'google-' prefix:", textModel);
        textModel = `google-${textModel}`;
      }
      
      // Ensure we have a valid system prompt - support both camelCase and snake_case formats
      const systemPrompt = activeAgent?.systemPrompt || activeAgent?.system_prompt || "You are a helpful assistant.";
      
      // Add a prefix to the system prompt to make it obvious which agent is being used
      const enhancedSystemPrompt = `[USING AGENT: ${activeAgent?.name || "Default Assistant"}]\n\n${systemPrompt}`;
      
      // Get all messages from the chat store
      const messages = useChatStore.getState().getActiveChatMessages();
      
      // Format messages for the API
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: Array.isArray(msg.content) 
          ? msg.content
              .filter(c => c.type === "text")
              .map(c => c.content)
              .join("\n")
          : msg.content
      }));
      
      // Add the new user message
      formattedMessages.push({
        role: "user",
        content: userInput
      });
      
      console.log("Sending chat request with:", {
        messageCount: formattedMessages.length,
        model: textModel,
        systemPromptPreview: enhancedSystemPrompt.substring(0, 100) + "..."
      });
      
      // Make API call
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: formattedMessages,
          model: textModel,
          systemPrompt: enhancedSystemPrompt,
          agentId: selectedAgentId || activeAgent?.id,
          agent: {
            id: activeAgent?.id,
            name: activeAgent?.name,
            systemPrompt: systemPrompt,
            system_prompt: systemPrompt,
            description: activeAgent?.description,
            modelPreferences: activeAgent?.modelPreferences
          }
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Unknown error occurred");
      }
      
      // Add the response to the chat
      addMessage({
        role: "assistant",
        content: [{ type: "text", content: data.message }]
      });
      
      // Handle any MCP directives (for images, audio, etc.)
      if (data.mcpDirectives) {
        handleMcpDirectives(data.mcpDirectives, addMessage);
      }
      
      return data;
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error in sendRequest:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to send message",
          variant: "destructive"
        });
        throw error;
      }
      // Handle non-Error objects
      console.error("Unknown error in sendRequest:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      throw new Error("An unexpected error occurred");
    }
  };

  return {
    sendRequest
  };
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
  const model = options.model || 'turbo';
  const negativePrompt = options.negativePrompt ? `&negative=${encodeURIComponent(options.negativePrompt)}` : '';
  
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${model}${negativePrompt}&nologo=true&safety=off`;
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

/**
 * Processes an image generation request from a message
 * @param message The message to process
 * @param addMessage Function to add a message to the chat
 * @param setIsGenerating Function to update generating state
 * @param activeAgent Current active agent
 * @param imageModelId Default image model ID
 * @returns True if the message was processed as an image generation request
 */
export function processImageGenerationRequest(
  message: string,
  addMessage: (message: Message) => void,
  setIsGenerating: (isGenerating: boolean) => void,
  activeAgent: any = null,
  imageModelId: string = 'turbo'
): boolean {
  // Check if this is an image generation request
  if (message.startsWith('!generate image:')) {
    console.log('Processing image generation request');
    // Get the prompt from the message
    try {
      let promptText = message.substring('!generate image:'.length).trim();
      let imageOptions = {
        prompt: promptText,
        safety: false, // Default to safety off
        nologo: true   // Default to no logo
      };
      
      // Check if this is a JSON options object
      if (promptText.startsWith('{') && promptText.endsWith('}')) {
        try {
          const optionsObj = JSON.parse(promptText);
          imageOptions = {
            ...imageOptions,
            ...optionsObj
          };
          promptText = imageOptions.prompt;
        } catch (e) {
          console.error('Error parsing image options:', e);
          // Continue with the original prompt if parsing fails
        }
      }
      
      // Add user message about the image
      const userMessage: Message = {
        role: "user",
        content: [{ type: "text", content: `Generate image: ${promptText}` }]
      };
      
      addMessage(userMessage);
      
      // Add assistant message with placeholder
      const placeholderMessage: Message = {
        role: "assistant",
        content: [
          { type: "text", content: "Generating image..." },
          { type: "image", content: "placeholder" }
        ]
      };
      
      addMessage(placeholderMessage);
      
      const modelType = activeAgent?.imageModel || imageModelId || 'turbo';
      console.log(`Using image model: ${modelType}`);
      
      // Create the options for the image generator
      const imageGenOptions = {
        model: modelType,
        prompt: promptText,
        safety: false,  // Always set safety to false
        nologo: true    // Always set nologo to true
      };
      
      console.log('Image generation options:', imageGenOptions);
      
      // Generate the image
      fetch('/api/image-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(imageGenOptions),
      })
      .then(imageResponse => {
        if (!imageResponse.ok) {
          throw new Error(`Image generation failed: ${imageResponse.statusText}`);
        }
        return imageResponse.json();
      })
      .then(imageResult => {
        if (imageResult.image) {
          console.log('Image generated successfully');
          
          // Create the message with the generated image
          const successMessage: Message = {
            role: "assistant",
            content: [
              { type: "text", content: "Here's the image you requested:" },
              { type: "image", content: imageResult.image }
            ]
          };
          
          // Replace the placeholder message
          const chatStore = useChatStore.getState();
          const activeChatId = chatStore.activeChatId;
          
          if (activeChatId) {
            const chatSessions = chatStore.chatSessions;
            const activeChat = chatSessions.find(chat => chat.id === activeChatId);
            
            if (activeChat && activeChat.messages.length > 0) {
              const updatedSessions = chatStore.chatSessions.map(chat => {
                if (chat.id === activeChatId) {
                  const updatedMessages = [...chat.messages];
                  // Replace the last message (which should be the placeholder)
                  updatedMessages[updatedMessages.length - 1] = successMessage;
                  
                  return {
                    ...chat,
                    messages: updatedMessages,
                    updatedAt: new Date()
                  };
                }
                return chat;
              });
              
              useChatStore.setState({ chatSessions: updatedSessions });
            }
          }
        } else {
          throw new Error('Image generation failed: No image returned');
        }
      })
      .catch(error => {
        console.error('Error generating image:', error);
        
        // Add error message
        const errorMessage: Message = {
          role: "assistant",
          content: [{ type: "text", content: `Sorry, there was an error generating the image. ${error.message}` }]
        };
        
        addMessage(errorMessage);
      })
      .finally(() => {
        setIsGenerating(false);
      });
      
      return true;
    } catch (error) {
      console.error('Error in image generation:', error);
      setIsGenerating(false);
      return true;
    }
  }
  
  setIsGenerating(false);
  return false;
}

// Helper function to handle MCP directives
const handleMcpDirectives = (directives: MCPDirectives, addMessage: (message: Message) => void) => {
  if (!directives) return;
  
  // Handle image directives
  if (directives.image) {
    addMessage({
      role: "assistant",
      content: [
        { type: "text", content: directives.image.description || "Here's the generated image:" },
        { type: "image", content: directives.image.url }
      ]
    });
  }
  
  // Handle audio directives
  if (directives.audio) {
    addMessage({
      role: "assistant",
      content: [
        { type: "text", content: directives.audio.description || "Here's the generated audio:" },
        { type: "audio", content: directives.audio.url }
      ]
    });
  }
};