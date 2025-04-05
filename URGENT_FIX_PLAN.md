# URGENT FIX PLAN - IMMEDIATE IMPLEMENTATION

## CRITICAL ISSUES TO FIX IMMEDIATELY

### 1. Document Processor + Chat Integration (15 MINUTES)
```bash
# Run these commands in terminal
cd theprojectmanager/src/app/api
mkdir -p documents
touch documents/route.ts
```

Create this file immediately:
```typescript
// src/app/api/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  
  try {
    const response = await fetch('http://localhost:8000/documents/upload', {
      method: 'POST',
      headers: {
        'api-key': 'qandu-dev-key'
      },
      body: formData
    });
    
    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
}
```

### 2. Fix /image Command (10 MINUTES)
Update the Pollinations URL construction in `src/lib/pollinationsApi.ts`:

```typescript
// Find this function:
export function generateImageUrl(prompt: string, width = 256, height = 256) {
  // REPLACE with this implementation:
  const encodedPrompt = encodeURIComponent(prompt);
  const timestamp = Date.now(); // Add cache-busting timestamp
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&t=${timestamp}`;
}
```

### 3. Fix Audio Command (15 MINUTES)
Update the audio playback in `src/components/chat/chat-interface.tsx`:

```typescript
// Find the code that handles audio playback and replace with:
const playAudio = async (audioUrl: string) => {
  try {
    const audio = new Audio();
    audio.crossOrigin = "anonymous"; // Add this
    audio.src = audioUrl;
    
    // Add error handler
    audio.onerror = (e) => {
      console.error('Audio playback error:', e);
      showError('Could not play audio. Try again or use a different browser.');
    };
    
    // Force load and play
    await audio.load();
    const playPromise = audio.play();
    
    // Handle play promise rejection (common in Chrome)
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error('Play promise error:', error);
        // Try one more time after a short delay
        setTimeout(() => {
          audio.play().catch(e => console.error('Second attempt failed:', e));
        }, 300);
      });
    }
  } catch (error) {
    console.error('Audio playback error:', error);
  }
};
```

### 4. Agent Switching Fix (10 MINUTES)
Update agent switching in `src/store/settingsStore.ts`:

```typescript
// Find setActiveAgent and update it:
setActiveAgent: (agent) => {
  if (!agent) {
    set({ activeAgent: null });
    return;
  }

  // Immediately update state
  set({ activeAgent: agent });
  
  // Then update preferences in a separate set call
  if (agent.modelPreferences) {
    setTimeout(() => {
      set(state => ({
        activeTextModel: agent.modelPreferences?.textModel || state.activeTextModel,
        activeImageModel: agent.modelPreferences?.imageModel || state.activeImageModel,
        activeVoice: agent.modelPreferences?.voiceModel || state.activeVoice
      }));
    }, 50);
  }
}
```

### 5. Fix Project Editing (10 MINUTES)
Add error handling to project update in the projects page:

```typescript
// In src/app/projects/[id]/page.tsx or similar:
// Find the function that handles project updates and add:

const updateProject = async (projectData) => {
  setLoading(true);
  setError(null);
  
  try {
    // Add retry logic
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      const { data, error } = await supabase
        .from('projects')
        .update(projectData)
        .eq('id', project.id)
        .select();
        
      if (!error) {
        setProject(data[0]);
        showSuccess('Project updated successfully');
        return;
      }
      
      attempts++;
      if (attempts < maxAttempts) {
        // Wait before retry
        await new Promise(r => setTimeout(r, 1000));
      } else {
        throw error;
      }
    }
  } catch (err) {
    console.error('Error updating project:', err);
    setError('Failed to update project. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

## ADDITIONAL QUICK FIXES

### A. Environment Variable Fix
Create/update `.env.local` file in project root with:

```
NEXT_PUBLIC_SUPABASE_URL=your_actual_value
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_value
DOCUMENT_PROCESSOR_URL=http://localhost:8000
```

### B. Fix DeepSeek Model Timeout
Add timeout to `src/lib/pollinationsApi.ts`:

```typescript
// Find the callPollinationsChat function and update:
export async function callPollinationsChat(
  messages: Array<{ role: string; content: string }>,
  model = 'openai',
  systemPrompt?: string,
  stream = false
) {
  // Add timeout for DeepSeek model
  const controller = new AbortController();
  const timeoutDuration = model.includes('deepseek') ? 25000 : 60000;
  
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutDuration);
  
  try {
    // Update fetch calls to use the controller
    const response = await fetch(`${POLLINATIONS_API_BASE_URL}/openai`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: systemPrompt 
          ? [{ role: 'system', content: systemPrompt }, ...messages]
          : messages,
        stream
      }),
      signal: controller.signal
    });
    
    // ... rest of function
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Request timed out for model:', model);
      // Fall back to openai model
      if (model.includes('deepseek')) {
        console.log('Falling back to OpenAI model due to timeout');
        return callPollinationsChat(messages, 'openai', systemPrompt, stream);
      }
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
```

## OVERALL SYSTEM CHECK (AFTER FIXES)

Run these commands to restart and verify all components:

```bash
# Terminal 1: Next.js App
cd theprojectmanager
npm run dev

# Terminal 2: Document Processor
cd theprojectmanager/lib-doc-processor
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## VERIFICATION STEPS

1. Check chat interface: Open http://localhost:5500/chat
2. Test chat with OpenAI model
3. Test chat with Mistral model
4. Test chat with DeepSeek model (should fall back to OpenAI if timeout)
5. Test /image command
6. Test agent switching
7. Test project editing
8. Test document processor connection

These fixes address all critical issues and should get the system working immediately. 