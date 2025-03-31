'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { useSettingsStore } from '@/store/settingsStore';
import { Loader2, Mic, Download, RefreshCw, ArrowLeft, Play, Pause, Volume2 } from 'lucide-react';

const voices = [
  { id: 'alloy', name: 'Alloy', description: 'Versatile, balanced voice' },
  { id: 'echo', name: 'Echo', description: 'Warm, deep voice' },
  { id: 'fable', name: 'Fable', description: 'Expressive, youthful voice' },
  { id: 'onyx', name: 'Onyx', description: 'Professional, authoritative voice' },
  { id: 'nova', name: 'Nova', description: 'Energetic, bright voice' },
  { id: 'shimmer', name: 'Shimmer', description: 'Clear, melodic voice' },
];

const providers = [
  { id: 'pollinations', name: 'Pollinations TTS' },
  { id: 'openai', name: 'OpenAI TTS' },
  { id: 'elevenlabs', name: 'ElevenLabs' },
  { id: 'google', name: 'Google TTS' },
];

const sampleTexts = [
  "Welcome to the text-to-speech testing tool. This sample demonstrates how the selected voice sounds with normal speech patterns.",
  "Once upon a time, in a land far away, there lived a young adventurer who dreamed of exploring the world beyond the mountains.",
  "The quick brown fox jumps over the lazy dog. This pangram contains all the letters of the English alphabet.",
  "AI technologies are transforming the way we interact with computers and digital systems, opening new possibilities for human-computer interaction.",
  "In 1969, humans first set foot on the moon, marking one of the greatest achievements in human history and space exploration."
];

type AudioResult = {
  id: string;
  text: string;
  voice: string;
  provider: string;
  url: string;
  timestamp: number;
};

