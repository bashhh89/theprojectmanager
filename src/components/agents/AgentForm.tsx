'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Upload, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChangeEvent, FormEvent } from "react";

interface AgentFormProps {
  agent?: {
    id: string;
    name: string;
    system_prompt: string;
  };
  onSubmit: (agent: { 
    id?: string; 
    name: string; 
    system_prompt: string;
    knowledge_source_info?: any;
    model_selection?: string;
    voice_selection?: string;
    intelligence_tools?: {
      proactiveNudging: boolean;
      webSearch: boolean;
      calendarConnect: boolean;
    }
  }) => Promise<void>;
  onCancel?: () => void;
}

export default function AgentForm({ agent, onSubmit, onCancel }: AgentFormProps) {
  const { toast } = useToast();
  const [name, setName] = useState(agent?.name || "");
  const [systemPrompt, setSystemPrompt] = useState(agent?.system_prompt || "");
  const [knowledgeText, setKnowledgeText] = useState("");
  const [knowledgeWebsite, setKnowledgeWebsite] = useState("");
  const [modelSelection, setModelSelection] = useState("openai");
  const [voiceSelection, setVoiceSelection] = useState("alloy");
  const [isLoading, setIsLoading] = useState(false);
  
  // Add state for file uploads
  const [uploadedFiles, setUploadedFiles] = useState<Array<{name: string, path: string, url: string, extractedText?: string}>>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Intelligence tools toggles
  const [proactiveNudging, setProactiveNudging] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [calendarConnect, setCalendarConnect] = useState(false);
  
  const isEditMode = !!agent;

  // Handle file upload
  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    e.preventDefault();
    
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const files = Array.from(e.target.files);
    
    setIsUploading(true);
    
    try {
      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        
        // Call the upload API
        const response = await fetch(`${window.location.origin}/api/upload`, {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('File uploaded:', result);
        
        // Add the file to our state, including extractedText if available
        setUploadedFiles(prev => [...prev, {
          name: result.name,
          path: result.path,
          url: result.url,
          extractedText: result.extractedText || '' // Store the extracted text from PDFs
        }]);
        
        // Show special message for PDF files with extracted text
        if (result.extractedText && file.type === 'application/pdf') {
          toast({
            title: "Upload successful",
            description: `${file.name} has been uploaded with ${result.extractedText.length} characters of extracted text.`
          });
        } else {
          toast({
            title: "Upload successful",
            description: `${file.name} has been uploaded.`
          });
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // Clear the file input
      e.target.value = '';
    }
  }

  // Remove a file from the uploaded files
  function removeFile(index: number) {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Agent name is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!systemPrompt.trim()) {
      toast({
        title: "Error",
        description: "System prompt is required",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    // Prepare knowledge source info
    const knowledge_source_info = {
      text: knowledgeText.trim(),
      website: knowledgeWebsite.trim(),
      files: uploadedFiles.map(file => ({
        name: file.name,
        path: file.path,
        url: file.url,
        extractedText: file.extractedText || '' // Include extracted text in the knowledge source info
      }))
    };
    
    // Prepare intelligence tools info
    const intelligence_tools = {
      proactiveNudging,
      webSearch,
      calendarConnect
    };
    
    try {
      await onSubmit({
        id: agent?.id,
        name: name.trim(),
        system_prompt: systemPrompt.trim(),
        knowledge_source_info,
        model_selection: modelSelection,
        voice_selection: voiceSelection,
        intelligence_tools
      });
      
      // Log the data for debugging
      console.log({
        name: name.trim(),
        system_prompt: systemPrompt.trim(),
        knowledge_source_info,
        model_selection: modelSelection,
        voice_selection: voiceSelection,
        intelligence_tools
      });
      
      toast({
        title: "Success",
        description: isEditMode ? "Agent updated successfully" : "New agent created successfully",
      });
      
      if (!isEditMode) {
        // Reset form if creating a new agent
        setName("");
        setSystemPrompt("");
        setKnowledgeText("");
        setKnowledgeWebsite("");
        setModelSelection("openai");
        setVoiceSelection("alloy");
        setProactiveNudging(false);
        setWebSearch(false);
        setCalendarConnect(false);
        setUploadedFiles([]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Agent Name</Label>
        <Input
          id="name"
          placeholder="Enter agent name"
          value={name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          disabled={isLoading}
          className="dark:bg-gray-800 dark:border-gray-700"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="systemPrompt">System Prompt</Label>
        <Textarea
          id="systemPrompt"
          placeholder="Define the behavior and capabilities of your agent"
          value={systemPrompt}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setSystemPrompt(e.target.value)}
          disabled={isLoading}
          className="min-h-[150px] dark:bg-gray-800 dark:border-gray-700"
        />
      </div>
      
      {/* Add Model Selection */}
      <div className="space-y-2">
        <Label htmlFor="modelSelection">Model</Label>
        <Select 
          value={modelSelection} 
          onValueChange={setModelSelection}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full dark:bg-gray-800 dark:border-gray-700">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="openai">OpenAI GPT-4o-mini</SelectItem>
            <SelectItem value="openai-large">OpenAI GPT-4o</SelectItem>
            <SelectItem value="openai-reasoning">OpenAI o3-mini</SelectItem>
            <SelectItem value="qwen-coder">Qwen 2.5 Coder</SelectItem>
            <SelectItem value="llama">Llama 3.3</SelectItem>
            <SelectItem value="mistral">Mistral Small</SelectItem>
            <SelectItem value="mistral-roblox">Mistral Roblox</SelectItem>
            <SelectItem value="roblox-rp">Roblox Roleplay</SelectItem>
            <SelectItem value="unity">Unity</SelectItem>
            <SelectItem value="midijourney">Midijourney</SelectItem>
            <SelectItem value="rtist">Rtist</SelectItem>
            <SelectItem value="searchgpt">SearchGPT</SelectItem>
            <SelectItem value="evil">Evil Mode</SelectItem>
            <SelectItem value="deepseek">DeepSeek-V3</SelectItem>
            <SelectItem value="deepseek-r1">DeepSeek-R1 Distill</SelectItem>
            <SelectItem value="deepseek-reasoner">DeepSeek R1 Full</SelectItem>
            <SelectItem value="deepseek-r1-llama">DeepSeek R1 Llama</SelectItem>
            <SelectItem value="qwen-reasoning">Qwen QWQ</SelectItem>
            <SelectItem value="llamalight">Llama 3.1 Light</SelectItem>
            <SelectItem value="llamaguard">Llamaguard</SelectItem>
            <SelectItem value="phi">Phi-4</SelectItem>
            <SelectItem value="phi-mini">Phi-4 Mini</SelectItem>
            <SelectItem value="llama-vision">Llama 3.2 Vision</SelectItem>
            <SelectItem value="pixtral">Pixtral</SelectItem>
            <SelectItem value="gemini">Gemini 2.0</SelectItem>
            <SelectItem value="gemini-thinking">Gemini Thinking</SelectItem>
            <SelectItem value="hormoz">Hormoz</SelectItem>
            <SelectItem value="hypnosis-tracy">Hypnosis Tracy</SelectItem>
            <SelectItem value="sur">Sur AI</SelectItem>
            <SelectItem value="sur-mistral">Sur AI (Mistral)</SelectItem>
            <SelectItem value="llama-scaleway">Llama (Scaleway)</SelectItem>
            <SelectItem value="openai-audio">OpenAI Audio</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Add Voice Selection */}
      <div className="space-y-2">
        <Label htmlFor="voiceSelection">Voice</Label>
        <Select 
          value={voiceSelection} 
          onValueChange={setVoiceSelection}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full dark:bg-gray-800 dark:border-gray-700">
            <SelectValue placeholder="Select voice" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alloy">Alloy</SelectItem>
            <SelectItem value="echo">Echo</SelectItem>
            <SelectItem value="fable">Fable</SelectItem>
            <SelectItem value="onyx">Onyx</SelectItem>
            <SelectItem value="nova">Nova</SelectItem>
            <SelectItem value="shimmer">Shimmer</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Knowledge Base Section */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Knowledge Base</h3>
        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-3 dark:bg-gray-800">
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="website">Website</TabsTrigger>
          </TabsList>
          <TabsContent value="text" className="space-y-2">
            <Label htmlFor="knowledgeText">Paste Knowledge Text</Label>
            <Textarea
              id="knowledgeText"
              placeholder="Paste text knowledge for your agent..."
              value={knowledgeText}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setKnowledgeText(e.target.value)}
              disabled={isLoading}
              className="min-h-[100px] dark:bg-gray-800 dark:border-gray-700"
            />
          </TabsContent>
          <TabsContent value="files" className="space-y-2">
            <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors dark:border-gray-700 dark:hover:bg-gray-800/50 relative">
              <input 
                type="file" 
                id="file-upload" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                onChange={handleFileUpload}
                multiple
                accept=".pdf,.docx,.txt"
                disabled={isLoading || isUploading}
              />
              <div className="h-8 w-8 mx-auto mb-2 text-muted-foreground">
                <Upload />
              </div>
              <p className="text-sm text-muted-foreground">Drag and drop files, or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT files supported</p>
              {isUploading && <p className="text-sm text-primary mt-2">Uploading...</p>}
            </div>
            
            {/* Display uploaded files */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Uploaded Files</h4>
                <ul className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <li key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded dark:bg-gray-800/50">
                      <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeFile(index)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>
          <TabsContent value="website" className="space-y-2">
            <Label htmlFor="knowledgeWebsite">Website URL</Label>
            <Input
              id="knowledgeWebsite"
              placeholder="https://example.com"
              value={knowledgeWebsite}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setKnowledgeWebsite(e.target.value)}
              disabled={isLoading}
              className="dark:bg-gray-800 dark:border-gray-700"
            />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Intelligence Tools Section */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle>Intelligence Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Enable Proactive Nudging</h4>
              <p className="text-sm text-muted-foreground">Allow agent to initiate conversations</p>
            </div>
            <Switch 
              checked={proactiveNudging} 
              onCheckedChange={setProactiveNudging} 
              disabled={isLoading} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Allow Web Search</h4>
              <p className="text-sm text-muted-foreground">Agent can search the web for information</p>
            </div>
            <Switch 
              checked={webSearch} 
              onCheckedChange={setWebSearch} 
              disabled={isLoading} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Connect to Calendar</h4>
              <p className="text-sm text-muted-foreground">Allow access to scheduling capabilities</p>
            </div>
            <Switch 
              checked={calendarConnect} 
              onCheckedChange={setCalendarConnect} 
              disabled={isLoading} 
            />
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end gap-2">
        {onCancel && (
          <DialogClose asChild>
            <Button variant="outline" onClick={onCancel} disabled={isLoading} className="dark:bg-gray-800 dark:border-gray-700">
              Cancel
            </Button>
          </DialogClose>
        )}
        <Button type="submit" disabled={isLoading} className="dark:bg-gray-700">
          {isLoading ? "Saving..." : isEditMode ? "Update Agent" : "Create Agent"}
        </Button>
      </div>
    </form>
  );
}