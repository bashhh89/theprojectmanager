"use client"

import { ChatInput } from "@/components/chat/chat-input"
import { ChatMessages } from "@/components/chat/chat-messages"
import { Sidebar } from "@/components/sidebar"
import { AgentSidebar } from "@/components/agents/AgentSidebar"
import { useEffect, useState } from "react"
import { useSettingsStore } from "@/store/settingsStore"

export default function ChatPage() {
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
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center px-4">
            <span className="text-xl font-bold">QanDu AI Assistant</span>
            <span className="text-sm text-muted-foreground ml-2">Powered by Pollinations</span>
          </div>
        </header>
        
        {/* Chat container */}
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 pb-20 pt-4">
            <ChatMessages />
          </div>
        </div>
        
        {/* Input area - fixed at bottom */}
        <div className="sticky bottom-0 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t z-10 p-4">
          <div className="container mx-auto">
            <ChatInput />
          </div>
        </div>
      </div>
      
      {/* Right Agent Sidebar */}
      <AgentSidebar />
    </div>
  )
}