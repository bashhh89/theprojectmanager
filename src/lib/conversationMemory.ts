/**
 * Conversation Memory Helper
 * Utilities for handling conversation context and message processing for AI interactions
 */

// Define message types to match what the API expects
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class ConversationMemory {
  /**
   * Process array of messages into a standardized format for AI conversation
   */
  static processMessages(messages: any[]): Message[] {
    if (!Array.isArray(messages)) {
      return [];
    }

    return messages.filter(msg => {
      // Ensure only valid messages are included
      return (
        msg && 
        typeof msg === 'object' && 
        (msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system') &&
        typeof msg.content === 'string' &&
        msg.content.trim().length > 0
      );
    }).map(msg => ({
      role: msg.role,
      content: msg.content.trim()
    }));
  }

  /**
   * Create a summary of the conversation context for debugging
   */
  static summarizeContext(messages: Message[]): string {
    if (!messages || messages.length === 0) {
      return "Empty context";
    }

    return messages.map((msg, idx) => {
      const contentPreview = msg.content.length > 20 
        ? `${msg.content.substring(0, 20)}...` 
        : msg.content;
      return `[${idx}] ${msg.role}: ${contentPreview}`;
    }).join(' | ');
  }
} 