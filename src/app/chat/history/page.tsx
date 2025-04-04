"use client";

import React from 'react';
import { useState, useEffect } from 'react';
import { useChatStore } from "@/store/chatStore";
import { format } from 'date-fns';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Search, Trash2, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ChatMessage {
  role: string;
  content: string;
}

interface ChatSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  createdAt: string | Date;
}

export default function ChatHistory() {
  const router = useRouter();
  const chatSessions = useChatStore(state => state.chatSessions);
  const deleteChat = useChatStore(state => state.deleteChat);
  const setActiveChat = useChatStore(state => state.setActiveChat);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSessions, setFilteredSessions] = useState<ChatSession[]>(chatSessions);

  // Update filtered sessions when search term or chat sessions change
  useEffect(() => {
    const filtered = chatSessions.filter(session => 
      session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.messages.some(msg => 
        msg.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredSessions(filtered);
  }, [searchTerm, chatSessions]);

  const handleChatSelect = (chatId: string) => {
    setActiveChat(chatId);
    router.push('/chat');
  };

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this chat?')) {
      deleteChat(chatId);
    }
  };

  const getLastMessagePreview = (messages: ChatMessage[]) => {
    const userMessages = messages.filter(msg => msg.role === 'user');
    if (userMessages.length === 0) return 'No messages';
    const lastMessage = userMessages[userMessages.length - 1].content;
    return lastMessage.length > 100 ? `${lastMessage.substring(0, 100)}...` : lastMessage;
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Chat History</h1>
        <div className="relative">
          <div className="absolute left-3 top-3 h-4 w-4 text-gray-400">
            <Search />
          </div>
          <Input
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No chats found matching your search' : 'No chat history yet'}
          </div>
        ) : (
          filteredSessions.map((session) => (
            <div 
              key={session.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors rounded-lg border p-4"
              onClick={() => handleChatSelect(session.id)}
            >
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-lg font-medium">{session.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {format(new Date(session.createdAt), 'MMM d, yyyy')}
                  </span>
                  <button
                    onClick={(e) => handleDeleteChat(e, session.id)}
                    className="h-8 w-8 text-gray-500 hover:text-red-500 rounded-full flex items-center justify-center"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-2">
                <div className="flex items-center text-sm text-gray-500">
                  <div className="h-4 w-4 mr-2">
                    <MessageSquare />
                  </div>
                  <span>{session.messages.length} messages</span>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {getLastMessagePreview(session.messages)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 