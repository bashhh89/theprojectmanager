"use client";

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useSettingsStore } from '@/store/settingsStore';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AVAILABLE_MODELS } from '@/lib/pollinationsApi';
import { toast } from '@/components/ui/use-toast';
import { useUser } from '@/hooks/useUser';
import { logger } from '@/lib/utils';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  
  // Settings store values
  const { 
    activeTextModel, 
    setActiveTextModel,
    activeVoice,
    setActiveVoice,
    activeAgent,
    setActiveAgent,
    agents
  } = useSettingsStore();
  
  // Additional settings
  const [chatSettings, setChatSettings] = useState({
    autoSave: true,
    messageHistory: 50,
    autoScroll: true,
    inlineImages: true
  });
  
  const [interfaceSettings, setInterfaceSettings] = useState({
    fontSize: 16,
    showTimestamps: true,
    compactMode: false,
    highContrast: false
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    enableNotifications: true,
    soundAlerts: false,
    desktopNotifications: true,
    mentionAlerts: true
  });
  
  // Ensure component is mounted before accessing theme
  useEffect(() => {
    setMounted(true);
    const storedDebugMode = localStorage.getItem('debug_mode') === 'true';
    setDebugMode(storedDebugMode);
    
    // Load settings from localStorage
    try {
      const storedChatSettings = localStorage.getItem('chat_settings');
      const storedInterfaceSettings = localStorage.getItem('interface_settings');
      const storedNotificationSettings = localStorage.getItem('notification_settings');
      
      if (storedChatSettings) setChatSettings(JSON.parse(storedChatSettings));
      if (storedInterfaceSettings) setInterfaceSettings(JSON.parse(storedInterfaceSettings));
      if (storedNotificationSettings) setNotificationSettings(JSON.parse(storedNotificationSettings));
    } catch (error) {
      logger.error('Error loading settings from localStorage', error, { context: 'settings-page' });
    }
  }, []);
  
  // Save settings to localStorage when they change
  useEffect(() => {
    if (!mounted) return;
    
    try {
      localStorage.setItem('chat_settings', JSON.stringify(chatSettings));
      localStorage.setItem('interface_settings', JSON.stringify(interfaceSettings));
      localStorage.setItem('notification_settings', JSON.stringify(notificationSettings));
    } catch (error) {
      logger.error('Error saving settings to localStorage', error, { context: 'settings-page' });
    }
  }, [mounted, chatSettings, interfaceSettings, notificationSettings]);
  
  // Handle theme change
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
  };
  
  // Handle debug mode toggle
  const handleDebugModeToggle = (enabled: boolean) => {
    setDebugMode(enabled);
    localStorage.setItem('debug_mode', enabled.toString());
    toast({
      title: enabled ? 'Debug Mode Enabled' : 'Debug Mode Disabled',
      description: enabled 
        ? 'Additional logging information will be available in the console.'
        : 'Debug logging has been turned off.',
      duration: 3000
    });
  };
  
  // Handle chat settings change
  const handleChatSettingChange = (key: string, value: any) => {
    setChatSettings(prev => ({ ...prev, [key]: value }));
  };
  
  // Handle interface settings change
  const handleInterfaceSettingChange = (key: string, value: any) => {
    setInterfaceSettings(prev => ({ ...prev, [key]: value }));
  };
  
  // Handle notification settings change
  const handleNotificationSettingChange = (key: string, value: any) => {
    setNotificationSettings(prev => ({ ...prev, [key]: value }));
  };
  
  // Clear all application data
  const handleClearAllData = () => {
    if (confirm('Are you sure you want to clear all application data? This cannot be undone.')) {
      try {
        // Clear specific items instead of clearing everything
        localStorage.removeItem('chat-storage');
        localStorage.removeItem('settings-storage');
        localStorage.removeItem('chat_settings');
        localStorage.removeItem('interface_settings');
        localStorage.removeItem('notification_settings');
        localStorage.removeItem('saved_prompts');
        
        toast({
          title: 'Data Cleared',
          description: 'All application data has been cleared. The page will reload.',
          duration: 3000
        });
        
        // Reload the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (error) {
        logger.error('Error clearing application data', error, { context: 'settings-page' });
        toast({
          title: 'Error',
          description: 'Failed to clear application data. Please try again.',
          variant: 'destructive',
          duration: 3000
        });
      }
    }
  };
  
  // Export settings to JSON file
  const handleExportSettings = () => {
    try {
      const allSettings = {
        theme,
        debugMode,
        chatSettings,
        interfaceSettings,
        notificationSettings,
        activeTextModel,
        activeVoice,
        activeAgent
      };
      
      const dataStr = JSON.stringify(allSettings, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const exportFileDefaultName = `qanduai-settings-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast({
        title: 'Settings Exported',
        description: 'Your settings have been exported successfully.',
        duration: 3000
      });
    } catch (error) {
      logger.error('Error exporting settings', error, { context: 'settings-page' });
      toast({
        title: 'Export Failed',
        description: 'Failed to export settings. Please try again.',
        variant: 'destructive',
        duration: 3000
      });
    }
  };
  
  // Import settings from JSON file
  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string);
        
        // Apply settings
        if (settings.theme) setTheme(settings.theme);
        if (settings.debugMode !== undefined) handleDebugModeToggle(settings.debugMode);
        if (settings.chatSettings) setChatSettings(settings.chatSettings);
        if (settings.interfaceSettings) setInterfaceSettings(settings.interfaceSettings);
        if (settings.notificationSettings) setNotificationSettings(settings.notificationSettings);
        if (settings.activeTextModel) setActiveTextModel(settings.activeTextModel);
        if (settings.activeVoice) setActiveVoice(settings.activeVoice);
        if (settings.activeAgent) setActiveAgent(settings.activeAgent);
        
        toast({
          title: 'Settings Imported',
          description: 'Your settings have been imported successfully.',
          duration: 3000
        });
      } catch (error) {
        logger.error('Error importing settings', error, { context: 'settings-page' });
        toast({
          title: 'Import Failed',
          description: 'Failed to import settings. The file may be corrupted.',
          variant: 'destructive',
          duration: 3000
        });
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };
  
  if (!mounted) {
    return null;
  }
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="models">AI Models</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        
        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel of the application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={handleThemeChange}>
                  <SelectTrigger id="theme">
                    <SelectValue placeholder="Select a theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fontSize">Font Size ({interfaceSettings.fontSize}px)</Label>
                <Slider 
                  id="fontSize"
                  min={12} 
                  max={24} 
                  step={1}
                  value={[interfaceSettings.fontSize]} 
                  onValueChange={(value) => handleInterfaceSettingChange('fontSize', value[0])}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="showTimestamps">Show Message Timestamps</Label>
                <Switch 
                  id="showTimestamps" 
                  checked={interfaceSettings.showTimestamps}
                  onCheckedChange={(checked) => handleInterfaceSettingChange('showTimestamps', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="compactMode">Compact Mode</Label>
                <Switch 
                  id="compactMode" 
                  checked={interfaceSettings.compactMode}
                  onCheckedChange={(checked) => handleInterfaceSettingChange('compactMode', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="highContrast">High Contrast Mode</Label>
                <Switch 
                  id="highContrast" 
                  checked={interfaceSettings.highContrast}
                  onCheckedChange={(checked) => handleInterfaceSettingChange('highContrast', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Chat Settings */}
        <TabsContent value="chat">
          <Card>
            <CardHeader>
              <CardTitle>Chat Settings</CardTitle>
              <CardDescription>Configure your chat experience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoSave">Automatically Save Chats</Label>
                <Switch 
                  id="autoSave" 
                  checked={chatSettings.autoSave}
                  onCheckedChange={(checked) => handleChatSettingChange('autoSave', checked)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="messageHistory">Message History Limit ({chatSettings.messageHistory})</Label>
                <Slider 
                  id="messageHistory"
                  min={10} 
                  max={500} 
                  step={10}
                  value={[chatSettings.messageHistory]} 
                  onValueChange={(value) => handleChatSettingChange('messageHistory', value[0])}
                />
                <p className="text-sm text-muted-foreground">
                  Limit the number of messages to keep in history. Lower values may improve performance.
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="autoScroll">Automatically Scroll to New Messages</Label>
                <Switch 
                  id="autoScroll" 
                  checked={chatSettings.autoScroll}
                  onCheckedChange={(checked) => handleChatSettingChange('autoScroll', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="inlineImages">Show Images Inline</Label>
                <Switch 
                  id="inlineImages" 
                  checked={chatSettings.inlineImages}
                  onCheckedChange={(checked) => handleChatSettingChange('inlineImages', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* AI Models Settings */}
        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle>AI Models</CardTitle>
              <CardDescription>Configure which AI models to use.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="textModel">Text Generation Model</Label>
                <Select value={activeTextModel} onValueChange={setActiveTextModel}>
                  <SelectTrigger id="textModel">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_MODELS.TEXT.map(model => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="voiceModel">Voice</Label>
                <Select value={activeVoice} onValueChange={setActiveVoice}>
                  <SelectTrigger id="voiceModel">
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_MODELS.TEXT.find(m => m.id === 'openai-audio')?.voices?.map(voice => (
                      <SelectItem key={voice} value={voice}>
                        {voice.charAt(0).toUpperCase() + voice.slice(1)}
                      </SelectItem>
                    )) || 
                    ['nova', 'alloy', 'echo', 'fable', 'onyx', 'shimmer'].map(voice => (
                      <SelectItem key={voice} value={voice}>
                        {voice.charAt(0).toUpperCase() + voice.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="agent">Agent</Label>
                <Select value={activeAgent} onValueChange={setActiveAgent}>
                  <SelectTrigger id="agent">
                    <SelectValue placeholder="Select an agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map(agent => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Configure notification preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="enableNotifications">Enable Notifications</Label>
                <Switch 
                  id="enableNotifications" 
                  checked={notificationSettings.enableNotifications}
                  onCheckedChange={(checked) => handleNotificationSettingChange('enableNotifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="soundAlerts">Sound Alerts</Label>
                <Switch 
                  id="soundAlerts" 
                  checked={notificationSettings.soundAlerts}
                  onCheckedChange={(checked) => handleNotificationSettingChange('soundAlerts', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="desktopNotifications">Desktop Notifications</Label>
                <Switch 
                  id="desktopNotifications" 
                  checked={notificationSettings.desktopNotifications}
                  onCheckedChange={(checked) => handleNotificationSettingChange('desktopNotifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="mentionAlerts">Mention Alerts</Label>
                <Switch 
                  id="mentionAlerts" 
                  checked={notificationSettings.mentionAlerts}
                  onCheckedChange={(checked) => handleNotificationSettingChange('mentionAlerts', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Advanced Settings */}
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Configure advanced settings for developers and power users.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="debugMode">Debug Mode</Label>
                <Switch 
                  id="debugMode" 
                  checked={debugMode}
                  onCheckedChange={handleDebugModeToggle}
                />
              </div>
              
              <div className="pt-4 space-y-4">
                <h3 className="text-lg font-semibold">Data Management</h3>
                
                <div className="space-y-2">
                  <Button onClick={handleExportSettings} variant="outline">
                    Export Settings
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Export your settings as a JSON file.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('import-settings')?.click()}
                    >
                      Import Settings
                    </Button>
                    <input
                      type="file"
                      id="import-settings"
                      accept=".json"
                      className="hidden"
                      onChange={handleImportSettings}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Import settings from a JSON file.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Button onClick={handleClearAllData} variant="destructive">
                    Clear All Data
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Clear all application data, including settings, chat history, and saved prompts.
                    This action cannot be undone.
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