import React from 'react';
import { AVAILABLE_MODELS } from '@/lib/pollinationsApi';

interface ModelSelectorProps {
  selectedModel: string;
  onModelSelect: (modelId: string) => void;
}

// Group models by type
const modelGroups = {
  google: AVAILABLE_MODELS.text.filter(model => 
    model.id.startsWith('google-') || 
    model.id.startsWith('gemini-')
  ),
  pollinations: AVAILABLE_MODELS.text.filter(model => 
    !model.id.startsWith('google-') && 
    !model.id.startsWith('gemini-') &&
    !model.baseModel
  )
};

export function ModelSelector({ selectedModel, onModelSelect }: ModelSelectorProps) {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-medium">Select AI Model</h3>
        <p className="text-sm text-gray-400 mt-1">Choose the AI model that will help structure your project</p>
      </div>
      
      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {/* Google Models */}
        <div className="p-3 border-b border-gray-700">
          <div className="text-xs font-medium text-gray-400 mb-2 uppercase">
            Google AI Models
          </div>
          <div className="space-y-1">
            {modelGroups.google.map((model) => (
              <button
                key={model.id}
                onClick={() => onModelSelect(model.id)}
                className={`w-full text-left p-2 rounded-lg transition-colors ${
                  selectedModel === model.id
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-700 text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{model.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{model.description}</div>
                  </div>
                  {model.vision && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-900/50 text-blue-200 ml-2">
                      Vision
                    </span>
                  )}
                  {model.reasoning && (
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-900/50 text-purple-200 ml-2">
                      Reasoning
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Pollinations Models */}
        <div className="p-3">
          <div className="text-xs font-medium text-gray-400 mb-2 uppercase">
            Pollinations AI Models
          </div>
          <div className="space-y-1">
            {modelGroups.pollinations.map((model) => (
              <button
                key={model.id}
                onClick={() => onModelSelect(`pollinations-${model.id}`)}
                className={`w-full text-left p-2 rounded-lg transition-colors ${
                  selectedModel === `pollinations-${model.id}`
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-700 text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{model.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{model.description}</div>
                  </div>
                  {model.vision && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-900/50 text-blue-200 ml-2">
                      Vision
                    </span>
                  )}
                  {model.reasoning && (
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-900/50 text-purple-200 ml-2">
                      Reasoning
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 