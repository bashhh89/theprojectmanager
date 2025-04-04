'use client';

import { Message } from '@/store/chatStore';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Bot, User, Terminal, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Markdown } from '@/components/ui/markdown';

interface ChatMessageProps {
  message: Message;
  isLast?: boolean;
  onRetry?: () => void;
  className?: string;
}

export function ChatMessage({
  message,
  isLast,
  onRetry,
  className,
}: ChatMessageProps) {
  const isCommand = message.role === 'command';
  const isError = isCommand && !message.metadata?.result?.success;
  const timestamp = new Date(message.timestamp);

  const renderAvatar = () => {
    switch (message.role) {
      case 'assistant':
        return (
          <Avatar className="h-8 w-8">
            <Bot className="h-5 w-5" />
          </Avatar>
        );
      case 'user':
        return (
          <Avatar className="h-8 w-8">
            <User className="h-5 w-5" />
          </Avatar>
        );
      case 'command':
        return (
          <Avatar className={cn('h-8 w-8', isError && 'text-destructive')}>
            {isError ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <Terminal className="h-5 w-5" />
            )}
          </Avatar>
        );
      default:
        return null;
    }
  };

  const renderCommandHeader = () => {
    if (!isCommand || !message.metadata?.command) return null;

    const { command, args } = message.metadata;
    const formattedArgs = args
      ? Object.entries(args)
          .map(([key, value]) => `${key}:${value}`)
          .join(' ')
      : '';

    return (
      <div className="flex items-center gap-2 mb-1 text-sm text-muted-foreground font-mono">
        <span className="font-semibold">/{command}</span>
        {formattedArgs && <span>{formattedArgs}</span>}
      </div>
    );
  };

  const renderContent = () => {
    if (isCommand && message.metadata?.result?.metadata?.type === 'image') {
      return (
        <div className="space-y-2">
          {message.metadata.result.content && (
            <p className="text-sm text-muted-foreground">
              {message.metadata.result.content}
            </p>
          )}
          <div className="relative aspect-square w-full max-w-[300px] rounded-lg border bg-muted">
            {/* Add image component here when ready */}
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Image placeholder</p>
            </div>
          </div>
        </div>
      );
    }

    if (isCommand && message.metadata?.result?.metadata?.type === 'code') {
      return (
        <div className="space-y-2">
          {message.metadata.result.content && (
            <Markdown content={message.metadata.result.content} />
          )}
        </div>
      );
    }

    return <Markdown content={message.content} />;
  };

  return (
    <div
      className={cn(
        'group relative flex gap-3 py-4',
        message.role === 'assistant' && 'bg-muted/50',
        className
      )}
    >
      <div className="flex w-full flex-1 gap-3 px-4">
        {renderAvatar()}
        <div className="flex-1 space-y-2">
          {renderCommandHeader()}
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            {renderContent()}
          </div>
          <div className="flex items-center justify-between">
            <time
              dateTime={timestamp.toISOString()}
              className="text-xs text-muted-foreground"
            >
              {format(timestamp, 'HH:mm')}
            </time>
            {isError && onRetry && (
              <button
                onClick={onRetry}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 