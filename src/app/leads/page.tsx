"use client";

import { useState, useEffect } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import { toast } from "@/components/ui/use-toast";

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

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [newNotes, setNewNotes] = useState<string>("");
  const [newStatus, setNewStatus] = useState<string>("");

  const { agents } = useSettingsStore();

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

  // Update lead status
  const updateLeadStatus = async (id: string, status: "new" | "contacted" | "qualified" | "converted" | "closed", notes?: string) => {
    try {
      const response = await fetch("/api/leads", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status, notes }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update lead");
      }

      // Update lead in state
      setLeads((prevLeads) =>
        prevLeads.map((lead) =>
          lead.id === id ? { ...lead, status, notes: notes || lead.notes } : lead
        )
      );

      toast({
        title: "Success",
        description: "Lead status updated",
      });

      // Reset editing state
      setEditingLead(null);
      setNewNotes("");
      setNewStatus("");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update lead status",
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

  // Filter leads by status
  const filteredLeads =
    selectedStatus === "all"
      ? leads
      : leads.filter((lead) => lead.status === selectedStatus);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";

    switch (status) {
      case "new":
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`;
      case "contacted":
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`;
      case "qualified":
        return `${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200`;
      case "converted":
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
      case "closed":
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
      default:
        return baseClasses;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Leads Management</h1>
          <p className="text-muted-foreground">
            View and manage leads from your agents
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Status filter */}
          <select
            className="bg-background border rounded-md px-3 py-1 text-sm"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="converted">Converted</option>
            <option value="closed">Closed</option>
          </select>

          {/* Agent filter */}
          <select
            className="bg-background border rounded-md px-3 py-1 text-sm"
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
          <button
            className="bg-primary text-primary-foreground rounded-md px-3 py-1 text-sm flex items-center gap-1"
            onClick={fetchLeads}
            disabled={loading}
          >
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
            >
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
            <span>{loading ? "Loading..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Lead stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-background border rounded-lg p-4 shadow-sm">
          <h3 className="text-sm text-muted-foreground">Total Leads</h3>
          <p className="text-2xl font-bold">{leads.length}</p>
        </div>
        <div className="bg-background border rounded-lg p-4 shadow-sm">
          <h3 className="text-sm text-muted-foreground">New</h3>
          <p className="text-2xl font-bold text-blue-600">
            {leads.filter((l) => l.status === "new").length}
          </p>
        </div>
        <div className="bg-background border rounded-lg p-4 shadow-sm">
          <h3 className="text-sm text-muted-foreground">Contacted</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {leads.filter((l) => l.status === "contacted").length}
          </p>
        </div>
        <div className="bg-background border rounded-lg p-4 shadow-sm">
          <h3 className="text-sm text-muted-foreground">Qualified</h3>
          <p className="text-2xl font-bold text-purple-600">
            {leads.filter((l) => l.status === "qualified").length}
          </p>
        </div>
        <div className="bg-background border rounded-lg p-4 shadow-sm">
          <h3 className="text-sm text-muted-foreground">Converted</h3>
          <p className="text-2xl font-bold text-green-600">
            {leads.filter((l) => l.status === "converted").length}
          </p>
        </div>
      </div>

      {/* Lead edit modal */}
      {editingLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Update Lead Status</h2>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <h3 className="font-medium">{editingLead.name}</h3>
                <p className="text-sm text-muted-foreground">{editingLead.email}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  className="w-full bg-background border rounded-md p-2"
                  value={newStatus || editingLead.status}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="converted">Converted</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  className="w-full bg-background border rounded-md p-2 min-h-[100px]"
                  value={newNotes || editingLead.notes || ""}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Add notes about this lead..."
                />
              </div>
            </div>

            <div className="p-4 border-t flex justify-end gap-2">
              <button
                className="px-4 py-2 border rounded-md hover:bg-muted"
                onClick={() => setEditingLead(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
                onClick={() =>
                  updateLeadStatus(
                    editingLead.id,
                    (newStatus || editingLead.status) as "new" | "contacted" | "qualified" | "converted" | "closed",
                    newNotes || editingLead.notes
                  )
                }
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Show loading state */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading leads...</p>
        </div>
      ) : error ? (
        // Show error state
        <div className="text-center py-8 text-destructive">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto mb-2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
          <p>{error}</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        // Show empty state
        <div className="text-center py-12 border rounded-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto mb-4 text-muted-foreground"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
          <h3 className="text-lg font-medium">No leads found</h3>
          <p className="text-muted-foreground mt-1">
            Leads collected from your widgets will appear here
          </p>

          <div className="mt-6 max-w-sm mx-auto p-4 border rounded-md bg-muted/40">
            <h4 className="text-sm font-medium mb-2">
              Add the lead widget to your website
            </h4>
            <pre className="text-xs bg-black/10 dark:bg-white/10 p-2 rounded overflow-x-auto">
              {`<script src="${
                window.location.origin || "https://example.com"
              }/widget.js" data-agent-id="YOUR_AGENT_ID"></script>`}
            </pre>
          </div>
        </div>
      ) : (
        // Show leads table
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Agent
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Message
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium">{lead.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {lead.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {lead.agents?.name || "Unknown Agent"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm max-w-xs truncate">
                        {lead.initial_message}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={getStatusBadgeClass(lead.status)}>
                        {lead.status.charAt(0).toUpperCase() +
                          lead.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {formatDate(lead.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          className="p-1 hover:bg-muted rounded-sm"
                          onClick={() => {
                            setEditingLead(lead);
                            setNewStatus(lead.status);
                            setNewNotes(lead.notes || "");
                          }}
                          title="Edit lead"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                          </svg>
                        </button>
                        <button
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 rounded-sm"
                          onClick={() => deleteLead(lead.id)}
                          title="Delete lead"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 border rounded-md disabled:opacity-50"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <button
                  className="px-3 py-1 border rounded-md disabled:opacity-50"
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}