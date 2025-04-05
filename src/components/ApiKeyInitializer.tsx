'use client'

import { useEffect } from "react"
import { useApiKey } from "@/hooks/useApiKey"
import { useToast } from "@/components/ui/use-toast"

export function ApiKeyInitializer() {
  // Use our API key management hook
  const { isLoading, isValid, error } = useApiKey();
  const { toast } = useToast();

  // Show toast notifications for API key status
  useEffect(() => {
    if (!isLoading) {
      if (error) {
        toast({
          title: "API Connection Error",
          description: error || "Failed to connect to AnythingLLM API",
          variant: "destructive"
        });
      } else if (!isValid) {
        toast({
          title: "API Connection Error",
          description: "Invalid AnythingLLM API key",
          variant: "destructive"
        });
      } else {
        toast({
          title: "API Connected",
          description: "Successfully connected to AnythingLLM API",
        });
      }
    }
  }, [isLoading, isValid, error, toast]);

  // This component doesn't render anything
  return null;
} 