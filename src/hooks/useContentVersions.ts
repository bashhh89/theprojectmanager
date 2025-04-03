import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

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

interface UseContentVersionsProps {
  contentId: string;
}

interface UseContentVersionsReturn {
  versions: Version[];
  isLoading: boolean;
  error: Error | null;
  createVersion: (data: {
    title: string;
    content: string;
    changeType?: string;
    changeSummary?: string;
  }) => Promise<Version>;
  updateVersion: (data: {
    versionId: string;
    title: string;
    content: string;
    changeType?: string;
    changeSummary?: string;
  }) => Promise<Version>;
  deleteVersion: (versionId: string) => Promise<void>;
  restoreVersion: (versionId: string) => Promise<void>;
}

export function useContentVersions({ contentId }: UseContentVersionsProps): UseContentVersionsReturn {
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadVersions();
  }, [contentId]);

  const loadVersions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/content/${contentId}/versions`);
      if (!response.ok) {
        throw new Error('Failed to fetch versions');
      }
      const data = await response.json();
      setVersions(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
      toast({
        title: 'Error',
        description: 'Failed to load content versions',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createVersion = async (data: {
    title: string;
    content: string;
    changeType?: string;
    changeSummary?: string;
  }): Promise<Version> => {
    try {
      const response = await fetch(`/api/content/${contentId}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create version');
      }

      const newVersion = await response.json();
      setVersions((prev) => [newVersion, ...prev]);
      toast({
        title: 'Success',
        description: 'Version created successfully',
      });
      return newVersion;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      toast({
        title: 'Error',
        description: 'Failed to create version',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateVersion = async (data: {
    versionId: string;
    title: string;
    content: string;
    changeType?: string;
    changeSummary?: string;
  }): Promise<Version> => {
    try {
      const response = await fetch(`/api/content/${contentId}/versions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update version');
      }

      const updatedVersion = await response.json();
      setVersions((prev) =>
        prev.map((v) => (v.id === data.versionId ? updatedVersion : v))
      );
      toast({
        title: 'Success',
        description: 'Version updated successfully',
      });
      return updatedVersion;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      toast({
        title: 'Error',
        description: 'Failed to update version',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteVersion = async (versionId: string): Promise<void> => {
    try {
      const response = await fetch(
        `/api/content/${contentId}/versions?versionId=${versionId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete version');
      }

      setVersions((prev) => prev.filter((v) => v.id !== versionId));
      toast({
        title: 'Success',
        description: 'Version deleted successfully',
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      toast({
        title: 'Error',
        description: 'Failed to delete version',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const restoreVersion = async (versionId: string): Promise<void> => {
    try {
      const version = versions.find((v) => v.id === versionId);
      if (!version) {
        throw new Error('Version not found');
      }

      await createVersion({
        title: version.title,
        content: version.content,
        changeType: 'restore',
        changeSummary: `Restored from version ${versionId}`,
      });

      toast({
        title: 'Success',
        description: 'Version restored successfully',
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      toast({
        title: 'Error',
        description: 'Failed to restore version',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    versions,
    isLoading,
    error,
    createVersion,
    updateVersion,
    deleteVersion,
    restoreVersion,
  };
} 