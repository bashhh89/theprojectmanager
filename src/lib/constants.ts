export interface ModelCapabilities {
  reasoning?: boolean;
  vision?: boolean;
  audio?: boolean;
  censored?: boolean;
}

export interface ModelInfo extends ModelCapabilities {
  id: string;
  name: string;
  type: string;
  description: string;
  baseModel?: boolean;
  provider?: string;
  maxTokens?: number;
  voices?: string[];
}

export const MODEL_LIST = {
  TEXT: [
    {
      id: "openai",
      name: "OpenAI GPT-4o-mini",
      type: "chat",
      censored: true,
      description: "OpenAI GPT-4o-mini",
      baseModel: true,
      vision: true
    },
    {
      id: "openai-large",
      name: "OpenAI o4-large",
      type: "chat",
      censored: true,
      description: "OpenAI o4-large",
      baseModel: true,
      vision: true,
      audio: true
    },
    {
      id: "openai-reasoning",
      name: "OpenAI o3-mini",
      type: "chat",
      censored: true,
      description: "OpenAI o3-mini",
      baseModel: true,
      reasoning: true
    },
    {
      id: "mistral",
      name: "Mistral 7B",
      type: "chat",
      censored: true,
      description: "Mistral 7B",
      baseModel: true
    },
    {
      id: "llama",
      name: "Llama 3.3 70B",
      type: "chat",
      censored: true,
      description: "Llama 3.3 70B",
      baseModel: true
    },
    {
      id: "qwen-coder",
      name: "Qwen Coder",
      type: "chat",
      censored: true,
      description: "Qwen Coder - Specialized for coding tasks",
      baseModel: true
    },
    {
      id: "deepseek",
      name: "DeepSeek-V3",
      type: "chat",
      censored: true,
      description: "DeepSeek-V3",
      baseModel: true
    },
    {
      id: "deepseek-reasoner",
      name: "DeepSeek R1 - Full",
      type: "chat",
      censored: true,
      description: "DeepSeek R1 - Full",
      baseModel: true,
      reasoning: true,
      provider: "deepseek"
    },
    {
      id: "llama-vision",
      name: "Llama 3.2 11B Vision",
      type: "chat",
      censored: false,
      description: "Llama 3.2 11B Vision",
      baseModel: true,
      provider: "cloudflare",
      vision: true
    },
    {
      id: "openai-audio",
      name: "OpenAI GPT-4o Audio",
      type: "chat",
      censored: true,
      description: "OpenAI GPT-4o-audio-preview",
      baseModel: true,
      audio: true,
      voices: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer', 'coral', 'verse', 'ballad', 'ash', 'sage', 'amuch', 'dan']
    }
  ] as const,
  IMAGE: [
    {
      id: "flux",
      name: "Flux",
      type: "image",
      description: "Flux Image Generation",
      baseModel: true
    },
    {
      id: "turbo",
      name: "Turbo",
      type: "image",
      description: "Turbo Image Generation",
      baseModel: true
    }
  ] as const
} as const;

export type TextModel = typeof MODEL_LIST.TEXT[number]["id"];
export type ImageModel = typeof MODEL_LIST.IMAGE[number]["id"]; 