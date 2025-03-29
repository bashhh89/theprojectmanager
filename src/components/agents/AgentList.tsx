'use client';

import { useState, useEffect, MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Edit, Trash2, Code2, CheckCircle, Brain, ScrollText, Bot } from "lucide-react";
import AgentForm from "./AgentForm";
import { useSettingsStore } from "@/store/settingsStore";
import { supabase } from "@/lib/supabaseClient";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from "@/components/ui/badge";

interface Agent {
  id: string;
  name: string;
  system_prompt: string;
  created_at: string;
  owner_id: string;
  knowledge_source_info?: any;
}

// Sortable Item Component
function SortableAgentCard({ agent, onEdit, onDelete, onSelectActive, onGenerateWidget, isActive }: {
  agent: Agent;
  onEdit: (agent: Agent) => void;
  onDelete: (agent: Agent) => void;
  onSelectActive: (agent: Agent) => void;
  onGenerateWidget: (agent: Agent) => void;
  isActive: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: agent.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={`relative ${isActive ? 'ring-2 ring-primary' : ''} group hover:shadow-md transition-shadow duration-200 dark:border-gray-700`}
    >
      <div 
        className="absolute top-3 right-3 p-1 rounded-full bg-muted cursor-move opacity-50 group-hover:opacity-100"
        {...attributes}
        {...listeners}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 8C4 8.82843 3.32843 9.5 2.5 9.5C1.67157 9.5 1 8.82843 1 8C1 7.17157 1.67157 6.5 2.5 6.5C3.32843 6.5 4 7.17157 4 8Z" fill="currentColor"/>
          <path d="M9.5 8C9.5 8.82843 8.82843 9.5 8 9.5C7.17157 9.5 6.5 8.82843 6.5 8C6.5 7.17157 7.17157 6.5 8 6.5C8.82843 6.5 9.5 7.17157 9.5 8Z" fill="currentColor"/>
          <path d="M15 8C15 8.82843 14.3284 9.5 13.5 9.5C12.6716 9.5 12 8.82843 12 8C12 7.17157 12.6716 6.5 13.5 6.5C14.3284 6.5 15 7.17157 15 8Z" fill="currentColor"/>
          <path d="M4 2.5C4 3.32843 3.32843 4 2.5 4C1.67157 4 1 3.32843 1 2.5C1 1.67157 1.67157 1 2.5 1C3.32843 1 4 1.67157 4 2.5Z" fill="currentColor"/>
          <path d="M9.5 2.5C9.5 3.32843 8.82843 4 8 4C7.17157 4 6.5 3.32843 6.5 2.5C6.5 1.67157 7.17157 1 8 1C8.82843 1 9.5 1.67157 9.5 2.5Z" fill="currentColor"/>
          <path d="M15 2.5C15 3.32843 14.3284 4 13.5 4C12.6716 4 12 3.32843 12 2.5C12 1.67157 12.6716 1 13.5 1C14.3284 1 15 1.67157 15 2.5Z" fill="currentColor"/>
          <path d="M4 13.5C4 14.3284 3.32843 15 2.5 15C1.67157 15 1 14.3284 1 13.5C1 12.6716 1.67157 12 2.5 12C3.32843 12 4 12.6716 4 13.5Z" fill="currentColor"/>
          <path d="M9.5 13.5C9.5 14.3284 8.82843 15 8 15C7.17157 15 6.5 14.3284 6.5 13.5C6.5 12.6716 7.17157 12 8 12C8.82843 12 9.5 12.6716 9.5 13.5Z" fill="currentColor"/>
          <path d="M15 13.5C15 14.3284 14.3284 15 13.5 15C12.6716 15 12 14.3284 12 13.5C12 12.6716 12.6716 12 13.5 12C14.3284 12 15 12.6716 15 13.5Z" fill="currentColor"/>
        </svg>
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 text-primary">
              <Bot />
            </div>
            <CardTitle>{agent.name}</CardTitle>
          </div>
          {isActive && (
            <Badge variant="outline" className="bg-primary/10 text-primary text-xs">Active</Badge>
          )}
        </div>
        <CardDescription className="flex items-center gap-1 text-xs">
          <div className="h-3 w-3">
            <ScrollText />
          </div>
          System prompt length: {agent.system_prompt.length} chars
        </CardDescription>
      </CardHeader>
      <CardContent className="py-2">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {agent.system_prompt}
        </p>
        {agent.knowledge_source_info && (
          <div className="mt-2 flex items-center text-xs text-muted-foreground">
            <div className="h-3 w-3 mr-1">
              <Brain />
            </div>
            <span>Knowledge base: {
              agent.knowledge_source_info.text ? 'Text' : 
              agent.knowledge_source_info.website ? 'Website' : 
              agent.knowledge_source_info.files?.length ? 'Files' : 'None'
            }</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className={`${isActive ? 'bg-primary/10' : ''}`}
          onClick={() => onSelectActive(agent)}
        >
          <div className="h-4 w-4 mr-1">
            <CheckCircle />
          </div>
          Select
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(agent)}
        >
          <div className="h-4 w-4 mr-1">
            <Edit />
          </div>
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(agent)}
        >
          <div className="h-4 w-4 mr-1">
            <Trash2 />
          </div>
          Delete
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onGenerateWidget(agent)}
        >
          <div className="h-4 w-4 mr-1">
            <Code2 />
          </div>
          Widget
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function AgentList() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [widgetAgent, setWidgetAgent] = useState<Agent | null>(null);
  const [widgetCode, setWidgetCode] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const { setActiveAgent, activeAgent } = useSettingsStore();
  const { toast } = useToast();
  
  // Set up DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Fetch agents when component mounts
  useEffect(() => {
    fetchAgents();
  }, []);
  
  async function fetchAgents() {
    try {
      setLoading(true);
      
      // Attempt to fetch from API
      try {
        // Use the current origin to ensure we're using the right port
        const response = await fetch(`${window.location.origin}/api/agents`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch agents");
        }
        
        const data = await response.json();
        setAgents(data.agents || []);
      } catch (apiError) {
        console.warn("Falling back to mock agents:", apiError);
        
        // Fallback to mock data if API fails
        const mockAgents: Agent[] = [
          {
            id: "mock-agent-1",
            name: "Customer Support Agent",
            system_prompt: "You are a helpful customer support agent for a software company. Your task is to assist users with technical problems, guide them through troubleshooting steps, and escalate issues when needed.",
            created_at: new Date().toISOString(),
            owner_id: "mock-user-id",
            knowledge_source_info: {
              text: "Sample knowledge base content for support agent",
            }
          },
          {
            id: "mock-agent-2",
            name: "Sales Assistant",
            system_prompt: "You are a sales assistant for a SaaS platform. Your role is to understand potential customers' needs, explain product features, handle objections, and collect prospect information for the sales team.",
            created_at: new Date().toISOString(),
            owner_id: "mock-user-id",
            knowledge_source_info: {
              website: "https://example.com/products"
            }
          },
          {
            id: "mock-agent-3",
            name: "Lead Qualification Bot",
            system_prompt: "You are a lead qualification bot. Your job is to ask relevant questions, determine if visitors are qualified leads, and collect important information before connecting them with sales representatives.",
            created_at: new Date().toISOString(),
            owner_id: "mock-user-id",
            knowledge_source_info: {
              files: ["product-info.pdf"]
            }
          }
        ];
        
        setAgents(mockAgents);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load agents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }
  
  async function createAgent(formData: any) {
    try {
      const response = await fetch(`${window.location.origin}/api/agents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();
      console.log("Success:", result);
      
      // Add the newly created agent to the agents list
      setAgents(prevAgents => [result.agent, ...prevAgents]);
      
      toast({
        title: "Agent created successfully",
        description: "Your new agent has been created.",
      });
      
      return result;
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Failed to create agent",
        description: "There was an error creating your agent.",
        variant: "destructive",
      });
    }
  }
  
  async function updateAgent(agent: { 
    id?: string; 
    name: string; 
    system_prompt: string;
    knowledge_source_info?: any;
    model_selection?: string;
    voice_selection?: string;
    intelligence_tools?: any;
  }) {
    if (!agent.id) return;
    
    try {
      const response = await fetch(`${window.location.origin}/api/agents`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(agent),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update agent");
      }
      
      // Refresh the agent list
      fetchAgents();
      
      // Reset editing state
      setEditingAgent(null);
    } catch (error: any) {
      throw new Error(error.message || "Failed to update agent");
    }
  }
  
  async function deleteAgent(agent: Agent) {
    try {
      const response = await fetch(`${window.location.origin}/api/agents?id=${agent.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete agent");
      }
      
      // Refresh the agent list
      fetchAgents();
      
      toast({
        title: "Success",
        description: "Agent deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete agent",
        variant: "destructive",
      });
    } finally {
      setAgentToDelete(null);
      setDeleteDialogOpen(false);
    }
  }
  
  function handleSelectAgent(agent: Agent) {
    // Map the Supabase agent to the format used in the settings store
    setActiveAgent({
      id: agent.id,
      name: agent.name,
      systemPrompt: agent.system_prompt
    });
    
    toast({
      title: "Agent Selected",
      description: `${agent.name} is now your active agent`,
    });
  }
  
  function generateWidgetCode(agent: Agent) {
    setWidgetAgent(agent);
    // Generate a simple widget embed code
    const hostUrl = window.location.origin;
    const widgetCode = `
<!-- MENA Launchpad Lead Generation Widget -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = "${hostUrl}/widget.js";
    script.async = true;
    script.dataset.agentId = "${agent.id}";
    script.dataset.apiEndpoint = "${hostUrl}/api/create-lead";
    document.head.appendChild(script);
  })();
</script>
<!-- End MENA Launchpad Widget -->
`;
    setWidgetCode(widgetCode);
  }
  
  function copyWidgetCode() {
    navigator.clipboard.writeText(widgetCode);
    toast({
      title: "Copied to clipboard",
      description: "Widget embed code copied successfully",
    });
  }
  
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setAgents((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
      
      toast({
        title: "Agent order updated",
        description: "The new agent order has been saved locally"
      });
      
      // In a real implementation, this would persist the order to the database
      // For now, this just updates the local state for a visual effect
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Agents</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Create New Agent</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto dark:border-gray-700">
            <DialogHeader>
              <DialogTitle>Create New Agent</DialogTitle>
            </DialogHeader>
            <AgentForm onSubmit={createAgent} />
          </DialogContent>
        </Dialog>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-10">
          <div className="w-8 h-8 animate-spin text-primary">
            <Loader2 />
          </div>
        </div>
      ) : agents.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">You haven&apos;t created any agents yet.</p>
          </CardContent>
        </Card>
      ) : (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={agents.map(agent => agent.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent) => (
                <SortableAgentCard
                  key={agent.id}
                  agent={agent}
                  onEdit={setEditingAgent}
                  onDelete={(agent) => {
                    setAgentToDelete(agent);
                    setDeleteDialogOpen(true);
                  }}
                  onSelectActive={handleSelectAgent}
                  onGenerateWidget={generateWidgetCode}
                  isActive={activeAgent?.id === agent.id}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
      
      {/* Edit Agent Dialog */}
      {editingAgent && (
        <Dialog open={!!editingAgent} onOpenChange={(open: boolean) => !open && setEditingAgent(null)}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto dark:border-gray-700">
            <DialogHeader>
              <DialogTitle>Edit Agent: {editingAgent.name}</DialogTitle>
            </DialogHeader>
            <AgentForm 
              agent={editingAgent} 
              onSubmit={updateAgent}
              onCancel={() => setEditingAgent(null)}
            />
          </DialogContent>
        </Dialog>
      )}
      
      {/* Widget Code Dialog */}
      {widgetAgent && (
        <Dialog open={!!widgetAgent} onOpenChange={(open: boolean) => !open && setWidgetAgent(null)}>
          <DialogContent className="sm:max-w-[600px] dark:border-gray-700">
            <DialogHeader>
              <DialogTitle>Widget Embed Code: {widgetAgent.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Copy and paste this code into your website to add this agent as a lead generation widget.
              </p>
              <Textarea
                value={widgetCode}
                readOnly
                className="font-mono text-sm h-[150px]"
                onClick={(e: React.MouseEvent<HTMLTextAreaElement>) => (e.target as HTMLTextAreaElement).select()}
              />
              <div className="flex justify-end">
                <Button onClick={copyWidgetCode}>
                  <div className="h-4 w-4 mr-2">
                    <Code2 />
                  </div>
                  Copy Code
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {agentToDelete?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAgentToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => agentToDelete && deleteAgent(agentToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}