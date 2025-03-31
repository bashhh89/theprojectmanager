'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

export function AppInitializer() {
  const { setActiveAgent, setSelectedAgentId, agents } = useSettingsStore();

  // On component mount, check for last selected agent in session storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // First try to get the full agent object from session storage
        const fullAgentJson = sessionStorage.getItem('lastSelectedAgentFull');
        
        if (fullAgentJson) {
          // Parse the full agent object
          try {
            const storedAgent = JSON.parse(fullAgentJson);
            console.log("AppInitializer - Restoring full agent from session storage:", storedAgent.name);
            
            if (storedAgent && storedAgent.id && storedAgent.name && (storedAgent.systemPrompt || storedAgent.system_prompt)) {
              // Ensure both system prompt formats are present
              const systemPromptValue = storedAgent.systemPrompt || storedAgent.system_prompt;
              const completeAgent = {
                ...storedAgent,
                systemPrompt: systemPromptValue,
                system_prompt: systemPromptValue
              };
              
              setActiveAgent(completeAgent);
              setSelectedAgentId(completeAgent.id);
              console.log("AppInitializer - Successfully restored agent:", completeAgent.name);
              return; // Exit early since we've restored the agent
            }
          } catch (parseError) {
            console.error("AppInitializer - Error parsing full agent from session storage:", parseError);
            // Continue to fallback methods
          }
        }
        
        // Fallback to individual properties if full object isn't available
        const lastSelectedAgentId = sessionStorage.getItem('lastSelectedAgent');
        const lastSelectedAgentName = sessionStorage.getItem('lastSelectedAgentName');
        const lastSelectedAgentPrompt = sessionStorage.getItem('lastSelectedAgentPrompt');
        
        if (lastSelectedAgentId && lastSelectedAgentPrompt) {
          console.log("AppInitializer - Restoring agent from individual properties:", lastSelectedAgentName);
          
          // First try to find it in the agents list
          const foundAgent = agents.find(a => a.id === lastSelectedAgentId);
          
          if (foundAgent) {
            console.log("AppInitializer - Found agent in store, restoring:", foundAgent.name);
            setActiveAgent(foundAgent);
            setSelectedAgentId(lastSelectedAgentId);
          } else {
            // Create a temporary agent object if not found in the store
            console.log("AppInitializer - Agent not found in store, creating from session storage:", lastSelectedAgentName);
            setActiveAgent({
              id: lastSelectedAgentId,
              name: lastSelectedAgentName || 'Restored Agent',
              systemPrompt: lastSelectedAgentPrompt,
              system_prompt: lastSelectedAgentPrompt,
              description: `Restored agent: ${lastSelectedAgentName}`
            });
            setSelectedAgentId(lastSelectedAgentId);
          }
        } else {
          console.log("AppInitializer - No agent to restore from session storage");
        }
      } catch (error) {
        console.error("AppInitializer - Error restoring agent:", error);
      }
    }
  }, [setActiveAgent, setSelectedAgentId, agents]);

  // This component doesn't render anything visible
  return null;
} 