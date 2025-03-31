'use client';

import { useEffect } from "react";
import AgentList from "@/components/agents/AgentList";
import { useSettingsStore } from "@/store/settingsStore";

export default function AgentsPage() {
  const { darkMode, setDarkMode } = useSettingsStore();
  
  // Set dark mode on initial load
  useEffect(() => {
    setDarkMode(true);
    
    // Add dark class to document for Tailwind dark mode
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('dark');
    }
    
    // Clean up function to remove the class when component unmounts
    return () => {
      if (typeof document !== 'undefined') {
        // Only remove if we're navigating away, don't remove if dark mode is still true
        if (!darkMode) {
          document.documentElement.classList.remove('dark');
        }
      }
    };
  }, [setDarkMode]);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl bg-background text-foreground">
      <h1 className="text-3xl font-bold mb-8">Agent Builder</h1>
      <AgentList />
    </div>
  );
}