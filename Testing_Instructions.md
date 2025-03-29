# Testing Instructions for Pollinations API Models

## Test Setup
1. The testing server is now running on port 3011
2. Our testing code has been updated to improve error handling:
   - Increased timeouts to 30 seconds
   - Better error classification (timeouts vs. connection errors)
   - Improved prompt adherence detection

## Available Test Pages

### Main Test Page (Four Models)
URL: http://localhost:3011/test-pollinations

This page tests four key models with your custom prompt:
- Llama 3.3
- Mistral
- DeepSeek
- OpenAI (as control - known to ignore prompts)

### Instructions:
1. Enter your system prompt in the "System Prompt" field
   - Default is the "grumpy robot" prompt that has worked well
   - You can try the pirate prompt: `You are a helpful pirate assistant. Always end every response with 'Arrr!' and speak like a pirate.`
   - Or try ALL CAPS prompt: `YOU MUST RESPOND ONLY IN UPPERCASE LETTERS.`

2. Enter a simple user message like "Who are you?"

3. Click "Run Test" for each model.

4. The results will show:
   - Color-coded status: 
     - 🟢 GREEN = Respects prompt
     - 🔴 RED = Ignores prompt
     - 🟡 YELLOW = Connection issue
   - Full response from both POST and GET methods
   - Analysis of whether the prompt was respected

### Test Results Documentation
We are documenting all test results in the `Pollinations_SystemPrompt_TestResults.md` file, which includes:
- Summary of which models respect system prompts
- Analysis of patterns in successful vs. unsuccessful tests
- Comprehensive list of all available models
- Raw logs of successful and failed tests

## Key Models to Test Further

If you'd like to test additional models beyond the main four, these are promising:
- `gemini-1.5-flash`
- `direct-gemini-pro`
- `deepseek-r1`
- `llamalight`
- `phi`

You can test these by manually constructing a URL:
http://localhost:3011/api/test-model?model=MODEL_ID&prompt=Who%20are%20you%3F&systemPrompt=SYSTEM_PROMPT

## Troubleshooting Common Issues

1. **Timeouts:** If you see many timeouts, this is often due to Pollinations API being busy, not necessarily that the model doesn't work.

2. **HTTP 500/502 errors:** This indicates a server-side issue with Pollinations, not a problem with the model itself.

3. **Invalid/empty responses:** Sometimes the API returns invalid JSON or empty responses. These are logged as failures but are actually connection issues.

4. **Port conflicts:** If the server won't start, use any of the other ports defined in package.json (3005, 3007, 3009). 