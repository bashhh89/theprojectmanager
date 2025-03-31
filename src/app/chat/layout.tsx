"use client"

import { ChatInterface } from "@/components/chat/chat-interface";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen">
      {children}
    </div>
  )
} 