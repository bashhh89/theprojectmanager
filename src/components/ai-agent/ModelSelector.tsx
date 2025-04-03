import React from 'react';
import { AVAILABLE_MODELS } from '@/lib/pollinationsApi'; // Import the master list

interface ModelSelectorProps {
  selectedModel: string;
  onModelSelect: (modelId: string) => void;
}

interface Model {
  id: string;
  name: string;
  description?: string;
  reasoning?: boolean;
  vision?: boolean;
  audio?: boolean;
  uncensored?: boolean;
}

// Group models by capabilities for better organization, using the imported list
const modelGroups = {
  standard: AVAILABLE_MODELS.TEXT.filter((model) => 
    !model.reasoning && !model.vision && !model.audio && !model.uncensored
  ),
  reasoning: AVAILABLE_MODELS.TEXT.filter((model) => 
    model.reasoning === true
  ),
  multimodal: AVAILABLE_MODELS.TEXT.filter((model) => 
    (model.vision === true || model.audio === true) && !model.reasoning
  ),
  uncensored: AVAILABLE_MODELS.TEXT.filter((model) => 
    model.uncensored === true
  )
};

export function ModelSelector({ selectedModel, onModelSelect }: ModelSelectorProps) {
  return (
    <div className="bg-zinc-800 rounded-lg border border-zinc-700">
      <div className="p-4 border-b border-zinc-700">
        <h3 className="text-lg font-medium">Select AI Model</h3>
        <p className="text-sm text-zinc-400 mt-1">Choose the AI model for your conversation</p>
      </div>
      
      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {/* Standard Models */}
        <div className="p-3 border-b border-zinc-700">
          <div className="text-xs font-medium text-zinc-400 mb-2 uppercase">
            Standard Models
          </div>
          <div className="space-y-1">
            {modelGroups.standard.map((model) => (
              <button
                key={model.id}
                onClick={() => onModelSelect(model.id)}
                className={`w-full text-left p-2 rounded-lg transition-colors ${
                  selectedModel === model.id
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-zinc-700 text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{model.name}</div>
                    {model.description && (
                      <div className="text-xs text-zinc-400">{model.description}</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Reasoning Models */}
        {modelGroups.reasoning.length > 0 && (
          <div className="p-3 border-b border-zinc-700">
            <div className="text-xs font-medium text-zinc-400 mb-2 uppercase flex items-center">
              Reasoning Models
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-blue-600/30 text-blue-300">Advanced</span>
            </div>
            <div className="space-y-1">
              {modelGroups.reasoning.map((model) => (
                <button
                  key={model.id}
                  onClick={() => onModelSelect(model.id)}
                  className={`w-full text-left p-2 rounded-lg transition-colors ${
                    selectedModel === model.id
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-zinc-700 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{model.name}</div>
                      {model.description && (
                        <div className="text-xs text-zinc-400">{model.description}</div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Multimodal Models */}
        {modelGroups.multimodal.length > 0 && (
          <div className="p-3 border-b border-zinc-700">
            <div className="text-xs font-medium text-zinc-400 mb-2 uppercase flex items-center">
              Multimodal Models
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-purple-600/30 text-purple-300">Vision/Audio</span>
            </div>
            <div className="space-y-1">
              {modelGroups.multimodal.map((model) => (
                <button
                  key={model.id}
                  onClick={() => onModelSelect(model.id)}
                  className={`w-full text-left p-2 rounded-lg transition-colors ${
                    selectedModel === model.id
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-zinc-700 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{model.name}</div>
                      <div className="flex gap-1 mt-1">
                        {model.vision && (
                          <span className="px-1.5 py-0.5 text-xs rounded bg-purple-600/20 text-purple-300">Vision</span>
                        )}
                        {model.audio && (
                          <span className="px-1.5 py-0.5 text-xs rounded bg-green-600/20 text-green-300">Audio</span>
                        )}
                      </div>
                      {model.description && (
                        <div className="text-xs text-zinc-400 mt-1">{model.description}</div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Uncensored Models */}
        {modelGroups.uncensored.length > 0 && (
          <div className="p-3">
            <div className="text-xs font-medium text-zinc-400 mb-2 uppercase flex items-center">
              Uncensored Models
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-red-600/30 text-red-300">Explicit</span>
            </div>
            <div className="space-y-1">
              {modelGroups.uncensored.map((model) => (
                <button
                  key={model.id}
                  onClick={() => onModelSelect(model.id)}
                  className={`w-full text-left p-2 rounded-lg transition-colors ${
                    selectedModel === model.id
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-zinc-700 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{model.name}</div>
                      {model.description && (
                        <div className="text-xs text-zinc-400">{model.description}</div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 