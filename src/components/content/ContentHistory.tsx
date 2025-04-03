'use client';

import { useState, useEffect } from 'react';
import { useContent } from '@/hooks/useContent';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { History, Clock, User, ArrowLeft, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface ContentHistoryProps {
  contentId: string;
}

interface Version {
  id: string;
  content_id: string;
  title: string;
  content: string;
  created_at: string;
  created_by: {
    id: string;
    email: string;
    full_name?: string;
  };
  metadata: {
    change_type: 'create' | 'update' | 'publish' | 'unpublish';
    change_summary?: string;
  };
}

export function ContentHistory({ contentId }: ContentHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersion, setCompareVersion] = useState<Version | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadVersions();
    }
  }, [isOpen]);

  const loadVersions = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would come from an API
      // For now, we'll use mock data
      setVersions([
        {
          id: '1',
          content_id: contentId,
          title: 'Initial Version',
          content: 'This is the initial version of the content.',
          created_at: new Date().toISOString(),
          created_by: {
            id: '1',
            email: 'user@example.com',
            full_name: 'John Doe'
          },
          metadata: {
            change_type: 'create',
            change_summary: 'Content created'
          }
        },
        {
          id: '2',
          content_id: contentId,
          title: 'Updated Version',
          content: 'This is an updated version of the content with more details.',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          created_by: {
            id: '1',
            email: 'user@example.com',
            full_name: 'John Doe'
          },
          metadata: {
            change_type: 'update',
            change_summary: 'Added more details and improved formatting'
          }
        }
      ]);
    } catch (error) {
      console.error('Error loading versions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (version: Version) => {
    if (window.confirm('Are you sure you want to restore this version?')) {
      try {
        // In a real app, this would call an API to restore the version
        console.log('Restoring version:', version.id);
        setIsOpen(false);
      } catch (error) {
        console.error('Error restoring version:', error);
      }
    }
  };

  const handleCompare = (version: Version) => {
    if (compareMode) {
      setCompareVersion(version);
    } else {
      setSelectedVersion(version);
      setCompareMode(true);
    }
  };

  const handleBack = () => {
    setCompareMode(false);
    setCompareVersion(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="w-4 h-4 mr-2" />
          History
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Content History</DialogTitle>
          <DialogDescription>
            View and manage different versions of your content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Version List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-zinc-400">No version history available</p>
              </div>
            ) : (
              versions.map((version) => (
                <Card
                  key={version.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedVersion?.id === version.id || compareVersion?.id === version.id
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-zinc-50'
                  }`}
                  onClick={() => handleCompare(version)}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{version.title}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          version.metadata.change_type === 'create'
                            ? 'bg-green-100 text-green-800'
                            : version.metadata.change_type === 'update'
                            ? 'bg-blue-100 text-blue-800'
                            : version.metadata.change_type === 'publish'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {version.metadata.change_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-zinc-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {format(new Date(version.created_at), 'PPp')}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {version.created_by.full_name || version.created_by.email}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestore(version);
                      }}
                    >
                      Restore
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Version Comparison */}
          {compareMode && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBack}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div className="flex-1 text-center">
                  <span className="text-sm text-zinc-400">
                    Comparing versions
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <h3 className="font-medium mb-2">Selected Version</h3>
                  <div className="prose prose-sm max-w-none">
                    <h4>{selectedVersion?.title}</h4>
                    <div dangerouslySetInnerHTML={{ __html: selectedVersion?.content || '' }} />
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-medium mb-2">Compare With</h3>
                  <div className="prose prose-sm max-w-none">
                    <h4>{compareVersion?.title}</h4>
                    <div dangerouslySetInnerHTML={{ __html: compareVersion?.content || '' }} />
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 