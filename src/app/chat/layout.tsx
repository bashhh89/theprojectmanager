"use client"

import { usePathname } from 'next/navigation';
import { ChatInterface } from "@/components/chat/chat-interface";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const isHistoryPage = pathname === '/chat/history';

  // If we're on the history page, render the children (history component)
  // Otherwise render the chat interface
  return (
    <div className="h-screen">
      {isHistoryPage ? children : <ChatInterface />}
    </div>
  )
} 