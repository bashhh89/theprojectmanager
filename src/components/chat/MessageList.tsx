'use client';

import React from 'react';
import Image from 'next/image';
import MessageItem from '../MessageItem';
import { useStore } from '@/store/useStore';
import { useChatStore } from '@/store/chatStore';

// Add this function to display the model info
function ModelIndicator({ modelUsed }: { modelUsed?: string }) {
  if (!modelUsed) return null;
  
  // Extract model name for display
  const modelName = modelUsed.includes(" ") 
    ? modelUsed.split(" ")[1] 
    : modelUsed;
  
  return (
    <div className="mt-2 text-xs text-muted-foreground/70 flex items-center">
      <div 
        className="w-2 h-2 rounded-full mr-1.5"
        style={{ 
          backgroundColor: modelUsed.toLowerCase().includes('google') || modelUsed.toLowerCase().includes('gemini') 
            ? '#4285F4' 
            : modelUsed.toLowerCase().includes('llama') 
              ? '#19C37D' 
              : '#A259FF'
        }}
      />
      <span>{modelName}</span>
    </div>
  );
}

function MessageList() {
  const messages = useStore(useChatStore, state => state.messages);
  
  return (
    <div className="flex-1 space-y-6 overflow-y-auto py-6 px-4">
      {messages.map((message, index) => (
        <MessageItem 
          key={index}
          role={message.role}
          content={message.content}
          modelUsed={message.modelUsed}
        />
      ))}
    </div>
  );
}

export default MessageList; 