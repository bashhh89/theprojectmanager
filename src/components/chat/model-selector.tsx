"use client";

import React, { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { MODEL_LIST } from '@/lib/constants';
import { TextModelId } from '@/store/settingsStore';
import { LucideIcon, Search, Sparkles, Brain, Eye, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModelSelectorProps {
  value: TextModelId;
  onValueChange: (value: TextModelId) => void;
}

interface IconWrapperProps {
  icon: LucideIcon;
  className?: string;
}

const IconWrapper: React.FC<IconWrapperProps> = ({ icon: Icon, className }) => (
  <Icon className={cn("w-4 h-4", className)} />
);

// Group models by category
const modelGroups = {
  standard: MODEL_LIST.TEXT.filter(model => 
    !model.reasoning && 
    !model.vision && 
    !model.audio && 
    model.censored !== false
  ),
  reasoning: MODEL_LIST.TEXT.filter(model => 
    model.reasoning === true
  ),
  multimodal: MODEL_LIST.TEXT.filter(model => 
    (model.vision === true || model.audio === true) && !model.reasoning
  )
};

// Get top 5 models to show in collapsed view
const topModels = [
  'openai',
  'openai-large',
  'mistral',
  'llama',
  'qwen-coder'
].filter(modelId => MODEL_LIST.TEXT.some(m => m.id === modelId));

export const ModelSelector: React.FC<ModelSelectorProps> = ({ value, onValueChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllModels, setShowAllModels] = useState(false);

  const filteredModels = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return MODEL_LIST.TEXT.filter(model => 
      model.name.toLowerCase().includes(query) || 
      model.id.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const getModelIcon = (modelId: string) => {
    const model = MODEL_LIST.TEXT.find(m => m.id === modelId);
    if (!model) return null;

    if (model.reasoning) return <IconWrapper icon={Brain} className="text-purple-400" />;
    if (model.vision) return <IconWrapper icon={Eye} className="text-blue-400" />;
    if (model.audio) return <IconWrapper icon={Volume2} className="text-green-400" />;
    return <IconWrapper icon={Sparkles} className="text-yellow-400" />;
  };

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-9 pl-3 pr-2 text-sm font-medium border border-zinc-700 bg-zinc-800 hover:bg-zinc-700/60 focus:ring-0 focus:border-zinc-600 rounded-md text-zinc-100 max-w-[180px]">
        <div className="flex items-center gap-2">
          {getModelIcon(value)}
          <span className="truncate max-w-[120px]">
            {MODEL_LIST.TEXT.find(m => m.id === value)?.name || value}
          </span>
        </div>
      </SelectTrigger>
      <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-100">
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 bg-zinc-700 border-zinc-600 text-zinc-100"
            />
          </div>
        </div>

        {!searchQuery && (
          <>
            <div className="px-2 py-1">
              <div className="text-xs text-zinc-500 font-medium">Quick Access</div>
              {topModels.map(modelId => {
                const model = MODEL_LIST.TEXT.find(m => m.id === modelId);
                if (!model) return null;
                return (
                  <SelectItem 
                    key={modelId} 
                    value={modelId}
                    className="text-sm hover:bg-zinc-700 focus:bg-zinc-700"
                  >
                    <div className="flex items-center gap-2">
                      {getModelIcon(modelId)}
                      <span>{model.name}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </div>

            <div className="px-2 py-1 border-t border-zinc-700">
              <div className="text-xs text-zinc-500 font-medium">Standard Models</div>
              {modelGroups.standard.map(model => (
                <SelectItem 
                  key={model.id} 
                  value={model.id}
                  className="text-sm hover:bg-zinc-700 focus:bg-zinc-700"
                >
                  <div className="flex items-center gap-2">
                    {getModelIcon(model.id)}
                    <span>{model.name}</span>
                  </div>
                </SelectItem>
              ))}
            </div>

            {modelGroups.reasoning.length > 0 && (
              <div className="px-2 py-1 border-t border-zinc-700">
                <div className="text-xs text-zinc-500 font-medium">Reasoning Models</div>
                {modelGroups.reasoning.map(model => (
                  <SelectItem 
                    key={model.id} 
                    value={model.id}
                    className="text-sm hover:bg-zinc-700 focus:bg-zinc-700"
                  >
                    <div className="flex items-center gap-2">
                      {getModelIcon(model.id)}
                      <span>{model.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </div>
            )}

            {modelGroups.multimodal.length > 0 && (
              <div className="px-2 py-1 border-t border-zinc-700">
                <div className="text-xs text-zinc-500 font-medium">Multimodal Models</div>
                {modelGroups.multimodal.map(model => (
                  <SelectItem 
                    key={model.id} 
                    value={model.id}
                    className="text-sm hover:bg-zinc-700 focus:bg-zinc-700"
                  >
                    <div className="flex items-center gap-2">
                      {getModelIcon(model.id)}
                      <span>{model.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </div>
            )}
          </>
        )}

        {searchQuery && (
          <div className="px-2 py-1">
            {filteredModels.length > 0 ? (
              filteredModels.map(model => (
                <SelectItem 
                  key={model.id} 
                  value={model.id}
                  className="text-sm hover:bg-zinc-700 focus:bg-zinc-700"
                >
                  <div className="flex items-center gap-2">
                    {getModelIcon(model.id)}
                    <span>{model.name}</span>
                  </div>
                </SelectItem>
              ))
            ) : (
              <div className="px-2 py-2 text-sm text-zinc-400">
                No models found
              </div>
            )}
          </div>
        )}
      </SelectContent>
    </Select>
  );
} 