import React, { useState } from 'react';
import { usePipelineStore } from '@/store/pipelineStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, PlusCircle, LayoutList } from 'lucide-react';

export function PipelineManager() {
  const { 
    pipelines, 
    currentPipelineId, 
    setCurrentPipeline, 
    addPipeline,
    deletePipeline,
    updatePipeline
  } = usePipelineStore();
  
  const [showNewPipeline, setShowNewPipeline] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState('');
  const [newPipelineDescription, setNewPipelineDescription] = useState('');
  const [showNewStage, setShowNewStage] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [newStageDescription, setNewStageDescription] = useState('');

  const handleAddPipeline = () => {
    if (!newPipelineName.trim()) return;
    
    addPipeline(newPipelineName.trim(), newPipelineDescription.trim());
    setNewPipelineName('');
    setNewPipelineDescription('');
    setShowNewPipeline(false);
  };

  const handleAddStage = () => {
    if (!newStageName.trim()) return;
    
    addPipeline(newStageName.trim(), newStageDescription.trim());
    setNewStageName('');
    setNewStageDescription('');
    setShowNewStage(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-card border rounded-md pl-2">
            <LayoutList size={16} className="text-muted-foreground" />
            <select
              value={currentPipelineId || ''}
              onChange={(e) => setCurrentPipeline(e.target.value)}
              className="border-0 py-1.5 bg-transparent text-sm focus:ring-0 focus:outline-none"
            >
              {pipelines.map((pipeline) => (
                <option key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewPipeline(true)}
            className="gap-1 text-xs"
          >
            <PlusCircle size={14} />
            Add Pipeline
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowNewStage(true)}
          className="gap-1 text-xs"
        >
          <PlusCircle size={14} />
          Add Stage
        </Button>
      </div>

      {showNewPipeline && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">New Pipeline</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => {
                  setNewPipelineName('');
                  setNewPipelineDescription('');
                  setShowNewPipeline(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Pipeline Name</Label>
                <Input
                  type="text"
                  value={newPipelineName}
                  onChange={(e) => setNewPipelineName(e.target.value)}
                  placeholder="Enter pipeline name"
                  className="w-full"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Description (optional)</Label>
                <Input
                  type="text"
                  value={newPipelineDescription}
                  onChange={(e) => setNewPipelineDescription(e.target.value)}
                  placeholder="Enter description"
                  className="w-full"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setNewPipelineName('');
                    setNewPipelineDescription('');
                    setShowNewPipeline(false);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddPipeline}>Save Pipeline</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showNewStage && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">New Stage</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => {
                  setNewStageName('');
                  setNewStageDescription('');
                  setShowNewStage(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Stage Name</Label>
                <Input
                  type="text"
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  placeholder="Enter stage name"
                  className="w-full"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Description (optional)</Label>
                <Input
                  type="text"
                  value={newStageDescription}
                  onChange={(e) => setNewStageDescription(e.target.value)}
                  placeholder="Enter description"
                  className="w-full"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setNewStageName('');
                    setNewStageDescription('');
                    setShowNewStage(false);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddStage}>Save Stage</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
} 