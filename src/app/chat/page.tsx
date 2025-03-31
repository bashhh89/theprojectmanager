"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChatInterface } from "@/components/chat/chat-interface"

export default function ChatPage() {
  const router = useRouter()

  useEffect(() => {
    // Ensure we're on the correct port
    const currentPort = window.location.port
    const targetPort = process.env.NEXT_PUBLIC_PORT || '3002'
    
    if (currentPort !== targetPort) {
      const newUrl = window.location.href.replace(`:${currentPort}`, `:${targetPort}`)
      window.location.href = newUrl
    }
  }, [])

  return <ChatInterface />
}