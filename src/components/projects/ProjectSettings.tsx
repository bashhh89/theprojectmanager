import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';

interface ProjectSettingsProps {
  projectId: string;
}

export function ProjectSettings({ projectId }: ProjectSettingsProps) {
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [repairing, setRepairing] = useState(false);

  // Test AnythingLLM Connection
  const testConnection = async () => {
    try {
      setTestingConnection(true);
      setConnectionStatus('unknown');
      
      const response = await fetch('/api/test-anythingllm-connection');
      const data = await response.json();
      
      if (data.status === 'connected') {
        setConnectionStatus('connected');
        toast({
          title: "Connection Success",
          description: "Successfully connected to AnythingLLM",
        });
      } else {
        setConnectionStatus('disconnected');
        toast({
          title: "Connection Failed",
          description: data.message || "Failed to connect to AnythingLLM",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus('disconnected');
      toast({
        title: "Connection Error",
        description: "An error occurred while testing the connection",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // Repair AnythingLLM Workspace
  const repairWorkspace = async () => {
    try {
      setRepairing(true);
      
      const response = await fetch('/api/recover-workspace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Repair Successful",
          description: "AnythingLLM workspace has been repaired",
        });
      } else {
        toast({
          title: "Repair Failed",
          description: data.error || "Failed to repair AnythingLLM workspace",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Repair Error",
        description: "An error occurred while repairing the workspace",
        variant: "destructive",
      });
    } finally {
      setRepairing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AnythingLLM Integration</CardTitle>
        <CardDescription>
          Manage the connection between this project and AnythingLLM
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">Connection Status</h3>
            <div className="flex items-center gap-4">
              {connectionStatus === 'unknown' && (
                <div className="text-sm text-muted-foreground">Connection status not checked</div>
              )}
              
              {connectionStatus === 'connected' && (
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-green-500">Connected</span>
                </div>
              )}
              
              {connectionStatus === 'disconnected' && (
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium text-red-500">Disconnected</span>
                </div>
              )}
              
              <Button 
                size="sm" 
                variant="outline" 
                onClick={testConnection}
                disabled={testingConnection}
              >
                {testingConnection ? "Testing..." : "Test Connection"}
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">Workspace Repair</h3>
            <p className="text-sm text-muted-foreground">
              If you're experiencing issues with document processing or AI chat, you can try
              repairing the connection to AnythingLLM.
            </p>
            <div className="flex items-center gap-4">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={repairWorkspace}
                disabled={repairing}
              >
                {repairing ? "Repairing..." : "Repair Connection"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 