'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, SendHorizonal, AlertCircle, Settings, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import anythingLlmService, { anythingLlmApi, normalizeApiUrl } from '@/services/anythingLlmService';

// Interface for chat messages
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export default function SimpleAnythingLLM() {
  const [connected, setConnected] = useState(false);
  const [workspace, setWorkspace] = useState<any>(null);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [apiUrl, setApiUrl] = useState(
    process.env.NEXT_PUBLIC_ANYTHINGLLM_API_URL || 'https://anythingllm-xlmp.onrender.com/api'
  );
  const [showDebug, setShowDebug] = useState(false);
  const [debugMessages, setDebugMessages] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Add predefined connection options for Render
  const connectionOptions = [
    { name: "Public URL", url: "https://anythingllm-xlmp.onrender.com/api" },
    { name: "Render Internal", url: "http://anythingllm-xlmp:3001/api" },
    { name: "Local (Desktop App)", url: "http://localhost:3001/api" },
  ];

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Initialize on component mount
  useEffect(() => {
    const initConnection = async () => {
      addDebugMessage('Starting AnythingLLM connection...');
      
      // Try each connection option in order
      for (const option of connectionOptions) {
        addDebugMessage(`Trying ${option.name} connection: ${option.url}...`);
        try {
          const normalizedUrl = normalizeApiUrl(option.url);
          const connectionResult = await anythingLlmService.connect(normalizedUrl);
          
          if (connectionResult.success) {
            addDebugMessage(`✅ Connected via ${option.name}!`);
            setApiUrl(normalizedUrl);
            setConnected(true);
            
            // Get workspaces
            const workspaces = anythingLlmService.getWorkspaces();
            setWorkspaces(workspaces);
            
            if (workspaces.length > 0) {
              const firstWorkspace = workspaces[0];
              anythingLlmService.setWorkspace(firstWorkspace.slug);
              setWorkspace(firstWorkspace);
              
              addSystemMessage(`Connected to AnythingLLM. Using workspace: ${firstWorkspace.name}`);
            } else {
              addDebugMessage('No workspaces found. Please create one in AnythingLLM first.');
              addSystemMessage('No workspaces found. Please create a workspace in AnythingLLM first.');
            }
            
            return; // Exit the loop on success
          }
        } catch (error) {
          addDebugMessage(`Failed to connect via ${option.name}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      // If we get here, all connection attempts failed
      addSystemMessage('Could not connect to AnythingLLM. Please check if it\'s running or enter a URL manually.');
    };
    
    initConnection();
  }, []);
  
  // Helper to add debug messages
  const addDebugMessage = (message: string) => {
    console.log(message);
    setDebugMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };
  
  // Helper to add system messages
  const addSystemMessage = (content: string) => {
    setMessages(prev => [
      ...prev,
      {
        role: 'system',
        content,
        timestamp: new Date()
      }
    ]);
  };
  
  // Send a message to AnythingLLM
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || !workspace || isLoading || !anythingLlmService.isConnected()) {
      return;
    }
    
    // Add user message to chat
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      addDebugMessage(`Sending message to workspace: ${workspace.slug}`);
      
      // Send message to AnythingLLM
      const result = await anythingLlmService.sendMessage(input);
      
      if (result.success) {
        // Add assistant response to chat
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: result.text,
            timestamp: new Date()
          }
        ]);
        
        addDebugMessage('Message sent and response received successfully');
      } else {
        // Handle error response
        addDebugMessage(`❌ Error from AnythingLLM: ${result.text}`);
        addSystemMessage(`Error: ${result.text}`);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      addDebugMessage(`❌ Error sending message: ${error.message}`);
      addSystemMessage(`Error sending message: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle workspace change
  const handleWorkspaceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newWorkspace = e.target.value;
    if (newWorkspace) {
      setWorkspace(workspaces.find(w => w.slug === newWorkspace));
      anythingLlmService.setWorkspace(newWorkspace);
      
      const selectedWorkspaceName = workspaces.find(w => w.slug === newWorkspace)?.name || newWorkspace;
      addDebugMessage(`Switched to workspace: ${selectedWorkspaceName}`);
      addSystemMessage(`Switched to workspace: ${selectedWorkspaceName}`);
    }
  };
  
  // Retry automatic connection
  const handleRetryConnection = async () => {
    setIsLoading(true);
    addDebugMessage('Retrying connection...');
    
    try {
      // Clear messages
      setMessages([]);
      
      // Try discovery again
      const discoveryResult = await anythingLlmService.discover();
      
      if (discoveryResult.success) {
        addDebugMessage(`✅ Connection successful! Using ${discoveryResult.apiUrl}`);
        
        // Get workspaces
        const workspaces = anythingLlmService.getWorkspaces();
        setWorkspaces(workspaces);
        
        if (workspaces.length > 0) {
          // Use the first workspace
          const firstWorkspace = workspaces[0];
          anythingLlmService.setWorkspace(firstWorkspace.slug);
          setWorkspace(firstWorkspace);
          
          addSystemMessage(`Connected to workspace: ${firstWorkspace.name}`);
        } else {
          addDebugMessage('No workspaces found!');
          addSystemMessage('No workspaces found. Please create one in AnythingLLM.');
        }
      } else {
        addDebugMessage(`❌ Connection failed: ${discoveryResult.message}`);
        addSystemMessage(`Connection failed: ${discoveryResult.message}`);
      }
    } catch (error: any) {
      console.error('Error during retry:', error);
      addDebugMessage(`❌ Error during retry: ${error.message}`);
      addSystemMessage(`Connection error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <Card className="w-full h-[70vh] flex flex-col">
        <CardHeader className="px-4 py-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">AnythingLLM Assistant</CardTitle>
              <CardDescription>Connect to your documents using AnythingLLM</CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Status indicator */}
              <div className="flex items-center gap-2">
                <div 
                  className={cn("w-2 h-2 rounded-full", {
                    "bg-yellow-400 animate-pulse": isLoading,
                    "bg-green-500": connected,
                    "bg-red-500": !connected,
                  })}
                />
                <span className="text-sm text-muted-foreground">
                  {isLoading ? 'Connecting...' : connected ? 'Connected' : 'Connection Error'}
                </span>
              </div>
              
              {/* Settings toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDebug(prev => !prev)}
                title="Show debug info"
              >
                <AlertCircle size={16} />
              </Button>
              
              {/* Retry connection */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRetryConnection}
                disabled={isLoading || connected}
                title="Retry connection"
              >
                <RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} />
              </Button>
            </div>
          </div>
          
          {/* Connection settings */}
          {showDebug && (
            <div className="mt-2 pt-2 border-t">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Connection Settings</h3>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="AnythingLLM API URL"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    disabled={isLoading || connected}
                  />
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Enter the URL to your AnythingLLM instance, e.g. http://localhost:3001/api
                </p>
              </div>
            </div>
          )}
          
          {/* Workspace selector */}
          {connected && workspaces.length > 0 && (
            <div className="mt-2 pt-2 border-t">
              <div className="flex flex-col gap-1">
                <label htmlFor="workspace-select" className="text-sm font-medium">
                  Workspace
                </label>
                <select
                  id="workspace-select"
                  className="p-2 rounded-md border bg-background"
                  value={workspace.slug || ''}
                  onChange={handleWorkspaceChange}
                >
                  {workspaces.map((ws) => (
                    <option key={ws.slug} value={ws.slug}>
                      {ws.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </CardHeader>
        
        {/* Debug panel */}
        {showDebug && (
          <div className="px-4 py-2 border-b bg-muted/30 text-xs font-mono overflow-auto max-h-[20vh]">
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-semibold">Debug Log</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDebugMessages([])}
                className="h-6 text-xs"
              >
                Clear
              </Button>
            </div>
            <div className="space-y-1">
              {debugMessages.map((info, i) => (
                <div key={i} className={info.includes('❌') ? 'text-red-500' : ''}>
                  {info}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Chat messages */}
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            {messages.map((message, i) => (
              <div
                key={i}
                className={cn("flex", {
                  "justify-end": message.role === "user",
                  "justify-start": message.role !== "user",
                })}
              >
                <div
                  className={cn("p-3 rounded-lg max-w-[80%]", {
                    "bg-primary text-primary-foreground": message.role === "user",
                    "bg-muted": message.role === "assistant",
                    "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200": message.role === "system",
                  })}
                >
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Chat input */}
        <div className="p-4 border-t mt-auto">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              placeholder={
                connected
                  ? "Type a message..."
                  : "Connecting to AnythingLLM..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading || !connected}
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim() || !connected}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizonal className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
} 