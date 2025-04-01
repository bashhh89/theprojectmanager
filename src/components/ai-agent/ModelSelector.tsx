import React from 'react';

interface ModelSelectorProps {
  selectedModel: string;
  onModelSelect: (modelId: string) => void;
}

interface Model {
  id: string;
  name: string;
}

// Define static model options instead of importing AVAILABLE_MODELS
const TEXT_MODELS = [
  { id: 'openai', name: 'OpenAI GPT-4' },
  { id: 'google-gemini-pro', name: 'Google Gemini Pro' },
  { id: 'gemini-1.5-flash-001', name: 'Gemini 1.5 Flash' },
  { id: 'gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro' }
];

// Group models by type
const modelGroups = {
  google: TEXT_MODELS.filter((model: Model) => 
    model.id.includes('google') || 
    model.id.includes('gemini')
  ),
  pollinations: TEXT_MODELS.filter((model: Model) => 
    !model.id.includes('google') && 
    !model.id.includes('gemini')
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
                  </div>
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
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 