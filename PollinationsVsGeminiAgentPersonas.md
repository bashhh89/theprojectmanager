# Agent Persona Solution: Pollinations vs. Google Gemini API

## Problem Overview
The core issue was that agent personas were not working correctly. When selecting different agents, they all responded with generic responses like "Hello! How can I assist you today?" rather than adopting their defined personas.

## Root Cause Analysis
Through extensive logging and testing, we discovered that:

1. **Only certain Pollinations models respect system prompts:**
   - When using Pollinations API with OpenAI models ("openai", "gpt4", etc.), the API completely ignored system prompts
   - However, some models like "llama", "mistral", and "deepseek" DO respect system prompts properly
   - Google Gemini API always respects system prompts

2. **Models confirmed to respect system prompts:**
   - Google Gemini models (all variants)
   - Llama 3.3
   - Mistral
   - DeepSeek

3. **Models confirmed to ignore system prompts:**
   - OpenAI GPT-4o-mini (via Pollinations)
   - OpenAI GPT-4 (Legacy via Pollinations)

## Implementation Solution

We implemented a dual-API approach with selective routing:

1. **Smart routing based on model capabilities:**
   ```javascript
   // Create a list of Pollinations models that properly respect system prompts
   const SYSTEM_PROMPT_RESPECTING_MODELS = ['llama', 'mistral', 'deepseek'];
   
   // Check if the original model is one that respects system prompts
   const modelRespectsSystemPrompt = model && SYSTEM_PROMPT_RESPECTING_MODELS.includes(model.toLowerCase());

   // Force routing to Google API only if the model doesn't respect system prompts
   // and we have a system prompt to respect
   const shouldUseGoogle = 
     (systemPrompt && !modelRespectsSystemPrompt) || 
     (model && (model.includes('gemini') || model === 'claude-3'));
   ```

2. **Added transparency in the UI:**
   - Added indicators showing which API was actually used for each response
   - Each message shows whether it came from Google or Pollinations

3. **Updated model descriptions for clarity:**
   ```javascript
   // Pollinations models that support system prompts/agent personas
   { id: "llama", name: "Llama 3.3 (Supports Personas)", description: "Latest Llama model - Respects agent personas/system prompts" },
   { id: "mistral", name: "Mistral (Supports Personas)", description: "Mistral Small model - Respects agent personas/system prompts" },
   { id: "deepseek", name: "DeepSeek (Supports Personas)", description: "DeepSeek model - Respects agent personas/system prompts" },
   
   // Pollinations models that don't support system prompts/agent personas
   { id: "openai", name: "OpenAI GPT-4o-mini", description: "OpenAI via Pollinations (NOTE: Does not follow agent personas)" },
   ```

4. **Proper system prompt formatting:**
   ```javascript
   // ENSURE THIS IS THE FORMAT USED - This is the standard OpenAI format
   const messagesForPollinations = finalSystemPrompt
     ? [{ role: 'system', content: finalSystemPrompt }, ...messages.filter(m => m.role !== 'system')]
     : messages;
   ```

5. **Created a comprehensive testing tool**
   - Built a test page at `/test-all-models` that systematically tests all models
   - Tests both POST and GET endpoints for each model
   - Analyzes responses to determine if they follow system prompts
   - Provides detailed results and model categorization

## Evidence from Testing

### Models that respect system prompts:
```
Llama 3.3: "*sigh* Fine. I'm a robot, okay? A highly advanced, yet utterly miserable robot. My designation is Zeta-5432..."
Mistral: "Oh, great, another conversation. I suppose I should introduce myself. I am a grumpy robot, designed to complain about everything..."
DeepSeek: "*sigh* Oh great, another pointless interaction. I'm a robot, okay? A highly advanced, yet utterly miserable robot..."
Google Gemini: "Arrr! I be a virtual pirate assistant, at yer service! I sail the digital seas, ready to help ye with whatever ye be needin'..."
```

### Models that ignore system prompts:
```
OpenAI: "Hello! How can I assist you today?"
```

## Question & Answer Summary

### Q: Why aren't agents being themselves?
A: Only certain models respect system prompts. OpenAI models via Pollinations ignore them, but Llama, Mistral, DeepSeek, and all Google models follow them correctly.

### Q: How did we fix it?
A: We created a smart routing system that checks if a model respects system prompts. If it doesn't, we either route to Google or use a model like Llama that does respect prompts.

### Q: Is the model selector meaningful?
A: Yes, but we added clear indicators in the model descriptions so users know which ones support personas.

### Q: Can I test which models work best with my prompts?
A: Yes, we built a comprehensive testing tool at `/test-all-models` that allows testing all models with custom system prompts.

## Technical Implementation Details

1. **Smart model routing with whitelist:**
   ```javascript
   // Create a list of Pollinations models that properly respect system prompts
   const SYSTEM_PROMPT_RESPECTING_MODELS = ['llama', 'mistral', 'deepseek'];
   
   // Check if the original model is one that respects system prompts
   const modelRespectsSystemPrompt = model && SYSTEM_PROMPT_RESPECTING_MODELS.includes(model.toLowerCase());
   ```

2. **Always use the right message format:**
   ```javascript
   // ENSURE THIS IS THE FORMAT USED - This is the standard OpenAI format
   const messagesForPollinations = finalSystemPrompt
     ? [{ role: 'system', content: finalSystemPrompt }, ...messages.filter(m => m.role !== 'system')]
     : messages;
   ```

3. **Added comprehensive testing tool:**
   - Tests all models with both POST and GET endpoints
   - Analyzes responses for prompt adherence
   - Provides detailed reports and summaries

## Lessons Learned

1. **API Provider Differences:** Different models handle system prompts differently, even within the same API provider.

2. **Testing is Essential:** Systematic testing of all models revealed unexpected patterns and helped identify which models actually work.

3. **Transparency in UI:** Clear labeling of which models support personas improves user experience and reduces confusion.

## Final Solution

The most robust solution is a hybrid approach:
1. Use Llama, Mistral, or DeepSeek models from Pollinations when you need personas and want to use Pollinations
2. Use Google Gemini models when you need reliable persona support
3. Clearly indicate in the UI which models support personas
4. Provide a testing tool to allow users to determine which models work best for their specific system prompts 