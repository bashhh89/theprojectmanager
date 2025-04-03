"use client";

import { useState, useRef, useEffect } from 'react';
import { useSettingsStore, Agent } from '@/store/settingsStore';
import { cn } from '@/lib/utils';

export function AgentSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { activeAgent, setActiveAgent, agents } = useSettingsStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-card/60 hover:bg-card/80 text-foreground transition-colors"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-[10px] text-primary-foreground font-medium">
          {activeAgent?.name?.charAt(0) || 'G'}
        </div>
        <span className="text-sm font-medium max-w-[120px] truncate">{activeAgent?.name || 'General Assistant'}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14" 
          height="14"
          viewBox="0 0 24 24"
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className={cn("transition-transform", isOpen ? "rotate-180" : "")}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="fixed md:absolute top-[calc(100%+5px)] left-0 w-72 md:w-64 bg-card rounded-md border border-border shadow-lg overflow-hidden z-[100]">
          <div className="p-2 border-b border-border">
            <h3 className="text-xs font-semibold text-muted-foreground">SWITCH AGENT</h3>
          </div>
          <div className="max-h-[300px] overflow-y-auto py-1">
            {agents.map((agent) => (
              <button
                key={agent.id}
                className={cn(
                  "w-full text-left p-2 hover:bg-muted/50 flex items-start gap-2 transition-colors",
                  agent.id === activeAgent?.id ? "bg-primary/10" : ""
                )}
                onClick={() => {
                  setActiveAgent(agent);
                  setIsOpen(false);
                }}
              >
                <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  {agent.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{agent.name}</div>
                  {agent.description && (
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">{agent.description}</div>
                  )}
                </div>
                {agent.id === activeAgent?.id && (
                  <div className="ml-auto">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className="border-t border-border p-2">
            <button
              className="w-full text-left p-2 text-xs font-medium text-primary hover:bg-muted/50 rounded transition-colors"
              onClick={() => {
                // TODO: Open agent settings or management page
                setIsOpen(false);
              }}
            >
              Manage agents...
            </button>
          </div>
        </div>
      )}
    </div>
  );
}