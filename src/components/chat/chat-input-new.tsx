"use client";

import React, { useState, useRef, useEffect, KeyboardEvent, ChangeEvent, useMemo, useCallback } from 'react';
import { Send, Mic, Save, BookOpen } from 'lucide-react';
import { useChatStore } from "@/store/chatStore";
import { useMcpRequest } from "@/lib/mcpHelper";
import { useSettingsStore } from "@/store/settingsStore";
import { toasts } from '@/components/ui/toast-wrapper';
import { callPollinationsChat, AVAILABLE_MODELS, generatePollinationsAudio } from "@/lib/pollinationsApi"
import { showError, showSuccess, showInfo } from '@/components/ui/toast';
import { logError } from '@/utils/errorLogging';
import { cn } from '@/lib/utils';
import { useHotkeys } from 'react-hotkeys-hook';

// Types for saved prompts
interface SavedPrompt {
  id: string;
  name: string;
  prompt: string;
  command?: string; // Optional custom command
}

// Define available slash commands
const SLASH_COMMANDS = [
  { command: '/clear', description: 'Clear the current conversation' },
  { command: '/help', description: 'Show available commands and how to use them' },
  { command: '/summarize', description: 'Summarize the current conversation' },
  { command: '/image', description: 'Generate an image from text description' },
  { command: '/model', description: 'Change the current AI model' },
  { command: '/voice', description: 'Change the voice used for audio responses' },
  { command: '/agent', description: 'Switch to a different agent' },
  { command: '/save', description: 'Save current prompt for future use' },
  { command: '/prompts', description: 'Show your saved prompts' }
];

// Get saved prompts from localStorage or return empty array
const getSavedPrompts = (): SavedPrompt[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const savedPrompts = localStorage.getItem('savedPrompts');
    return savedPrompts ? JSON.parse(savedPrompts) : [];
  } catch (err) {
    console.error('Failed to load saved prompts:', err);
    return [];
  }
};

// Save prompts to localStorage
const savePromptToStorage = (prompts: SavedPrompt[]) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('savedPrompts', JSON.stringify(prompts));
  } catch (err) {
    console.error('Failed to save prompts:', err);
  }
};

// Add a ChatInputProps interface to match what chat-interface expects
interface ChatInputProps {
  onSubmit: (content: string) => void;
  isGenerating?: boolean;
}

