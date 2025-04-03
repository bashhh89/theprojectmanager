'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Eye, Download, FileText, Trash2 } from 'lucide-react';

// Define a more complete type for the presentation data
interface Presentation {
  id: string;
  title: string;
  presentation_type: string; // Changed from 'type' based on schema
  slides: any[]; // Assuming slides is an array of objects
  brand_profile?: any | null; // Optional brand profile data
  created_at: string;
}

export default function MyPresentationsPage() {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch presentations
  const fetchPresentations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/presentations');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data: Presentation[] = await response.json();
      setPresentations(data);
    } catch (err: any) {
      console.error("Failed to fetch presentations:", err);
      setError(err.message || 'An unknown error occurred while fetching presentations.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch presentations when the component mounts
  useEffect(() => {
    fetchPresentations();
  }, []);

  // TODO: Implement delete function
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this presentation?')) {
        return;
    }
    console.log(`Attempting to delete presentation with ID: ${id}`);
    // Add API call logic here using /api/presentations/[id] DELETE
    try {
        const response = await fetch(`/api/presentations/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to delete presentation: ${response.statusText}`);
        }
        // Refresh the list after successful deletion
        alert('Presentation deleted successfully!'); // Simple feedback
        fetchPresentations();
    } catch (err: any) {
        console.error("Failed to delete presentation:", err);
        alert(`Error deleting presentation: ${err.message}`); // Simple feedback
        setError(err.message || 'Could not delete the presentation.');
    }
  };

  // Function to handle downloading presentation data as JSON
  const handleDownloadJson = (presentation: Presentation) => {
    try {
      const jsonData = JSON.stringify(presentation.slides, null, 2); // Pretty print JSON
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Sanitize title for filename
      const fileName = `${presentation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_slides.json`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download JSON data:", err);
      alert("Could not prepare data for download.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Presentations</h1>

      {isLoading && <p>Loading presentations...</p>}

      {error && <p className="text-red-500">Error: {error}</p>}

      {!isLoading && !error && presentations.length === 0 && (
        <p>You haven't saved any presentations yet. <Link href="/tools/presentation-generator" className="text-blue-500 hover:underline">Create one now!</Link></p>
      )}

      {!isLoading && !error && presentations.length > 0 && (
        <div className="overflow-x-auto shadow-md rounded-lg">
          <table className="min-w-full bg-background border border-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {presentations.map((presentation) => (
                <tr key={presentation.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{presentation.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{presentation.presentation_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{new Date(presentation.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/presentations/${presentation.id}`} title="View Presentation">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDownloadJson(presentation)}
                      title="Download Slides Data (JSON)"
                    >
                       <Download className="h-4 w-4" />
                    </Button>

                    <Button variant="outline" size="sm" disabled title="Download as PDF (Coming Soon)">
                      <FileText className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(presentation.id)}
                      title="Delete Presentation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 