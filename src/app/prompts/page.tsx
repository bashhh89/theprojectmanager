"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Search, Tag, Trash2, Edit2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toasts } from '@/components/ui/toast-wrapper';
import { usePromptStore } from '@/store/promptStore';

interface PromptFormData {
  id?: string;
  name: string;
  command: string;
  prompt: string;
  description: string;
  tags: string[];
}

const initialFormData: PromptFormData = {
  name: '',
  command: '',
  prompt: '',
  description: '',
  tags: []
};

export default function PromptsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<PromptFormData>(initialFormData);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  
  const { prompts, addPrompt, updatePrompt, deletePrompt } = usePromptStore();

  // Load available tags from all prompts
  useEffect(() => {
    const tags = new Set<string>();
    prompts.forEach(prompt => {
      prompt.tags?.forEach(tag => tags.add(tag));
    });
    setAvailableTags(Array.from(tags));
  }, [prompts]);

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = searchQuery.toLowerCase() === '' ||
      prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTags = selectedTags.length === 0 ||
      selectedTags.every(tag => prompt.tags?.includes(tag));

    return matchesSearch && matchesTags;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!formData.name || !formData.prompt) {
        toasts.error('Name and prompt are required');
        return;
      }

      if (formData.command && !formData.command.startsWith('/')) {
        formData.command = '/' + formData.command;
      }

      if (editingPromptId) {
        updatePrompt(editingPromptId, {
          ...formData,
          id: editingPromptId
        });
        toasts.success('Prompt updated successfully');
      } else {
        addPrompt({
          ...formData,
          id: Date.now().toString()
        });
        toasts.success('Prompt created successfully');
      }

      setFormData(initialFormData);
      setShowForm(false);
      setEditingPromptId(null);
    } catch (error) {
      console.error('Error saving prompt:', error);
      toasts.error('Failed to save prompt');
    }
  };

  const handleEdit = (prompt: any) => {
    setFormData({
      name: prompt.name,
      command: prompt.command,
      prompt: prompt.prompt,
      description: prompt.description || '',
      tags: prompt.tags || []
    });
    setEditingPromptId(prompt.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this prompt?')) {
      deletePrompt(id);
      toasts.success('Prompt deleted successfully');
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Prompt Library</h1>
          <p className="text-muted-foreground mt-2">
            Manage your custom prompts and slash commands
          </p>
        </div>
        <Button onClick={() => {
          setFormData(initialFormData);
          setEditingPromptId(null);
          setShowForm(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          New Prompt
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="mb-6 flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search prompts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex-1">
              <select
                multiple
                value={selectedTags}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value);
                  setSelectedTags(values);
                }}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {availableTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredPrompts.map(prompt => (
              <div
                key={prompt.id}
                className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold">{prompt.name}</h3>
                    {prompt.command && (
                      <code className="px-2 py-1 rounded bg-muted text-sm">
                        {prompt.command}
                      </code>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(prompt)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(prompt.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {prompt.description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {prompt.description}
                  </p>
                )}
                <div className="text-sm bg-muted p-2 rounded">
                  <pre className="whitespace-pre-wrap font-mono">
                    {prompt.prompt}
                  </pre>
                </div>
                {prompt.tags && prompt.tags.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {prompt.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {filteredPrompts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No prompts found. Create your first prompt to get started.
              </div>
            )}
          </div>
        </div>

        {showForm && (
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="p-4 rounded-lg border bg-card">
                <h2 className="text-xl font-semibold mb-4">
                  {editingPromptId ? 'Edit Prompt' : 'New Prompt'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Give your prompt a name"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="command">Slash Command (optional)</Label>
                    <Input
                      id="command"
                      value={formData.command}
                      onChange={(e) => setFormData({ ...formData, command: e.target.value })}
                      placeholder="/command"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description (optional)</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="What does this prompt do?"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="prompt">Prompt Template</Label>
                    <Textarea
                      id="prompt"
                      value={formData.prompt}
                      onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                      placeholder="Enter your prompt template..."
                      rows={6}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use [variables] for dynamic content
                    </p>
                  </div>
                  
                  <div>
                    <Label>Tags</Label>
                    <div className="flex gap-2 mb-2">
                      {formData.tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:text-primary/70"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Add a tag"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                      />
                      <Button type="button" onClick={handleAddTag}>
                        Add
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false);
                        setFormData(initialFormData);
                        setEditingPromptId(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      <Save className="w-4 h-4 mr-2" />
                      {editingPromptId ? 'Update' : 'Save'} Prompt
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 