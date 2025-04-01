"use client";

import { useState, useEffect, useMemo } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import { usePipelineStore } from "@/store/pipelineStore";
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
import { restrictToParentElement } from "@dnd-kit/modifiers";
import { UserPlus, MoreHorizontal, Plus, X, Clock, CheckCircle, AlertCircle, PenLine } from "lucide-react";
import { KanbanBoard } from "@/components/leads/KanbanBoard";
import { PipelineManager } from "@/components/leads/PipelineManager";
import { LeadChatPanel } from "@/components/leads/LeadChatPanel";

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

// Traditional List View - Lead Row Component
function LeadRow({ 
  lead, 
  onEdit,
  onDelete 
}: { 
  lead: Lead; 
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <tr className="border-b last:border-0">
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
            onClick={() => onEdit(lead)}
          >
            Edit
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            onClick={() => onDelete(lead.id)}
          >
            Delete
          </Button>
        </div>
      </td>
    </tr>
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
  const [isAddingLead, setIsAddingLead] = useState<boolean>(false);
  const [newLead, setNewLead] = useState<{
    name: string;
    email: string;
    initial_message: string;
    agent_id: string;
  }>({
    name: "",
    email: "",
    initial_message: "",
    agent_id: "",
  });

  const { agents } = useSettingsStore();
  const { pipelines } = usePipelineStore();

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

  // Helper to check if a status is valid
  const isValidStatus = (status: string): status is Lead['status'] => {
    return ['new', 'contacted', 'qualified', 'converted', 'closed'].includes(status);
  };

  // Handle lead status change
  const handleLeadMove = async (leadId: string, newStatus: string) => {
    // Find the lead to update
    const leadToUpdate = leads.find(lead => lead.id === leadId);
    if (!leadToUpdate) return;
    
    // Validate the new status
    if (!isValidStatus(newStatus)) {
      toast({
        title: "Error",
        description: `Invalid status: ${newStatus}`,
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Optimistically update UI
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        )
      );
      
      // Call API to update status
      const response = await fetch("/api/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: leadId, 
          status: newStatus 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to update lead status");
      }
      
      toast({
        title: "Status Updated",
        description: `Lead moved to ${pipelines.find(p => p.id === newStatus)?.name || newStatus}`,
      });
    } catch (err: any) {
      // Revert the optimistic update
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === leadId ? leadToUpdate : lead
        )
      );
      
      toast({
        title: "Error",
        description: err.message || "Failed to update lead status",
        variant: "destructive",
      });
    }
  };

  // Update lead status and notes
  const updateLead = async () => {
    if (!editingLead) return;
    
    // Validate the new status if provided
    const statusToUpdate = newStatus || editingLead.status;
    if (!isValidStatus(statusToUpdate)) {
      toast({
        title: "Error",
        description: `Invalid status: ${statusToUpdate}`,
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await fetch("/api/leads", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingLead.id, 
          status: statusToUpdate, 
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
                status: statusToUpdate, 
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

  // Add lead function
  const addLead = async () => {
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLead),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create lead");
      }

      // Add new lead to state
      setLeads(prevLeads => [data.lead, ...prevLeads]);
      
      // Reset form and close modal
      setNewLead({
        name: "",
        email: "",
        initial_message: "",
        agent_id: "",
      });
      setIsAddingLead(false);
      
      toast({
        title: "Success",
        description: "Lead created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create lead",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="pl-0 pr-0 max-w-full">
      <div className="flex flex-col justify-between mb-4 px-4 py-4 border-b bg-card/50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
              onClick={() => setIsAddingLead(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 mx-4 rounded-md mb-4">
          {error}
        </div>
      )}

      {viewMode === "kanban" ? (
        <div className="h-[calc(100vh-10rem)]">
          <div className="bg-card border-b">
            <div className="px-4 py-3">
              <PipelineManager />
            </div>
          </div>
          <div className="h-[calc(100vh-15rem)]">
            {loading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Loading leads...
              </div>
            ) : (
              <KanbanBoard
                leads={leads}
                onLeadMove={handleLeadMove}
                onLeadClick={setEditingLead}
              />
            )}
          </div>
        </div>
      ) : (
        // Traditional List View
        <div className="bg-card rounded-lg border shadow-sm mx-4">
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
                    <LeadRow
                      key={lead.id}
                      lead={lead}
                      onEdit={setEditingLead}
                      onDelete={deleteLead}
                    />
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
          <Card className="w-full max-w-6xl h-[80vh] overflow-hidden">
            <CardHeader className="px-4 py-3 border-b">
              <CardTitle className="flex justify-between items-center">
                <span className="text-xl">Lead: {editingLead.name}</span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 h-[calc(80vh-61px)]">
              <div className="border-r p-4 overflow-auto">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      className="w-full bg-background border rounded-md px-3 py-2 mt-1"
                      value={newStatus || editingLead.status}
                      onChange={(e) => setNewStatus(e.target.value)}
                    >
                      {pipelines.map((pipeline) => (
                        <option key={pipeline.id} value={pipeline.id}>
                          {pipeline.name}
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
                  
                  <div className="flex justify-between border-t pt-4">
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
                  </div>
                </div>
              </div>
              
              {/* AI Chat Panel */}
              <div className="h-full overflow-hidden">
                <LeadChatPanel lead={editingLead} />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Add Lead Modal */}
      {isAddingLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Add New Lead</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsAddingLead(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newLead.name}
                    onChange={(e) => setNewLead(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter lead name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter lead email"
                  />
                </div>
                <div>
                  <Label htmlFor="message">Initial Message</Label>
                  <Textarea
                    id="message"
                    value={newLead.initial_message}
                    onChange={(e) => setNewLead(prev => ({ ...prev, initial_message: e.target.value }))}
                    placeholder="Enter initial message or notes"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="agent">Assign to Agent</Label>
                  <select
                    id="agent"
                    className="w-full p-2 border rounded-md bg-background"
                    value={newLead.agent_id}
                    onChange={(e) => setNewLead(prev => ({ ...prev, agent_id: e.target.value }))}
                  >
                    <option value="">Select an agent</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingLead(false)}>
                Cancel
              </Button>
              <Button
                onClick={addLead}
                disabled={!newLead.name || !newLead.email || !newLead.agent_id}
              >
                Create Lead
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}