export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'command';
  content: string | { type: 'text' | 'image'; content: string }[];
  timestamp: number;
  metadata?: {
    result?: {
      success: boolean;
      error?: string;
    };
  };
}

export interface ChatState {
  messages: Message[];
  isGenerating: boolean;
  activeChatId: string | null;
  chatSessions: string[];
  addMessage: (message: Message) => void;
  handleStop: () => void;
} 