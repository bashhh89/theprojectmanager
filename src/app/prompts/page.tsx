"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Search, Tag, Star, Trash2, ArrowLeft, Edit, Trash } from 'lucide-react';
import Link from 'next/link';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from 'next-themes';
import { usePromptStore, SavedPrompt } from '@/lib/prompt-service';

export default function PromptsPage() {
  const prompts = usePromptStore(state => state.prompts);
  const addPrompt = usePromptStore(state => state.addPrompt);
  const updatePrompt = usePromptStore(state => state.updatePrompt);
  const deletePrompt = usePromptStore(state => state.deletePrompt);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPrompts, setFilteredPrompts] = useState<SavedPrompt[]>(prompts);
  const [editingPrompt, setEditingPrompt] = useState<SavedPrompt | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newPrompt, setNewPrompt] = useState<{
    command: string;
    prompt: string;
    tags: string;
  }>({
    command: '',
    prompt: '',
    tags: ''
  });
  
  // Use next-themes
  const { theme, setTheme } = useTheme();
  
  // Access dark mode from settings
  const { darkMode, setDarkMode } = useSettingsStore();
  
  // Handle mounted state to prevent hydration issues
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync settings store with theme
  useEffect(() => {
    if (mounted) {
      setDarkMode(theme === 'dark');
    }
  }, [theme, setDarkMode, mounted]);

  // Filter prompts when search term changes
  useEffect(() => {
    if (searchTerm) {
      setFilteredPrompts(
        prompts.filter(prompt => 
          prompt.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prompt.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prompt.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      );
    } else {
      setFilteredPrompts(prompts);
    }
  }, [searchTerm, prompts]);

  // Save prompts to localStorage
  const savePrompts = (updatedPrompts: SavedPrompt[]) => {
    localStorage.setItem('saved_prompts', JSON.stringify(updatedPrompts));
  };

  const handleAddPrompt = () => {
    if (!newPrompt.command || !newPrompt.prompt) return;
    
    addPrompt({
      command: newPrompt.command,
      prompt: newPrompt.prompt,
      tags: newPrompt.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    });
    
    setNewPrompt({
      command: '',
      prompt: '',
      tags: ''
    });
    
    setIsAddingNew(false);
  };

  const handleUpdatePrompt = () => {
    if (!editingPrompt) return;
    
    updatePrompt(editingPrompt.id, {
      command: editingPrompt.command,
      prompt: editingPrompt.prompt,
      tags: editingPrompt.tags
    });
    
    setEditingPrompt(null);
  };

  const handleDeletePrompt = (id: string) => {
    if (confirm('Are you sure you want to delete this prompt?')) {
      deletePrompt(id);
    }
  };

  // Prevent rendering until after client-side hydration
  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="container mx-auto p-4 max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/chat" className="mr-4 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold">Prompt Library</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 mr-2"
            >
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              )}
            </button>
            
            <button 
              className="flex items-center gap-2 py-2 px-4 bg-primary rounded-md text-white hover:bg-primary/90"
              onClick={() => setIsAddingNew(true)}
            >
              <Plus size={16} />
              <span>New Prompt</span>
            </button>
          </div>
        </div>
        
        {/* Search and filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[300px] relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search prompts..."
              className="pl-10 p-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Prompt list */}
        {filteredPrompts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPrompts.map(prompt => (
              <div 
                key={prompt.id} 
                className="border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">{prompt.command}</h3>
                    <div className="flex items-center gap-1">
                      <button 
                        className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setEditingPrompt(prompt)}
                      >
                        <Edit size={16} className="text-gray-500" />
                      </button>
                      <button 
                        className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => handleDeletePrompt(prompt.id)}
                      >
                        <Trash size={16} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 max-h-24 overflow-y-auto">
                    {prompt.prompt}
                  </p>
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(prompt.tags || []).map(tag => (
                      <span 
                        key={tag} 
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800/80">
                  <button 
                    className="w-full py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-md text-sm font-medium"
                    onClick={() => {
                      // Implement using this prompt in the chat
                      console.log('Using prompt:', prompt.prompt);
                    }}
                  >
                    Use Prompt
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">No prompts found</p>
            {searchTerm && (
              <button 
                className="mt-2 text-primary hover:underline text-sm"
                onClick={() => setSearchTerm('')}
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* New prompt form modal */}
      {isAddingNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Create New Prompt</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Command (without slash)</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900"
                    placeholder="e.g. summarize"
                    value={newPrompt.command}
                    onChange={(e) => setNewPrompt({...newPrompt, command: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Prompt Template</label>
                  <textarea
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 min-h-[120px]"
                    placeholder="e.g. Summarize the following text: [text]"
                    value={newPrompt.prompt}
                    onChange={(e) => setNewPrompt({...newPrompt, prompt: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
                  <div className="flex items-center">
                    <Tag size={16} className="text-gray-400 mr-2" />
                    <input
                      type="text"
                      className="flex-1 p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900"
                      placeholder="e.g. productivity, writing"
                      value={newPrompt.tags}
                      onChange={(e) => setNewPrompt({...newPrompt, tags: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md"
                  onClick={() => setIsAddingNew(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-primary text-white rounded-md disabled:bg-gray-400"
                  onClick={handleAddPrompt}
                  disabled={!newPrompt.command.trim() || !newPrompt.prompt.trim()}
                >
                  Save Prompt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {editingPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Edit Prompt</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Command (without slash)</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900"
                    placeholder="e.g. summarize"
                    value={editingPrompt.command}
                    onChange={(e) => setEditingPrompt({...editingPrompt, command: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Prompt Template</label>
                  <textarea
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 min-h-[120px]"
                    placeholder="e.g. Summarize the following text: [text]"
                    value={editingPrompt.prompt}
                    onChange={(e) => setEditingPrompt({...editingPrompt, prompt: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
                  <div className="flex items-center">
                    <Tag size={16} className="text-gray-400 mr-2" />
                    <input
                      type="text"
                      className="flex-1 p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900"
                      placeholder="e.g. productivity, writing"
                      value={editingPrompt.tags?.join(', ') || ''}
                      onChange={(e) => setEditingPrompt({
                        ...editingPrompt, 
                        tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                      })}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md"
                  onClick={() => setEditingPrompt(null)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
                  onClick={handleUpdatePrompt}
                >
                  Update Prompt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 