export default function AudioTtsPage() {
  const router = useRouter();
  const { darkMode, setDarkMode } = useSettingsStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('alloy');
  const [provider, setProvider] = useState('pollinations');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioResults, setAudioResults] = useState<AudioResult[]>([]);
  const [activeTab, setActiveTab] = useState('generate');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [volume, setVolume] = useState(1);
  
  // Ensure dark mode is applied
  useEffect(() => {
    if (!darkMode) {
      setDarkMode(true);
    }
    
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('dark');
    }
  }, [darkMode, setDarkMode]);

  // Handle audio player state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      
      if (currentAudio) {
        audioRef.current.src = currentAudio;
        if (isPlaying) {
          audioRef.current.play().catch(e => console.error('Error playing audio:', e));
        } else {
          audioRef.current.pause();
        }
      }
    }
    
    const handleEnded = () => {
      setIsPlaying(false);
    };
    
    if (audioRef.current) {
      audioRef.current.addEventListener('ended', handleEnded);
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleEnded);
      }
    };
  }, [currentAudio, isPlaying, volume]);

  const generateAudio = async () => {
    if (!text.trim()) return;
    
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/audio-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice,
          provider
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate audio');
      }
      
      const newAudio: AudioResult = {
        id: `audio-${Date.now()}`,
        text,
        voice,
        provider,
        url: data.audioUrl,
        timestamp: Date.now()
      };
      
      // Add the new result to the beginning of the array
      setAudioResults(prev => [newAudio, ...prev]);
      
      // Automatically play the newly generated audio
      setCurrentAudio(data.audioUrl);
      setIsPlaying(true);
      
      setIsGenerating(false);
    } catch (error) {
      console.error('Error generating audio:', error);
      setIsGenerating(false);
    }
  };

  const playAudio = (url: string) => {
    if (currentAudio === url && isPlaying) {
      setIsPlaying(false);
    } else {
      setCurrentAudio(url);
      setIsPlaying(true);
    }
  };

  const downloadAudio = (url: string, index: number) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `tts-audio-${index}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const resetForm = () => {
    setText('');
    setVoice('alloy');
    setProvider('pollinations');
  };

  return (
    <div className="container mx-auto py-8 px-4 dark:bg-gray-900 dark:text-gray-100 min-h-screen">
      <div className="flex items-center mb-8 gap-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => router.push('/test-tools')}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Audio TTS Tool</h1>
          <p className="text-muted-foreground">
            Convert text to speech with different voices and providers
          </p>
        </div>
      </div>

      {/* Hidden audio element for playback */}
      <audio ref={audioRef} className="hidden" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="library">Audio Library</TabsTrigger>
          <TabsTrigger value="compare">Voice Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Text to Speech</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="text">Text</Label>
                <Textarea
                  id="text"
                  placeholder="Enter text to convert to speech..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="min-h-[150px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="voice">Voice</Label>
                  <Select value={voice} onValueChange={setVoice}>
                    <SelectTrigger id="voice">
                      <SelectValue placeholder="Select voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {voices.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name} - {v.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Select value={provider} onValueChange={setProvider}>
                    <SelectTrigger id="provider">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border rounded p-3 bg-muted/20">
                <Label className="mb-2 block">Sample Texts</Label>
                <div className="grid grid-cols-1 gap-2">
                  {sampleTexts.map((sample, index) => (
                    <Button 
                      key={index} 
                      variant="outline" 
                      className="justify-start h-auto py-2 px-3 text-left font-normal"
                      onClick={() => setText(sample)}
                    >
                      <span className="truncate">{sample.substring(0, 60)}...</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={resetForm}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button onClick={generateAudio} disabled={isGenerating || !text.trim()}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4 mr-2" />
                      Generate Audio
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {audioResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Audio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="border rounded-md p-4 bg-muted/10">
                    <div className="flex items-center gap-2 mb-4">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-full"
                        onClick={() => playAudio(audioResults[0].url)}
                      >
                        {isPlaying && currentAudio === audioResults[0].url ? (
                          <Pause className="h-5 w-5" />
                        ) : (
                          <Play className="h-5 w-5" />
                        )}
                      </Button>
                      
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div className="font-medium">{audioResults[0].voice}</div>
                          <div className="text-sm text-muted-foreground">{audioResults[0].provider}</div>
                        </div>
                        
                        <div className="w-full bg-muted h-1 rounded-full mt-1">
                          <div className="bg-primary h-1 rounded-full w-0" />
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => downloadAudio(audioResults[0].url, 0)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="text-sm text-muted-foreground max-w-prose">
                      <p>{audioResults[0].text}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-4">
                      <Volume2 className="h-4 w-4 text-muted-foreground" />
                      <Slider
                        defaultValue={[volume]}
                        max={1}
                        min={0}
                        step={0.1}
                        onValueChange={(value) => setVolume(value[0])}
                        className="w-24"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="library" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audio Library</CardTitle>
            </CardHeader>
            <CardContent>
              {audioResults.length > 0 ? (
                <div className="space-y-4">
                  {audioResults.map((result, index) => (
                    <div 
                      key={result.id} 
                      className="border rounded-md p-3 bg-muted/10 flex flex-col gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => playAudio(result.url)}
                        >
                          {isPlaying && currentAudio === result.url ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <div className="font-medium text-sm">{result.voice}</div>
                            <div className="text-xs text-muted-foreground">{result.provider}</div>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => downloadAudio(result.url, index)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {result.text}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Mic className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No audio yet</h3>
                  <p className="text-muted-foreground mt-2">
                    Generate some audio to see it here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compare" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Voice Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Compare how different voices sound with the same text
              </p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="compare-text">Text to Compare</Label>
                  <Textarea
                    id="compare-text"
                    placeholder="Enter text to compare across voices..."
                    className="min-h-[100px]"
                  />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {voices.slice(0, 6).map((v) => (
                    <Button 
                      key={v.id} 
                      variant="outline"
                      className="justify-start h-auto py-2 px-3"
                      disabled={true}
                    >
                      <div className="text-left">
                        <div className="font-medium">{v.name}</div>
                        <div className="text-xs text-muted-foreground">{v.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
                
                <Button className="w-full mt-4" disabled={true}>
                  <Mic className="h-4 w-4 mr-2" />
                  Compare Voices
                </Button>
                
                <div className="text-center py-4">
                  <p className="text-muted-foreground">
                    Voice comparison coming soon
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 