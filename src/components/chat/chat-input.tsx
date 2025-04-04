"use client"

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { usePromptStore } from '@/store/promptStore';
import { toasts } from '@/components/ui/toast-wrapper';
import { processMessage } from '@/lib/prompt-service';
import { PromptExecutionResult } from '@/types/prompts';

interface ChatInputProps {
  onSubmit: (message: string, result?: PromptExecutionResult) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export function ChatInput({
  onSubmit,
  isLoading = false,
  placeholder = 'Type a message or use / for commands...',
  className,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [commandFilter, setCommandFilter] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const commandsRef = useRef<HTMLDivElement>(null);
  const { prompts, initialize } = usePromptStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const filteredPrompts = prompts.filter(prompt => 
    prompt.command && (
      !commandFilter ||
      prompt.command.toLowerCase().includes(commandFilter.toLowerCase()) ||
      prompt.name.toLowerCase().includes(commandFilter.toLowerCase())
    )
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      if (showCommands && filteredPrompts.length > 0) {
        const selectedPrompt = filteredPrompts[0];
        setInput(selectedPrompt.prompt);
        setShowCommands(false);
        setCommandFilter('');
        return;
      }

      if (input.trim()) {
        handleSubmit();
      }
    } else if (e.key === 'Tab' && showCommands) {
      e.preventDefault();
      if (filteredPrompts.length > 0) {
        const selectedPrompt = filteredPrompts[0];
        setInput(selectedPrompt.prompt);
        setShowCommands(false);
        setCommandFilter('');
      }
    } else if (e.key === 'Escape' && showCommands) {
      e.preventDefault();
      setShowCommands(false);
      setCommandFilter('');
    } else if (e.key === '/' && !input) {
      e.preventDefault();
      setShowCommands(true);
      setCommandFilter('');
    }
  }, [input, showCommands, filteredPrompts]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);

    if (value.startsWith('/')) {
      setShowCommands(true);
      setCommandFilter(value.slice(1));
    } else {
      setShowCommands(false);
      setCommandFilter('');
    }

    // Adjust textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || isLoading || isProcessing) return;

    try {
      setIsProcessing(true);
      
      // Process the message for commands
      const result = await processMessage(input);
      
      // If the command failed, show an error
      if (!result.success) {
        toasts.error(result.error || 'Command failed');
        return;
      }

      // Send both the original input and the processed result
      onSubmit(input, result);
      
      setInput('');
      setShowCommands(false);
      setCommandFilter('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error submitting message:', error);
      toasts.error('Failed to send message');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePromptClick = (prompt: any) => {
    setInput(prompt.prompt);
    setShowCommands(false);
    setCommandFilter('');
    textareaRef.current?.focus();
  };

  // Close commands dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        commandsRef.current &&
        !commandsRef.current.contains(event.target as Node) &&
        !textareaRef.current?.contains(event.target as Node)
      ) {
        setShowCommands(false);
        setCommandFilter('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn('relative', className)}>
      {showCommands && (
        <div
          ref={commandsRef}
          className="absolute bottom-full left-0 w-full max-h-[300px] overflow-y-auto bg-background border rounded-lg shadow-lg mb-2"
        >
          {filteredPrompts.length > 0 ? (
            <div className="p-2 space-y-1">
              {filteredPrompts.map((prompt) => (
                <button
                  key={prompt.id}
                  className="w-full text-left px-3 py-2 hover:bg-muted rounded-md transition-colors"
                  onClick={() => handlePromptClick(prompt)}
                >
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-mono text-muted-foreground">
                      {prompt.command}
                    </code>
                    <span className="text-sm font-medium">{prompt.name}</span>
                  </div>
                  {prompt.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {prompt.description}
                    </p>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              No matching commands found
            </div>
          )}
        </div>
      )}

      <div className="relative flex items-center">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pr-12 max-h-[200px] min-h-[44px] py-3 resize-none"
          rows={1}
        />
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            'absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8',
            !input.trim() && 'opacity-50'
          )}
          disabled={!input.trim() || isLoading || isProcessing}
          onClick={handleSubmit}
        >
          {isLoading || isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}