// Add forwardRef to make the input ref accessible from parent
export const ChatInput = React.forwardRef<HTMLTextAreaElement, ChatInputProps>(({ onSubmit }, forwardedRef) => {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = (forwardedRef || internalRef) as React.RefObject<HTMLTextAreaElement>;

  const { sendRequest } = useMcpRequest();
  const addMessage = useChatStore(state => state.addMessage);
  const setIsGenerating = useChatStore(state => state.setIsGenerating);
  const { activeAgent } = useSettingsStore();
  const [value, setValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState(SLASH_COMMANDS);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const recognitionRef = useRef<any>(null);
  const autoPlayAfterVoiceInput = useSettingsStore(state => state.autoPlayAfterVoiceInput);
  const activeVoice = useSettingsStore(state => state.activeVoice);
  
  // State for saved prompts functionality
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [showPrompts, setShowPrompts] = useState(false);
  const [promptNameInput, setPromptNameInput] = useState('');
  const [promptCommandInput, setPromptCommandInput] = useState('');
  const [showSavePromptDialog, setShowSavePromptDialog] = useState(false);
  const [customCommands, setCustomCommands] = useState<typeof SLASH_COMMANDS>([]);
  
  // Add command history
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Load saved prompts on component mount
  useEffect(() => {
    setSavedPrompts(getSavedPrompts());
  }, []);
  
  // Support for speech recognition
  // Watch for window resize to adjust the height of textarea
  useEffect(() => {
    function handleResize() {
      if (textareaRef.current) {
        adjustTextareaHeight();
      }
    }
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Adjust height after component mounts
  useEffect(() => {
    if (textareaRef.current) {
      adjustTextareaHeight();
    }
  }, []);
  
  // Focus textarea on component mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);
  
  // Adjust the height of the textarea based on its content
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate new height (scrollHeight), but limit it
    const newHeight = Math.min(textarea.scrollHeight, 200); // Max height of 200px
    textarea.style.height = `${newHeight}px`;
  };
  
  // Function to get all available commands including custom ones
  const getAllCommands = useMemo(() => {
    return [...SLASH_COMMANDS, ...customCommands];
  }, [customCommands]);
  
  // Update the handleChange function to use all commands
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    adjustTextareaHeight();
    
    // Handle slash commands
    if (e.target.value.startsWith('/')) {
      const query = e.target.value.slice(1).toLowerCase();
      setFilteredCommands(
        getAllCommands.filter(cmd => 
          cmd.command.toLowerCase().slice(1).includes(query) || 
          cmd.description.toLowerCase().includes(query)
        )
      );
      setShowCommands(true);
      setSelectedCommandIndex(0);
      
      // Hide prompts menu if showing
      setShowPrompts(false);
    } else {
      setShowCommands(false);
    }
  };

  // Handle selecting and using slash commands
  const handleCommandSelect = (command: string) => {
    setValue(command + ' ');
    setShowCommands(false);
    textareaRef.current?.focus();
  };
  
  // Handle selecting a saved prompt
  const handlePromptSelect = (prompt: SavedPrompt) => {
    setValue(prompt.prompt);
    setShowPrompts(false);
    textareaRef.current?.focus();
    adjustTextareaHeight();
  };
  
  // Handle saving a new prompt
  const handleSavePrompt = () => {
    if (!value.trim()) {
      toasts.error('Cannot save an empty prompt');
      return;
    }
    
    setShowSavePromptDialog(true);
  };
  
  // Complete the save prompt process
  const completePromptSave = () => {
    if (!promptNameInput.trim()) {
      toasts.error('Please provide a name for your prompt');
      return;
    }
    
    const newPrompt: SavedPrompt = {
      id: Date.now().toString(),
      name: promptNameInput.trim(),
      prompt: value.trim(),
      command: promptCommandInput.trim() ? `/${promptCommandInput.trim()}` : undefined
    };
    
    const updatedPrompts = [...savedPrompts, newPrompt];
    setSavedPrompts(updatedPrompts);
    savePromptToStorage(updatedPrompts);
    
    setPromptNameInput('');
    setPromptCommandInput('');
    setShowSavePromptDialog(false);
    toasts.success(`Prompt "${newPrompt.name}" saved successfully`);
    
    // If a custom command was added, update the SLASH_COMMANDS
    if (newPrompt.command) {
      const newSlashCommand = { 
        command: newPrompt.command, 
        description: `Custom prompt: ${newPrompt.name}` 
      };
      setCustomCommands([...customCommands, newSlashCommand]);
    }
  };
  
  // Handle deleting a saved prompt
  const handleDeletePrompt = (id: string) => {
    const updatedPrompts = savedPrompts.filter(p => p.id !== id);
    setSavedPrompts(updatedPrompts);
    savePromptToStorage(updatedPrompts);
    toasts.success('Prompt deleted');
  };
  
  // Add smart paste handling
  const handlePaste = async (e: React.ClipboardEvent) => {
    try {
      const items = Array.from(e.clipboardData.items);
      const hasImage = items.some(item => item.type.startsWith('image/'));
      
      if (hasImage) {
        e.preventDefault();
        showInfo('Processing pasted image...');
        
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
              // Handle image paste - you can implement this based on your needs
              // For example, upload to storage and insert the URL
              showSuccess('Image pasted successfully');
            }
          }
        }
      }
    } catch (error) {
      logError({
        error: error instanceof Error ? error.toString() : 'Failed to handle paste',
        context: 'Chat Input Paste'
      });
      showError('Failed to process pasted content');
    }
  };

  useEffect(() => {
    if (historyIndex >= 0) {
      setValue(commandHistory[historyIndex] || '');
    }
  }, [historyIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle command history
    if (e.key === 'ArrowUp' && e.ctrlKey) {
      e.preventDefault();
      setHistoryIndex(prev => Math.min(prev + 1, commandHistory.length - 1));
      return;
    }
    if (e.key === 'ArrowDown' && e.ctrlKey) {
      e.preventDefault();
      setHistoryIndex(prev => Math.max(-1, prev - 1));
      return;
    }

    if (showCommands) {
      // Handle keyboard navigation for the command list
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCommandIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCommandIndex(prev => prev > 0 ? prev - 1 : 0);
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands.length > 0) {
          handleCommandSelect(filteredCommands[selectedCommandIndex].command);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowCommands(false);
      }
      return;
    }
    
    if (showPrompts) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowPrompts(false);
      }
      return;
    }
    
    // Handle form submission with Enter (but not with Shift+Enter)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  // Enhanced submit handler
  const handleSubmit = async () => {
    const trimmedValue = value.trim();
    
    if (!trimmedValue) return;

    try {
      // Add to command history
      setCommandHistory(prev => [trimmedValue, ...prev.slice(0, 49)]);
      setHistoryIndex(-1);

      // Handle submission
      await onSubmit(trimmedValue);
      setValue('');
      adjustTextareaHeight();
    } catch (error) {
      logError({
        error: error instanceof Error ? error.toString() : 'Failed to submit message',
        context: 'Chat Input Submit'
      });
      showError('Failed to send message');
    }
  };
  
  // Render the input component
  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Save prompt dialog */}
      {showSavePromptDialog && (
        <div className="absolute bottom-full mb-4 w-full bg-zinc-800 border border-zinc-700 rounded-lg p-4 z-20">
          <h3 className="text-zinc-200 font-medium mb-2">Save Prompt</h3>
          <input
            type="text"
            placeholder="Enter a name for this prompt"
            value={promptNameInput}
            onChange={(e) => setPromptNameInput(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 mb-3"
            autoFocus
          />
          <input
            type="text"
            placeholder="Custom command (optional, without /)"
            value={promptCommandInput}
            onChange={(e) => setPromptCommandInput(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 mb-3"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowSavePromptDialog(false)}
              className="px-4 py-2 rounded-md bg-zinc-700 text-zinc-200 hover:bg-zinc-600"
            >
              Cancel
            </button>
            <button
              onClick={completePromptSave}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500"
            >
              Save
            </button>
          </div>
        </div>
      )}
      
      {/* Saved prompts popup */}
      {showPrompts && savedPrompts.length > 0 && (
        <div className="absolute bottom-full mb-2 w-full bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden z-10">
          <div className="p-2 border-b border-zinc-700 text-xs text-zinc-400 flex justify-between items-center">
            <span>Your Saved Prompts</span>
            <button 
              onClick={() => setShowPrompts(false)}
              className="text-zinc-400 hover:text-zinc-200"
            >
              ESC to close
            </button>
          </div>
          <ul className="max-h-[300px] overflow-y-auto">
            {savedPrompts.map((prompt) => (
              <li 
                key={prompt.id}
                className="border-b border-zinc-700/50 last:border-0"
              >
                <div className="p-3 hover:bg-zinc-700 cursor-pointer">
                  <div className="flex justify-between">
                    <h4 className="font-medium text-zinc-200 mb-1">
                      {prompt.name}
                      {prompt.command && (
                        <span className="ml-2 text-xs bg-blue-900/40 text-blue-400 px-2 py-0.5 rounded">
                          {prompt.command}
                        </span>
                      )}
                    </h4>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePrompt(prompt.id);
                      }}
                      className="text-zinc-400 hover:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                  <p 
                    className="text-zinc-400 text-sm truncate"
                    onClick={() => handlePromptSelect(prompt)}
                  >
                    {prompt.prompt}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Empty saved prompts message */}
      {showPrompts && savedPrompts.length === 0 && (
        <div className="absolute bottom-full mb-2 w-full bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden z-10">
          <div className="p-4 text-center">
            <p className="text-zinc-400 mb-2">You don't have any saved prompts yet.</p>
            <p className="text-zinc-500 text-sm">Use "/save" to save prompts for future use.</p>
          </div>
        </div>
      )}
      
      <div className="relative flex items-end border border-zinc-700/75 rounded-lg bg-zinc-800/50 focus-within:border-zinc-600 p-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Message AI assistant... (Ctrl+Up/Down for history)"
          className="w-full resize-none bg-transparent border-none outline-none text-zinc-100 placeholder-zinc-500 py-2 px-2 min-h-[50px] max-h-[200px] overflow-y-auto"
          rows={1}
        />
        
        <div className="flex items-center">
          {/* View saved prompts button */}
          <button
            onClick={() => setShowPrompts(!showPrompts)}
            className="p-2 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
            title="View saved prompts"
          >
            <BookOpen size={18} />
          </button>
          
          {/* Save current prompt button */}
          <button
            onClick={handleSavePrompt}
            disabled={!value.trim()}
            className={`p-2 rounded-md ${
              value.trim() ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700' : 'text-zinc-600 cursor-not-allowed'
            }`}
            title="Save this prompt"
          >
            <Save size={18} />
          </button>
          
          {/* Send button */}
          <button
            onClick={handleSubmit}
            disabled={!value.trim()}
            className={`p-2 rounded-md ${
              value.trim() ? 'text-zinc-200 hover:bg-zinc-700' : 'text-zinc-500'
            }`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
      
      {/* Slash commands popup */}
      {showCommands && filteredCommands.length > 0 && (
        <div className="absolute bottom-full mb-2 w-full bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden z-10">
          <div className="p-2 border-b border-zinc-700 text-xs text-zinc-400">
            Available Commands
          </div>
          <ul className="max-h-[200px] overflow-y-auto">
            {filteredCommands.map((cmd, index) => (
              <li 
                key={cmd.command}
                onClick={() => handleCommandSelect(cmd.command)}
                className={`px-3 py-2 cursor-pointer hover:bg-zinc-700 flex justify-between items-center ${
                  index === selectedCommandIndex ? 'bg-zinc-700/70' : ''
                }`}
              >
                <span className="font-medium text-blue-400">{cmd.command}</span>
                <span className="text-sm text-zinc-400">{cmd.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});