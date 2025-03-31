"use client";

import { useState, useEffect, useMemo } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import { UserPlus, MoreHorizontal, Plus, X, Clock, CheckCircle, AlertCircle, PenLine } from "lucide-react";

// Types
interface Lead {
  id: string;
  name: string;
  email: string;
  initial_message: string;
  agent_id: string;
  status: "new" | "contacted" | "qualified" | "converted" | "closed";
  notes?: string;
  created_at: string;
  source: string;
  agents?: {
    id: string;
    name: string;
  };
}

type StatusColumn = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
};

// Draggable Lead Card Component
function LeadCard({ 
  lead, 
  onEdit 
}: { 
  lead: Lead; 
  onEdit: (lead: Lead) => void;
}) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <Card className="mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-sm">{lead.name}</h3>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onEdit(lead);
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <PenLine size={14} />
          </button>
        </div>
        
        <div className="mt-2 text-xs text-muted-foreground line-clamp-2">
          {lead.initial_message || lead.notes || "No details available"}
        </div>
        
        <div className="mt-3 flex justify-between items-center">
          <div className="flex items-center">
            <Clock size={12} className="text-muted-foreground mr-1" />
            <span className="text-xs text-muted-foreground">{formatDate(lead.created_at)}</span>
          </div>
          {lead.agents?.name && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              {lead.agents.name}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Sortable Container for each status column
function KanbanColumn({ 
  status, 
  leads, 
  onEdit 
}: { 
  status: StatusColumn; 
  leads: Lead[]; 
  onEdit: (lead: Lead) => void;
}) {
  return (
    <div className="kanban-column flex-1 min-w-[250px] bg-muted/30 rounded-lg p-3">
      <div className="flex items-center mb-3">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${status.color} mr-2`}>
          {status.icon}
        </div>
        <h3 className="font-medium">{status.name}</h3>
        <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
          {leads.length}
        </span>
      </div>
      <div className="kanban-cards space-y-2">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onEdit={onEdit} />
        ))}
      </div>
    </div>
  );
}

// Main component
export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [newNotes, setNewNotes] = useState<string>("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const { agents } = useSettingsStore();

  // Define status columns
  const statusColumns: StatusColumn[] = [
    { 
      id: "new", 
      name: "New", 
      description: "Newly created leads",
      icon: <AlertCircle size={14} className="text-white" />,
      color: "bg-blue-500"
    },
    { 
      id: "contacted", 
      name: "Contacted", 
      description: "Leads that have been reached out to",
      icon: <Clock size={14} className="text-white" />,
      color: "bg-yellow-500"
    },
    { 
      id: "qualified", 
      name: "Qualified", 
      description: "Leads that have been qualified",
      icon: <CheckCircle size={14} className="text-white" />,
      color: "bg-purple-500"
    },
    { 
      id: "converted", 
      name: "Converted", 
      description: "Successfully converted leads",
      icon: <CheckCircle size={14} className="text-white" />,
      color: "bg-green-500"
    },
    { 
      id: "closed", 
      name: "Closed", 
      description: "Closed leads (not converted)",
      icon: <X size={14} className="text-white" />,
      color: "bg-gray-500"
    }
  ];

  // Set up DnD sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  // Group leads by status
  const leadsByStatus = useMemo(() => {
    const grouped: { [key: string]: Lead[] } = {};
    
    // Initialize all status columns
    statusColumns.forEach(col => {
      grouped[col.id] = [];
    });
    
    // Group leads by status
    leads.forEach(lead => {
      if (grouped[lead.status]) {
        grouped[lead.status].push(lead);
      } else {
        // If status doesn't match any column, put in "new"
        grouped["new"].push(lead);
      }
    });
    
    return grouped;
  }, [leads, statusColumns]);

  // Fetch leads
  const fetchLeads = async () => {
    setLoading(true);
    setError(null);

    try {
      let url = `/api/leads?page=${currentPage}`;

      if (selectedAgentId) {
        url += `&agent_id=${selectedAgentId}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch leads");
      }

      setLeads(data.leads || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching leads");
      toast({
        title: "Error",
        description: err.message || "Failed to load leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch leads on initial load and when filters change
  useEffect(() => {
    fetchLeads();
  }, [currentPage, selectedAgentId]);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragId(null);
    
    const { active, over } = event;
    
    // If no valid drop target or didn't move, do nothing
    if (!over || active.id === over.id) return;
    
    // Find the dropped lead
    const draggedLead = leads.find(lead => lead.id === active.id);
    
    // Get the target container (status column)
    const targetStatus = over.id as string;
    
    if (draggedLead && targetStatus && draggedLead.status !== targetStatus) {
      try {
        // Optimistically update UI
        setLeads(prevLeads => 
          prevLeads.map(lead => 
            lead.id === draggedLead.id ? { ...lead, status: targetStatus as any } : lead
          )
        );
        
        // Call API to update status
        const response = await fetch("/api/leads", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            id: draggedLead.id, 
            status: targetStatus 
          }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || "Failed to update lead status");
        }
        
        toast({
          title: "Status Updated",
          description: `Lead moved to ${statusColumns.find(col => col.id === targetStatus)?.name}`,
        });
      } catch (err: any) {
        // Revert the optimistic update
        setLeads(prevLeads => 
          prevLeads.map(lead => 
            lead.id === draggedLead.id ? { ...lead, status: draggedLead.status } : lead
          )
        );
        
        toast({
          title: "Error",
          description: err.message || "Failed to update lead status",
          variant: "destructive",
        });
      }
    }
  };

  // Update lead status and notes
  const updateLead = async () => {
    if (!editingLead) return;
    
    try {
      const response = await fetch("/api/leads", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingLead.id, 
          status: newStatus || editingLead.status, 
          notes: newNotes || editingLead.notes 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update lead");
      }

      // Update lead in state
      setLeads((prevLeads) =>
        prevLeads.map((lead) =>
          lead.id === editingLead.id 
            ? { 
                ...lead, 
                status: newStatus || lead.status, 
                notes: newNotes || lead.notes 
              } 
            : lead
        )
      );

      toast({
        title: "Success",
        description: "Lead updated successfully",
      });

      // Reset editing state
      setEditingLead(null);
      setNewNotes("");
      setNewStatus("");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update lead",
        variant: "destructive",
      });
    }
  };

  // Handle lead deletion
  const deleteLead = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this lead? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/leads?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete lead");
      }

      // Remove lead from state
      setLeads((prevLeads) => prevLeads.filter((lead) => lead.id !== id));

      // Close edit modal if deleting the lead being edited
      if (editingLead?.id === id) {
        setEditingLead(null);
      }

      toast({
        title: "Success",
        description: "Lead deleted successfully",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete lead",
        variant: "destructive",
      });
    }
  };

  // Find the active drag lead
  const activeDragLead = useMemo(() => {
    if (!activeDragId) return null;
    return leads.find(lead => lead.id === activeDragId);
  }, [activeDragId, leads]);

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Leads Pipeline</h1>
          <p className="text-muted-foreground">
            Manage and track your leads through the sales process
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* View Toggle */}
          <Tabs 
            value={viewMode} 
            onValueChange={(value) => setViewMode(value as "kanban" | "list")}
            className="mr-2"
          >
            <TabsList className="grid w-[200px] grid-cols-2">
              <TabsTrigger value="kanban">Kanban</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Agent filter */}
          <select
            className="bg-background border rounded-md px-3 py-1 text-sm h-9"
            value={selectedAgentId}
            onChange={(e) => {
              setSelectedAgentId(e.target.value);
              setCurrentPage(1); // Reset to first page on filter change
            }}
          >
            <option value="">All Agents</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>

          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLeads}
            disabled={loading}
            className="h-9"
          >
            {loading ? "Loading..." : "Refresh"}
          </Button>

          {/* Add new lead button */}
          <Button
            size="sm"
            className="h-9"
            onClick={() => {
              // Placeholder for new lead functionality
              toast({
                title: "Coming Soon",
                description: "Add Lead functionality will be available soon",
              });
            }}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {viewMode === "kanban" ? (
        <div className="bg-card rounded-lg border shadow-sm">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToParentElement]}
          >
            <div className="p-4 overflow-x-auto">
              <div className="flex gap-4 min-w-max pb-2">
                {statusColumns.map((column) => (
                  <SortableContext
                    key={column.id}
                    items={leadsByStatus[column.id]?.map(lead => lead.id) || []}
                    strategy={verticalListSortingStrategy}
                  >
                    <KanbanColumn
                      status={column}
                      leads={leadsByStatus[column.id] || []}
                      onEdit={setEditingLead}
                    />
                  </SortableContext>
                ))}
              </div>
            </div>

            {/* Drag overlay to show what's being dragged */}
            <DragOverlay>
              {activeDragLead && (
                <div className="w-[250px] opacity-80">
                  <LeadCard lead={activeDragLead} onEdit={() => {}} />
        </div>
      )}
            </DragOverlay>
          </DndContext>
        </div>
      ) : (
        // Traditional List View (original implementation)
        <div className="bg-card rounded-lg border shadow-sm">
          <div className="p-4">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-3 font-medium text-sm">Name</th>
                  <th className="text-left pb-3 font-medium text-sm">Email</th>
                  <th className="text-left pb-3 font-medium text-sm">Agent</th>
                  <th className="text-left pb-3 font-medium text-sm">Status</th>
                  <th className="text-left pb-3 font-medium text-sm">Created</th>
                  <th className="text-left pb-3 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-muted-foreground">
                      {loading ? "Loading leads..." : "No leads found"}
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="border-b last:border-0">
                      <td className="py-3">{lead.name}</td>
                      <td className="py-3">{lead.email}</td>
                      <td className="py-3">{lead.agents?.name || "-"}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          lead.status === "new" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                          lead.status === "contacted" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                          lead.status === "qualified" ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" :
                          lead.status === "converted" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                          "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}>
                          {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                      </span>
                    </td>
                      <td className="py-3">{new Date(lead.created_at).toLocaleDateString()}</td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditingLead(lead)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          onClick={() => deleteLead(lead.id)}
                          >
                            Delete
                          </Button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center border-t p-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Edit Lead Modal */}
      {editingLead && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Edit Lead: {editingLead.name}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => setEditingLead(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    className="w-full bg-background border rounded-md px-3 py-2 mt-1"
                    value={newStatus || editingLead.status}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    {statusColumns.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea 
                    id="notes"
                    className="w-full mt-1"
                    placeholder="Add notes about this lead"
                    value={newNotes || editingLead.notes || ''}
                    onChange={(e) => setNewNotes(e.target.value)}
                    rows={5}
                  />
                </div>
                
                <div className="pt-4 grid grid-cols-2 gap-4">
                  <div>
                    <Label>Contact</Label>
                    <div className="text-sm mt-1">{editingLead.email}</div>
                  </div>
                  <div>
                    <Label>Agent</Label>
                    <div className="text-sm mt-1">{editingLead.agents?.name || "Not assigned"}</div>
                  </div>
                </div>

                <div>
                  <Label>Initial Message</Label>
                  <div className="text-sm mt-1 p-3 bg-muted rounded-md">
                    {editingLead.initial_message || "No initial message"}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button
                variant="outline"
                onClick={() => setEditingLead(null)}
              >
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => deleteLead(editingLead.id)}
                >
                  Delete
                </Button>
                <Button onClick={updateLead}>
                  Save Changes
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}