"use client"
import { useEffect, useState } from "react"
import { useSettingsStore } from "@/store/settingsStore"
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Simple test component for the pirate agent
function TestPirateAgent() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTestAgent = async () => {
    try {
      setLoading(true);
      setResponse("Testing pirate agent...");
      
      // Create a very simple agent with a basic pirate system prompt
      const pirateAgent = {
        id: "pirate-test",
        name: "Simple Pirate",
        systemPrompt: "You are a pirate. Always speak like a pirate. Use pirate slang and expressions. Start every response with 'Arr!' or 'Yarr!' and end with a pirate phrase.",
        system_prompt: "You are a pirate. Always speak like a pirate. Use pirate slang and expressions. Start every response with 'Arr!' or 'Yarr!' and end with a pirate phrase."
      };
      
      // We'll capture the response from the API manually
      const apiResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: input || "Tell me about yourself" }],
          systemPrompt: pirateAgent.systemPrompt,
          agent: pirateAgent
        }),
      });
      
      const data = await apiResponse.json();
      if (data.success) {
        setResponse(data.message);
      } else {
        setResponse(`Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error testing pirate agent:', error);
      setResponse(`Error: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-8 p-6 border rounded-lg bg-card">
      <h2 className="text-2xl font-bold mb-4">Test Agent Persona</h2>
      <div>
        <p className="text-sm mb-2">This simple test will check if the Pollinations API respects system prompts by sending a basic "pirate" persona.</p>
        <p className="text-sm mb-4">The API should respond with pirate language if system prompts are working correctly.</p>
      </div>
      
      <textarea 
        placeholder="Enter a message (or leave empty for default)"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full min-h-[100px] p-2 border rounded mb-4"
      />
      
      <button 
        onClick={handleTestAgent} 
        disabled={loading}
        className="w-full p-2 bg-primary text-primary-foreground rounded"
      >
        {loading ? "Testing..." : "Test Pirate Agent"}
      </button>
      
      {response && (
        <div className="mt-4 p-4 border rounded bg-muted">
          <p className="font-bold mb-2">Response:</p>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const setDarkMode = useSettingsStore((state) => state.setDarkMode)
  const darkMode = useSettingsStore((state) => state.darkMode)
  const [mounted, setMounted] = useState(false)
  
  // Handle dark mode setup with client-side hydration
  useEffect(() => {
    setMounted(true)
    
    // Apply dark mode class based on stored preference
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [setDarkMode, darkMode])
  
  if (!mounted) {
    return null // Avoid hydration mismatch by not rendering until mounted
  }
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Welcome to Agent Builder</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Create, customize and deploy AI assistants in minutes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="flex flex-col space-y-1.5 p-6">
              <div className="font-semibold leading-none tracking-tight">Sign In</div>
              <div className="text-sm text-muted-foreground">
                Sign in to your account to access your agents
              </div>
            </div>
            <div className="p-6 pt-0">
              <p className="text-sm text-muted-foreground mb-4">
                Access your existing agents, modify them, or create new ones.
              </p>
            </div>
            <div className="flex items-center p-6 pt-0">
              <Link href="/login" className="w-full">
                <Button className="w-full">Sign In</Button>
              </Link>
            </div>
          </div>

          <div className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="flex flex-col space-y-1.5 p-6">
              <div className="font-semibold leading-none tracking-tight">Create Account</div>
              <div className="text-sm text-muted-foreground">
                Register to start building your own AI agents
              </div>
            </div>
            <div className="p-6 pt-0">
              <p className="text-sm text-muted-foreground mb-4">
                Create an account to build custom AI agents with different models and tools.
              </p>
            </div>
            <div className="flex items-center p-6 pt-0">
              <Link href="/register" className="w-full">
                <Button className="w-full" variant="outline">Register</Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Just want to see how it works?
          </p>
          <Link href="/agents">
            <Button variant="secondary">Continue as Guest</Button>
          </Link>
        </div>

        <div className="flex flex-col gap-4 items-center">
          <Button asChild className="w-full max-w-xs">
            <Link href="/chat">Go to Chat</Link>
          </Button>
          
          <TestPirateAgent />
        </div>
      </div>
    </main>
  )
}
