"use client"

import React, { useEffect, useRef, useState, Fragment } from "react"
import { useChatStore } from "@/store/chatStore"
import { useSettingsStore } from "@/store/settingsStore"
import { cn, logger } from "@/lib/utils"
import { User, Bot, PlayCircle, PauseCircle, Download, Volume2, Loader2, CopyIcon, RefreshCwIcon, UserIcon, BotIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { FixedSizeList as List } from 'react-window'
import { useResizeObserver } from "@/hooks/useResizeObserver"
import { showError, showSuccess } from '@/components/ui/toast';
import { logError } from '@/utils/errorLogging';

interface ChatMessagesProps {
  theme?: string;
}

interface MessageContent {
  type: 'text' | 'image';
  content: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | MessageContent[];
  timestamp: number;
}

export function ChatMessages({ theme }: ChatMessagesProps) {
  const messages = useChatStore(state => state.getActiveChatMessages()) as ChatMessage[]
  const isGenerating = useChatStore(state => state.isGenerating)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const activeChatId = useChatStore(state => state.activeChatId)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const listRef = useRef<List>(null)
  
  // State for audio playback
  const [audioState, setAudioState] = useState<{[key: string]: {isLoading: boolean, isPlaying: boolean, audioUrl?: string}}>({});
  const audioRefs = useRef<{[key: string]: HTMLAudioElement | null}>({});

  const [failedMessages, setFailedMessages] = useState<number[]>([]);
  const [retrying, setRetrying] = useState<number | null>(null);

  // Use resize observer to handle container dimensions
  useResizeObserver(containerRef, (entry) => {
    if (entry) {
      setContainerWidth(entry.contentRect.width);
      setContainerHeight(entry.contentRect.height);
    }
  })
  
  // Scroll to bottom helper
  const scrollToBottom = () => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToItem(messages.length - 1, "end")
    }
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChatId]); 

  // Cleanup audio elements on unmount or chat switch
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = "";
        }
      });
      audioRefs.current = {}; 
      setAudioState({}); 
    };
  }, [activeChatId]);

  // Function to handle audio playback for a message
  const handleAudioToggle = async (messageKey: string, textContent: string) => {
    try {
      const msgAudioState = audioState[messageKey] || { isLoading: false, isPlaying: false };
      const msgAudioRef = audioRefs.current[messageKey];
  
      // If currently playing, pause it
      if (msgAudioState.isPlaying && msgAudioRef) {
        msgAudioRef.pause();
        setAudioState(prev => ({ ...prev, [messageKey]: { ...prev[messageKey], isPlaying: false } }));
        return;
      }
  
      // If audio exists and is paused, play it
      if (msgAudioRef && !msgAudioState.isPlaying) {
        msgAudioRef.play().catch(err => {
          logger.error("Error resuming audio", err, { context: 'audio-playback' });
          toast({ title: "Audio Error", description: err.message, variant: "destructive" });
        });
        setAudioState(prev => ({ ...prev, [messageKey]: { ...prev[messageKey], isPlaying: true } }));
        return;
      }
  
      // --- If audio needs to be fetched --- 
      if (!msgAudioState.audioUrl && !msgAudioState.isLoading) {
        setAudioState(prev => ({ ...prev, [messageKey]: { isLoading: true, isPlaying: false } }));
        
        const activeVoice = useSettingsStore.getState().activeVoice;
        logger.debug(`Generating speech for message`, { 
          context: 'audio-generation',
          data: { messageKey, textPreview: textContent.substring(0, 30), voice: activeVoice }
        });
  
        const response = await fetch('/api/audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: textContent, voice: activeVoice, mode: "direct" }),
        });
  
        if (!response.ok) {
          throw new Error(`Audio API Error: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (!data.success || !data.audioUrl) {
          throw new Error('Invalid audio API response');
        }
  
        logger.debug("Received audio URL", { context: 'audio-generation', data: { messageKey } });
  
        // Create new audio element
        const newAudio = new Audio(data.audioUrl);
        audioRefs.current[messageKey] = newAudio;
  
        newAudio.onloadeddata = () => {
          logger.debug(`Audio loaded, playing...`, { context: 'audio-playback', data: { messageKey } });
          newAudio.play().catch(err => {
            logger.error("Error playing new audio", err, { context: 'audio-playback' });
            toast({ title: "Audio Error", description: err.message, variant: "destructive" });
          });
          setAudioState(prev => ({ ...prev, [messageKey]: { isLoading: false, isPlaying: true, audioUrl: data.audioUrl } }));
        };
        
        newAudio.onended = () => {
          setAudioState(prev => ({ ...prev, [messageKey]: { ...prev[messageKey], isPlaying: false } }));
        };
        
        newAudio.onerror = (e) => {
          logger.error("Audio playback error", e, { context: 'audio-playback' });
          setAudioState(prev => ({ ...prev, [messageKey]: { isLoading: false, isPlaying: false, audioUrl: undefined } })); 
          toast({ title: "Audio Playback Error", variant: "destructive" });
        };
      }
    } catch (error: any) {
      logger.error("Error handling audio", error, { context: 'audio-generation' });
      setAudioState(prev => ({ ...prev, [messageKey]: { isLoading: false, isPlaying: false } }));
      toast({ title: "Audio Generation Failed", description: error.message, variant: "destructive" });
    }
  };

  const handleRetry = async (index: number) => {
    try {
      setRetrying(index);
      // Your retry logic here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate retry
      setFailedMessages(prev => prev.filter(i => i !== index));
      showSuccess('Message resent successfully');
    } catch (error) {
      logError({
        error: error instanceof Error ? error.toString() : 'Failed to retry message',
        context: 'Message Retry',
        additionalData: { messageIndex: index }
      });
      showError('Could not resend message. Please try again.');
    } finally {
      setRetrying(null);
    }
  };

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      showSuccess('Copied to clipboard');
    } catch (error) {
      logError({
        error: error instanceof Error ? error.toString() : 'Failed to copy message',
        context: 'Copy to Clipboard'
      });
      showError('Could not copy message');
    }
  };

  // No messages state
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="mb-4 p-4 rounded-full bg-primary/10">
          <Bot className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">How can I help you today?</h3>
        <p className="text-muted-foreground max-w-md">
          Ask me anything, from creative writing to coding help, research questions, or just casual conversation.
        </p>
      </div>
    );
  }

  // Render individual message
  const renderMessage = ({ index, style }: { index: number, style: React.CSSProperties }) => {
    const message = messages[index];
    const isUser = message.role === "user";
    const messageKey = `msg-${activeChatId}-${index}`;
    const msgAudioState = audioState[messageKey] || { isLoading: false, isPlaying: false };
    
    // Handle both string content and structured content
    const textContent = typeof message.content === 'string' 
      ? message.content 
      : Array.isArray(message.content)
        ? message.content
            .filter((item: MessageContent) => item.type === "text")
            .map((item: MessageContent) => item.content)
            .join(" ")
        : '';

    return (
      <div 
        style={style}
        className={cn(
          "py-5 px-4 md:px-8", 
          !isUser && "bg-muted/40",
          failedMessages.includes(index) && 'border-red-500 border'
        )}
      >
        <div className="max-w-3xl mx-auto flex gap-4 items-start">
          {/* Avatar */}
          <div className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
            isUser ? "bg-primary/10 text-primary" : "bg-primary text-primary-foreground"
          )}>
            {isUser ? (
              <User className="w-5 h-5" />
            ) : (
              <Bot className="w-5 h-5" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 space-y-2">
            {/* Role label */}
            <div className="text-sm font-medium">
              {isUser ? "You" : "QanDuAI"}
            </div>
            
            {/* Message content */}
            <div className="space-y-4">
              {typeof message.content === 'string' ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {message.content.split('\n').map((line, i) => (
                    <Fragment key={i}>
                      {line}
                      {i < message.content.split('\n').length - 1 && <br />}
                    </Fragment>
                  ))}
                </div>
              ) : Array.isArray(message.content) ? (
                message.content.map((item, itemIndex) => (
                  <Fragment key={itemIndex}>
                    {item.type === "text" && (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        {item.content.split('\n').map((line, i) => (
                          <Fragment key={i}>
                            {line}
                            {i < item.content.split('\n').length - 1 && <br />}
                          </Fragment>
                        ))}
                      </div>
                    )}
                  </Fragment>
                ))
              ) : null}
            </div>

            {/* Message actions */}
            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCopy(textContent)}
                className="h-8 w-8"
              >
                <CopyIcon className="h-4 w-4" />
              </Button>
              
              {!isUser && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleAudioToggle(messageKey, textContent)}
                  className="h-8 w-8"
                  disabled={msgAudioState.isLoading}
                >
                  {msgAudioState.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : msgAudioState.isPlaying ? (
                    <PauseCircle className="h-4 w-4" />
                  ) : (
                    <PlayCircle className="h-4 w-4" />
                  )}
                </Button>
              )}
              
              {failedMessages.includes(index) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRetry(index)}
                  className="h-8 w-8"
                  disabled={retrying === index}
                >
                  {retrying === index ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCwIcon className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Estimating an average message height - better would be adaptive sizing
  const estimatedMessageHeight = 180;

  return (
    <div 
      ref={containerRef}
      className="space-y-6 max-w-3xl mx-auto h-[calc(100vh-220px)]" // Adjust height as needed
    >
      {containerHeight > 0 && (
        <List
          ref={listRef}
          height={containerHeight}
          width="100%"
          itemCount={messages.length}
          itemSize={estimatedMessageHeight}
          overscanCount={3} // Load extra items above/below viewport
        >
          {renderMessage}
        </List>
      )}
      
      {/* Generating Indicator */}
      {isGenerating && (
        <div className="py-5 px-4 md:px-8 bg-muted/40 border-t">
          <div className="max-w-3xl mx-auto flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            
            <div className="flex-1">
              <div className="text-sm font-medium mb-2">QanDuAI</div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Thinking...
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Ref element for scrolling to bottom */}
      <div ref={messagesEndRef} />
    </div>
  );
}