"use client"

import React, { useEffect, useRef, useState } from "react"
import { useChatStore } from "@/store/chatStore"
import { useSettingsStore } from "@/store/settingsStore"

export function ChatMessages() {
  const messages = useChatStore(state => state.getActiveChatMessages())
  const isGenerating = useChatStore(state => state.isGenerating)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isLoadingAudio, setIsLoadingAudio] = useState<{[key: number]: boolean}>({})
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null)
  const [conversationContext, setConversationContext] = useState<Array<{role: string, content: string}>>([])
  const [showAudioPlayer, setShowAudioPlayer] = useState<{[key: number]: boolean}>({})
  const [audioUrls, setAudioUrls] = useState<{[key: number]: string}>({})
  const [audioMenuVisible, setAudioMenuVisible] = useState<number | null>(null)
  const activeAgent = useSettingsStore(state => state.activeAgent)
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Initialize conversation context from messages when component mounts or messages change
  useEffect(() => {
    if (messages.length > 0) {
      // Convert messages to the format expected by our conversation API
      const formattedConversation = messages.flatMap((message, index) => {
        // Only include text content
        return message.content
          .filter(item => item.type === "text" && item.content.trim().length > 0)
          .map(item => ({
            role: message.role,
            content: item.content
          }));
      });
      
      // Ensure we don't have too many messages (limit to last 10 to prevent token overflow)
      const limitedContext = formattedConversation.slice(-10);
      
      // Update conversation context when messages change
      setConversationContext(limitedContext);
      console.log("Updated conversation context from messages:", limitedContext.length, "messages");
    }
  }, [messages]);

  // Hide audio menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (audioMenuVisible !== null) {
        // Check if click is outside of audio menu
        const target = e.target as Element;
        if (!target.closest('.audio-menu-dropdown') && !target.closest('.audio-menu-button')) {
          setAudioMenuVisible(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [audioMenuVisible]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.src = "";
      }
    };
  }, [audioPlayer]);

  // Play text as speech in direct TTS mode (just reads the text)
  const playTextAsSpeech = async (text: string, messageIndex: number, role: string) => {
    try {
      // Stop any currently playing audio
      if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.src = "";
      }

      // Set loading state for this specific message
      setIsLoadingAudio(prev => ({ ...prev, [messageIndex]: true }))
      
      const activeVoice = useSettingsStore.getState().activeVoice;
      
      console.log(`Generating speech for text (${activeVoice}): "${text.substring(0, 50)}..."`);
      
      // Use the API with basic parameters for direct TTS
      const response = await fetch('/api/audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voice: activeVoice,
          mode: "direct"
        }),
      });
      
      // Check if the response is valid
      if (!response.ok) {
        throw new Error(`Failed to generate audio: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success || !data.audioUrl) {
        throw new Error('Invalid response from audio API');
      }
      
      console.log("Received audio URL:", data.audioUrl);
      
      // Store the audio URL for potential download
      setAudioUrls(prev => ({
        ...prev,
        [messageIndex]: data.audioUrl
      }));
      
      // Create and play audio
      const audio = new Audio();
      
      // Debug for audio loading issues
      audio.addEventListener('loadstart', () => console.log('Audio loading started'));
      audio.addEventListener('loadedmetadata', () => console.log('Audio metadata loaded'));
      audio.addEventListener('canplay', () => console.log('Audio can play'));
      audio.addEventListener('canplaythrough', () => console.log('Audio can play through'));
      
      // Set up error handling for the audio element with more details
      audio.onerror = (e: Event) => {
        const errorTarget = e.target as HTMLAudioElement;
        const errorCode = errorTarget.error ? errorTarget.error.code : 'unknown';
        const errorMessage = errorTarget.error ? errorTarget.error.message : 'Unknown error';
        console.error(`Audio playback error: Code ${errorCode} - ${errorMessage}`, errorTarget.src);
        alert(`Failed to play audio: ${errorMessage}`);
        setIsLoadingAudio(prev => {
          const newState = { ...prev };
          delete newState[messageIndex];
          return newState;
        });
      };
      
      // Set up load handling for the audio element
      audio.onloadeddata = () => {
        console.log("Audio loaded successfully, playing...");
        audio.play().catch(err => {
          console.error("Error playing audio:", err);
          alert("Could not play audio. " + err.message);
          setIsLoadingAudio(prev => {
            const newState = { ...prev };
            delete newState[messageIndex];
            return newState;
          });
        });
      };
      
      // Store the audio player in state for later cleanup
      setAudioPlayer(audio);
      
      // Show the audio player for better UX
      setShowAudioPlayer(prev => ({
        ...prev,
        [messageIndex]: true
      }));
      
      // Set the source last to trigger loading
      audio.src = data.audioUrl;
      console.log("Set audio source to:", data.audioUrl);
      
      // Force a load attempt
      audio.load();
      
    } catch (error) {
      console.error("Error playing text as speech:", error);
      alert("Failed to generate or play audio. Please try again.");
    } finally {
      // Clear loading state
      setIsLoadingAudio(prev => {
        const newState = { ...prev };
        delete newState[messageIndex];
        return newState;
      });
    }
  }

  // Start or continue a conversation with audio
  const startConversation = async (text: string, messageIndex: number, role: string) => {
    try {
      // Stop any currently playing audio
      if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.src = "";
      }

      // Set loading state for this specific message
      setIsLoadingAudio(prev => ({ ...prev, [messageIndex]: true }))
      
      const activeVoice = useSettingsStore.getState().activeVoice;
      
      console.log(`Starting audio conversation with: "${text.substring(0, 50)}..."`);
      console.log(`Using conversation context with ${conversationContext.length} messages`);
      
      // Use the API with conversation context
      const response = await fetch('/api/audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voice: activeVoice,
          mode: "conversation",
          context: conversationContext
        }),
      });
      
      // Check if the response is valid
      if (!response.ok) {
        throw new Error(`Failed to generate audio: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success || !data.audioUrl) {
        throw new Error('Invalid response from audio API');
      }
      
      console.log("Received audio conversation response:", data);
      
      // Store the audio URL
      setAudioUrls(prev => ({
        ...prev,
        [messageIndex]: data.audioUrl
      }));
      
      // Create and play audio
      const audio = new Audio();
      
      // Debug for audio loading issues
      audio.addEventListener('loadstart', () => console.log('Audio loading started'));
      audio.addEventListener('loadedmetadata', () => console.log('Audio metadata loaded'));
      
      // Set up error handling - don't throw error, just log it
      audio.onerror = (e: Event) => {
        const errorTarget = e.target as HTMLAudioElement;
        console.error("Audio playback error:", 
          errorTarget.error ? `${errorTarget.error.code}: ${errorTarget.error.message}` : 'Unknown error');
        alert(`Failed to play audio: ${(errorTarget.error?.message || 'Unknown error')}`);
        setIsLoadingAudio(prev => {
          const newState = { ...prev };
          delete newState[messageIndex];
          return newState;
        });
      };
      
      // Set up load handling
      audio.onloadeddata = () => {
        console.log("Audio loaded successfully, playing...");
        audio.play().catch(err => {
          console.error("Error playing audio:", err);
          alert("Could not play audio. " + err.message);
          setIsLoadingAudio(prev => {
            const newState = { ...prev };
            delete newState[messageIndex];
            return newState;
          });
        });
      };
      
      // Store the audio player in state
      setAudioPlayer(audio);
      
      // Show the audio player for conversation responses
      setShowAudioPlayer(prev => ({
        ...prev,
        [messageIndex]: true
      }));
      
      // Set the source last to trigger loading
      audio.src = data.audioUrl;
      console.log("Set audio source to:", data.audioUrl);
      
      // Force a load attempt
      audio.load();
      
      // Update chat store with AI response if available
      if (data.responseText && !data.fallback) {
        const addMessage = useChatStore.getState().addMessage;
        addMessage({
          role: "assistant", 
          content: [{ type: "text", content: data.responseText }]
        });
      }
      
    } catch (error) {
      console.error("Error in audio conversation:", error);
      alert("Failed to generate conversation response. Please try again.");
    } finally {
      // Clear loading state
      setIsLoadingAudio(prev => {
        const newState = { ...prev };
        delete newState[messageIndex];
        return newState;
      });
    }
  }
  
  // Download the audio file directly
  const downloadAudio = async (messageIndex: number, text: string) => {
    try {
      // Set loading state
      setIsLoadingAudio(prev => ({ ...prev, [messageIndex]: true }));
      
      // Get the appropriate voice
      const activeVoice = useSettingsStore.getState().activeVoice;
      
      // Always generate a fresh URL for downloading to ensure it works
      const response = await fetch('/api/audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voice: activeVoice,
          mode: "direct"
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate audio: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success || !data.audioUrl) {
        throw new Error('Invalid response from audio API');
      }
      
      const audioUrl = data.audioUrl;
      
      try {
        // Fetch the audio as a blob
        const audioResponse = await fetch(audioUrl);
        if (!audioResponse.ok) {
          throw new Error('Failed to fetch audio file');
        }
        
        const audioBlob = await audioResponse.blob();
        
        // Create a URL for the blob
        const blobUrl = URL.createObjectURL(audioBlob);
        
        // Generate a filename with timestamp
        const fileName = `audio-${new Date().toISOString().replace(/[:.]/g, '-')}.mp3`;
        
        // Create temporary anchor element for download
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        
        console.log("Downloading audio file:", fileName);
        a.click();
        
        // Clean up after a short delay to ensure the download starts
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
        }, 500);
        
        // Update stored URL to ensure we have the latest
        setAudioUrls(prev => ({
          ...prev,
          [messageIndex]: audioUrl
        }));
      } catch (downloadError) {
        console.error("Error during audio download:", downloadError);
        
        // Fallback: Open in new tab if blob approach fails
        window.open(audioUrl, '_blank');
        alert("Direct download failed. Opening audio in a new tab instead.");
      }
      
    } catch (error) {
      console.error("Error downloading audio:", error);
      alert("Failed to download audio. Please try again.");
    } finally {
      setIsLoadingAudio(prev => {
        const newState = { ...prev };
        delete newState[messageIndex];
        return newState;
      });
    }
  }
  
  // Toggle the audio menu for a specific message
  const toggleAudioMenu = (messageIndex: number) => {
    setAudioMenuVisible(prev => prev === messageIndex ? null : messageIndex);
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-2xl font-semibold mb-4">Welcome to the chat</h2>
        <p className="text-muted-foreground mb-6">Start a conversation by typing a message below.</p>
        {activeAgent && (
          <div className="text-sm text-muted-foreground mb-6 p-2 border rounded-md bg-muted/10">
            <div className="font-medium mb-1">Active Agent: {activeAgent.name}</div>
            <div className="text-xs line-clamp-2">{activeAgent.systemPrompt}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 relative">
      {activeAgent && (
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur p-2 rounded-md border mb-4 text-sm">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></svg>
            </div>
            <div>
              <div className="font-medium text-xs">Active Agent: {activeAgent.name}</div>
              <div className="text-xs text-muted-foreground line-clamp-1">{activeAgent.systemPrompt?.substring(0, 100)}...</div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <h3 className="text-xl font-medium mb-2">Welcome to the chat</h3>
              <p>Start a conversation by typing a message below.</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {message.content.map((item, i) => {
                    if (item.type === "text") {
                      return (
                        <div key={i} className="flex flex-col">
                          <div className="flex items-start gap-2">
                            <p className="text-base leading-relaxed" style={{ whiteSpace: "pre-wrap" }}>
                              {item.content}
                            </p>
                            
                            {/* Audio controls dropdown - consistent styling for both user and AI */}
                            {item.content.length > 4 && (
                              <div className="relative ml-1 audio-menu-container">
                                <button 
                                  onClick={() => toggleAudioMenu(index)}
                                  className={`p-1.5 rounded-full audio-menu-button ${
                                    message.role === "user" 
                                      ? "bg-white/10 text-white/90 hover:bg-white/20" 
                                      : "bg-background/80 text-foreground/80 hover:bg-background"
                                  } focus:outline-none transition-colors`}
                                  title="Audio options"
                                  disabled={isLoadingAudio[index]}
                                >
                                  {isLoadingAudio[index] ? (
                                    <div className="animate-spin h-4 w-4 border-2 border-current rounded-full border-t-transparent"></div>
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                                    </svg>
                                  )}
                                </button>
                                
                                {/* Dropdown menu for audio options - consistent styling for both */}
                                {audioMenuVisible === index && (
                                  <div 
                                    className={`absolute ${message.role === "user" ? "right-0" : "left-0"} mt-2 w-60 bg-background rounded-md shadow-lg border z-10 audio-menu-dropdown`}
                                  >
                                    <div className="p-3 space-y-2">
                                      <h4 className="font-medium text-xs uppercase text-muted-foreground mb-1 pb-1 border-b">Audio Options</h4>
                                      
                                      <button 
                                        onClick={() => {
                                          playTextAsSpeech(item.content, index, message.role);
                                          setAudioMenuVisible(null); // Close menu after selection
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md flex items-center gap-2 transition-colors"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                        </svg>
                                        <span>Play as Text-to-Speech</span>
                                      </button>
                                      
                                      <button 
                                        onClick={() => {
                                          startConversation(item.content, index, message.role);
                                          setAudioMenuVisible(null); // Close menu after selection
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md flex items-center gap-2 transition-colors"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                        </svg>
                                        <span>Conversational Response</span>
                                      </button>
                                      
                                      <button 
                                        onClick={() => {
                                          downloadAudio(index, item.content);
                                          setAudioMenuVisible(null); // Close menu after selection
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md flex items-center gap-2 transition-colors"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                          <polyline points="7 10 12 15 17 10"></polyline>
                                          <line x1="12" y1="15" x2="12" y2="3"></line>
                                        </svg>
                                        <span>Download Audio File</span>
                                      </button>
                                      
                                      {/* Only show embedded player if we have a valid URL */}
                                      {audioUrls[index] && (
                                        <div className="pt-2 mt-1 border-t">
                                          <audio 
                                            controls 
                                            className="w-full h-8" 
                                            src={audioUrls[index]}
                                          >
                                            <source src={audioUrls[index]} type="audio/mpeg" />
                                            Your browser does not support the audio element.
                                          </audio>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Show audio player inline if it's being displayed for this message */}
                          {showAudioPlayer[index] && audioUrls[index] && !audioMenuVisible && (
                            <div className="mt-2 audio-player-inline">
                              <audio 
                                controls 
                                className="w-full h-8" 
                                src={audioUrls[index]}
                              >
                                <source src={audioUrls[index]} type="audio/mpeg" />
                                Your browser does not support the audio element.
                              </audio>
                            </div>
                          )}
                        </div>
                      );
                    }
                    if (item.type === "image") {
                      return (
                        <div key={i} className="mt-3 relative">
                          <img
                            src={item.content}
                            alt="Generated Image"
                            className="max-w-full rounded-md border"
                            style={{ maxHeight: "400px" }}
                          />
                          <div className="mt-1 flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Generated Image</span>
                            <a 
                              href={item.content}
                              download="generated-image.jpg"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
                            >
                              Download
                            </a>
                          </div>
                        </div>
                      );
                    }
                    if (item.type === "audio") {
                      return (
                        <audio
                          key={i}
                          className="mt-2 w-full"
                          controls
                        >
                          <source src={item.content} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            ))
          )}
          {isGenerating && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted text-foreground">
                <div className="flex space-x-2">
                  <div className="animate-pulse h-2 w-2 rounded-full bg-current"></div>
                  <div className="animate-pulse animation-delay-150 h-2 w-2 rounded-full bg-current"></div>
                  <div className="animate-pulse animation-delay-300 h-2 w-2 rounded-full bg-current"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}