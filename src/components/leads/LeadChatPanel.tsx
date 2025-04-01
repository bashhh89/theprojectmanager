import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { callPollinationsChat, generateAudioUrl } from '@/lib/pollinationsApi';
import { Mic, Send, User, Bot, Play, Speaker, PauseCircle, Copy, Check, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { useSettingsStore } from '@/store/settingsStore';

interface LeadChatPanelProps {
  lead: {
    id: string;
    name: string;
    email: string;
    initial_message?: string;
    notes?: string;
    created_at: string;
    status: string;
    source: string;
    agents?: {
      id: string;
      name: string;
    };
  };
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export function LeadChatPanel({ lead }: LeadChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('chat');
  const [generatedEmail, setGeneratedEmail] = useState<string>('');
  const [generatedResponse, setGeneratedResponse] = useState<string>('');
  const [copiedState, setCopiedState] = useState<{[key: string]: boolean}>({});
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { activeVoice, activeTextModel } = useSettingsStore();

  // Initialize with context about the lead
  useEffect(() => {
    // Only initialize once
    if (messages.length === 0) {
      const initialMessages: ChatMessage[] = [];
      
      // Add system message with context about the lead
      initialMessages.push({
        role: 'system',
        content: `You are helping with a lead named ${lead.name}. 
Email: ${lead.email}. 
Initial message: ${lead.initial_message || 'Not provided'}. 
Current status: ${lead.status}. 
Notes: ${lead.notes || 'None'}.
Source: ${lead.source || 'Unknown'}.
Created at: ${new Date(lead.created_at).toLocaleDateString()}.
Assist the sales agent with this lead.`
      });
      
      // If there's an initial message from the lead, add it
      if (lead.initial_message) {
        initialMessages.push({
          role: 'user',
          content: lead.initial_message,
          timestamp: new Date(lead.created_at)
        });
        
        // Add a welcome response from the assistant
        initialMessages.push({
          role: 'assistant',
          content: `I see you have a lead named ${lead.name} who reached out with: "${lead.initial_message}". How would you like me to help you with this lead?`,
          timestamp: new Date()
        });
      } else {
        // Add a welcome message if there's no initial message
        initialMessages.push({
          role: 'assistant',
          content: `I'm here to help you with lead ${lead.name}. What would you like to do with this lead?`,
          timestamp: new Date()
        });
      }
      
      setMessages(initialMessages);
    }
  }, [lead, messages.length]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clean up audio when unmounting
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && inputValue.trim()) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Prepare messages for API (excluding system messages which we'll add separately)
      const historyMessages = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({ role: msg.role, content: msg.content }));
      
      // Get system message
      const systemMessage = messages.find(msg => msg.role === 'system')?.content || '';
      
      // Add new user message
      const apiMessages = [...historyMessages, { role: 'user', content: userMessage.content }];
      
      // Call API
      const response = await callPollinationsChat(
        apiMessages,
        activeTextModel || 'openai',
        systemMessage,
        false
      );
      
      // Handle different response formats
      let responseText = '';
      if (typeof response === 'string') {
        responseText = response;
      } else if (response.message && response.message.content) {
        responseText = response.message.content;
      } else if (response.text) {
        responseText = response.text;
      } else {
        responseText = JSON.stringify(response);
      }

      // Add assistant response to chat
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: responseText,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Generate audio for the response
      if (activeVoice) {
        const url = generateAudioUrl(responseText, activeVoice);
        setAudioUrl(url);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate response. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = () => {
    if (!audioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => {
        setIsPlaying(false);
      };
      audioRef.current.onerror = () => {
        toast({
          title: 'Error',
          description: 'Failed to play audio',
          variant: 'destructive'
        });
        setIsPlaying(false);
      };
    } else {
      audioRef.current.src = audioUrl;
    }

    audioRef.current.play()
      .then(() => setIsPlaying(true))
      .catch(err => {
        console.error('Error playing audio:', err);
        setIsPlaying(false);
      });
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const generateEmailTemplate = async () => {
    setIsLoading(true);
    try {
      const promptContent = `Generate a professional email to send to ${lead.name} (${lead.email}) based on their inquiry: "${lead.initial_message || "No initial message"}". Their current status is ${lead.status}. Include a personalized introduction, address their needs, and include a clear call-to-action. The email should be professional, friendly, and concise.`;
      
      const response = await callPollinationsChat(
        [{ role: 'user', content: promptContent }],
        activeTextModel || 'openai',
        'You are a professional email writer for a sales team. Create compelling, personalized emails that engage leads.',
        false
      );
      
      let responseText = '';
      if (typeof response === 'string') {
        responseText = response;
      } else if (response.message && response.message.content) {
        responseText = response.message.content;
      } else if (response.text) {
        responseText = response.text;
      }
      
      setGeneratedEmail(responseText);
    } catch (error) {
      console.error('Error generating email:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate email template. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const generateFollowupResponse = async () => {
    setIsLoading(true);
    try {
      const promptContent = `Generate a follow-up response for ${lead.name} who is currently in the ${lead.status} stage. Their initial inquiry was: "${lead.initial_message || "No initial message"}". Create a response that moves the conversation forward and addresses any potential concerns they might have.`;
      
      const response = await callPollinationsChat(
        [{ role: 'user', content: promptContent }],
        activeTextModel || 'openai',
        'You are a sales assistant helping with lead follow-up. Create concise, effective responses.',
        false
      );
      
      let responseText = '';
      if (typeof response === 'string') {
        responseText = response;
      } else if (response.message && response.message.content) {
        responseText = response.message.content;
      } else if (response.text) {
        responseText = response.text;
      }
      
      setGeneratedResponse(responseText);
    } catch (error) {
      console.error('Error generating follow-up:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate follow-up response. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedState(prev => ({ ...prev, [key]: true }));
        setTimeout(() => {
          setCopiedState(prev => ({ ...prev, [key]: false }));
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy text:', err);
        toast({
          title: 'Error',
          description: 'Failed to copy to clipboard',
          variant: 'destructive'
        });
      });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full h-full flex flex-col"
      >
        <div className="border-b px-4">
          <TabsList className="h-10">
            <TabsTrigger value="chat" className="text-sm">
              AI Chat
            </TabsTrigger>
            <TabsTrigger value="email" className="text-sm">
              Email Template
            </TabsTrigger>
            <TabsTrigger value="response" className="text-sm">
              Follow-up Response
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="chat" className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.filter(m => m.role !== 'system').map((message, index) => (
                <div 
                  key={index}
                  className={cn(
                    "flex w-max max-w-[80%] rounded-lg p-4",
                    message.role === 'user' 
                      ? "ml-auto bg-primary text-primary-foreground" 
                      : "bg-muted"
                  )}
                >
                  <div className="flex gap-3 items-start">
                    <Avatar className="h-8 w-8 mt-1">
                      {message.role === 'user' ? (
                        <User className="h-5 w-5" />
                      ) : (
                        <Bot className="h-5 w-5" />
                      )}
                      <AvatarFallback>
                        {message.role === 'user' ? 'U' : 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {message.role === 'user' ? 'You' : 'Assistant'}
                        {message.timestamp && (
                          <span className="ml-2 text-xs opacity-70">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                        )}
                      </p>
                      <div className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="bg-muted rounded-lg p-4 w-max max-w-[80%]">
                  <div className="flex gap-3 items-start">
                    <Avatar className="h-8 w-8 mt-1">
                      <Bot className="h-5 w-5" />
                      <AvatarFallback>A</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">Assistant</p>
                      <div className="text-sm flex gap-1">
                        <span className="animate-pulse">●</span>
                        <span className="animate-pulse animation-delay-200">●</span>
                        <span className="animate-pulse animation-delay-400">●</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t">
            <form
              onSubmit={e => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-2"
            >
              <Input
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1"
              />
              {audioUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={isPlaying ? pauseAudio : playAudio}
                  className="shrink-0"
                >
                  {isPlaying ? <PauseCircle className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
              )}
              <Button type="submit" disabled={isLoading || !inputValue.trim()} className="shrink-0">
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </TabsContent>
        
        <TabsContent value="email" className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto p-4">
            <div className="mb-4">
              <Button 
                onClick={generateEmailTemplate} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Generating...' : 'Generate Email Template'}
              </Button>
            </div>
            
            {generatedEmail && (
              <Card className="mb-4">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Email Template</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(generatedEmail, 'email')}
                    className="h-8 w-8 p-0"
                  >
                    {copiedState['email'] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap text-sm">
                    {generatedEmail}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="response" className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto p-4">
            <div className="mb-4">
              <Button 
                onClick={generateFollowupResponse} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Generating...' : 'Generate Follow-up Response'}
              </Button>
            </div>
            
            {generatedResponse && (
              <Card className="mb-4">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Follow-up Response</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(generatedResponse, 'response')}
                    className="h-8 w-8 p-0"
                  >
                    {copiedState['response'] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap text-sm">
                    {generatedResponse}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 