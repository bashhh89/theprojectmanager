'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Loader2, 
  Plus, 
  FileText, 
  Eye, 
  Share2, 
  Pencil, 
  Trash2,
  AlertTriangle,
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProposalStore } from '@/store/proposalStore';
import { toasts } from '@/components/ui/toast-wrapper';

export default function ProposalsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState('');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  
  // Access proposal store
  const { 
    proposals, 
    fetchProposals, 
    deleteProposal, 
    generateShareLink 
  } = useProposalStore();
  
  // Load proposals on component mount
  useEffect(() => {
    const loadProposals = async () => {
      try {
        await fetchProposals();
      } catch (error) {
        console.error('Error fetching proposals:', error);
        toasts.error('Failed to load proposals');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProposals();
  }, [fetchProposals]);
  
  // Handle view proposal
  const handleViewProposal = (proposalId: string) => {
    router.push(`/proposals/${proposalId}`);
  };
  
  // Handle create new proposal
  const handleCreateProposal = () => {
    router.push('/proposals/create');
  };
  
  // Handle edit proposal
  const handleEditProposal = (proposalId: string) => {
    router.push(`/proposals/edit/${proposalId}`);
  };
  
  // Handle share proposal
  const handleShareProposal = async (proposalId: string) => {
    try {
      setSharingId(proposalId);
      const link = await generateShareLink(proposalId, 168); // 7 days (168 hours)
      setShareLink(link);
      setShowShareDialog(true);
    } catch (error) {
      console.error('Error generating share link:', error);
      toasts.error('Failed to generate share link');
    } finally {
      setSharingId(null);
    }
  };
  
  // Handle copy share link
  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    toasts.success('Share link copied to clipboard');
  };
  
  // Handle delete proposal
  const handleDeleteClick = (proposalId: string) => {
    setSelectedProposalId(proposalId);
    setShowDeleteDialog(true);
    setConfirmDeleteText('');
  };
  
  const handleConfirmDelete = async () => {
    if (!selectedProposalId) return;
    
    if (confirmDeleteText !== 'delete') {
      toasts.error('Please type "delete" to confirm');
      return;
    }
    
    try {
      await deleteProposal(selectedProposalId);
      toasts.success('Proposal deleted successfully');
      setShowDeleteDialog(false);
      setSelectedProposalId(null);
      setConfirmDeleteText('');
    } catch (error) {
      console.error('Error deleting proposal:', error);
      toasts.error('Failed to delete proposal');
    }
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Proposals</h1>
          <p className="text-muted-foreground">Manage and create client proposals</p>
        </div>
        <Button onClick={handleCreateProposal}>
          <Plus className="mr-2 h-4 w-4" /> Create Proposal
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : proposals.length === 0 ? (
        <div className="bg-muted/50 border border-muted rounded-lg py-16 text-center">
          <FileText className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No proposals yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first client proposal to get started
          </p>
          <Button onClick={handleCreateProposal}>
            <Plus className="mr-2 h-4 w-4" /> Create Proposal
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.map((proposal) => (
                <TableRow key={proposal.id}>
                  <TableCell className="font-medium">{proposal.title}</TableCell>
                  <TableCell>{proposal.clientName}</TableCell>
                  <TableCell>
                    {proposal.createdAt && format(new Date(proposal.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    {proposal.status === 'draft' ? (
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">
                        Draft
                      </span>
                    ) : proposal.status === 'sent' ? (
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500">
                        Sent
                      </span>
                    ) : proposal.status === 'viewed' ? (
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500">
                        Viewed
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
                        {proposal.status}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleViewProposal(proposal.id)}
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleEditProposal(proposal.id)}
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleShareProposal(proposal.id)}
                      disabled={sharingId === proposal.id}
                      title="Share"
                    >
                      {sharingId === proposal.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Share2 className="h-4 w-4" />
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleDeleteClick(proposal.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Proposal</DialogTitle>
            <DialogDescription>
              Copy this unique link to share your proposal with clients
            </DialogDescription>
          </DialogHeader>
          <div className="flex space-x-2 items-center">
            <Input value={shareLink} readOnly className="flex-1" />
            <Button variant="outline" onClick={handleCopyShareLink}>
              <Check className="h-4 w-4 mr-2" /> Copy
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            This link will expire in 7 days.
          </p>
          <DialogFooter>
            <Button onClick={() => setShowShareDialog(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600 gap-2">
              <AlertTriangle className="h-5 w-5" /> Delete Proposal
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. The proposal will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="font-medium">Type "delete" to confirm:</p>
            <Input
              value={confirmDeleteText}
              onChange={(e) => setConfirmDeleteText(e.target.value)}
              placeholder="delete"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={confirmDeleteText !== 'delete'}
            >
              Delete Proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 