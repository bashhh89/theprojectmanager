"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChatInterface } from "@/components/chat/chat-interface"

export default function ChatPage() {
  const router = useRouter()

  // No port redirection - allow the app to run on any port
  
  return <ChatInterface />
}