export interface ModelCapabilities {
  vision?: boolean;
  audio?: boolean;
  reasoning?: boolean;
  uncensored?: boolean;
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  provider: string;
  category: string;
  capabilities: ModelCapabilities;
  censored: boolean;
}

export interface AvailableModels {
  TEXT: ModelInfo[];
  IMAGE: ModelInfo[];
  AUDIO: ModelInfo[];
}

export type TextModel = ModelInfo['id'];
export type ImageModel = ModelInfo['id'];
export type AudioModel = ModelInfo['id'];

declare module '@/lib/constants' {
  export const AVAILABLE_MODELS: AvailableModels;
  export type { ModelInfo, ModelCapabilities, TextModel, ImageModel, AudioModel };
} 