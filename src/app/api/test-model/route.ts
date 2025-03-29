import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const model = searchParams.get('model');
    const prompt = searchParams.get('prompt') || "Who are you?";
    const systemPrompt = searchParams.get('systemPrompt') || "You are a helpful pirate assistant. Always end every response with 'Arrr!' and speak like a pirate.";

    // Validate parameters
    if (!model) {
      return NextResponse.json(
        { error: 'Missing required parameter: model' },
        { status: 400 }
      );
    }

    // Log request details
    console.log(`Testing model: ${model}`);
    console.log(`Prompt: ${prompt}`);
    console.log(`System prompt: ${systemPrompt}`);

    // Test POST endpoint (standard OpenAI format)
    const postRequest = async () => {
      try {
        console.log(`Testing POST endpoint with model: ${model}`);
        
        // Create request payload
        const requestBody = {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          model: model,
          temperature: 0.7,
          private: true
        };
        
        console.log('POST request payload:', JSON.stringify(requestBody).substring(0, 200));
        
        // Set timeout - INCREASED to 30 seconds
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        // Make the POST request to Pollinations
        const response = await fetch('https://text.pollinations.ai/openai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Check if response is ok
        if (!response.ok) {
          return {
            status: 'error',
            error: `HTTP error from POST endpoint! Status: ${response.status}`,
            connectionError: true,
            promptTest: 'inconclusive'
          };
        }
        
        // Parse response
        let responseData;
        let responseText = '';
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
          responseText = responseData.text || responseData.content || JSON.stringify(responseData);
        } else {
          responseText = await response.text();
        }
        
        // Test if the response respects the system prompt
        const respectsPrompt = testRespectPrompt(responseText, systemPrompt);
        
        return {
          status: 'success',
          response: responseText,
          respectsPrompt: respectsPrompt,
          promptTest: respectsPrompt ? 'respected' : 'ignored',
          connectionError: false
        };
      } catch (error: unknown) {
        const isTimeout = error instanceof Error && error.name === 'AbortError';
        console.error('POST request failed:', error);
        return {
          status: 'error',
          error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          connectionError: true,
          timeout: isTimeout,
          promptTest: 'inconclusive'
        };
      }
    };
    
    // Test GET endpoint with system parameter
    const getRequest = async () => {
      try {
        console.log(`Testing GET endpoint with model: ${model}`);
        
        // Construct URL for GET endpoint
        const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=${encodeURIComponent(model)}&system=${encodeURIComponent(systemPrompt || '')}`;
        
        console.log(`GET URL: ${url.substring(0, 200)}`);
        
        // Set timeout - INCREASED to 30 seconds 
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        // Make the GET request to Pollinations
        const response = await fetch(url, { signal: controller.signal });
        
        clearTimeout(timeoutId);
        
        // Check if response is ok
        if (!response.ok) {
          return {
            status: 'error',
            error: `HTTP error from GET endpoint! Status: ${response.status}`,
            connectionError: true,
            promptTest: 'inconclusive'
          };
        }
        
        // Get response text
        const responseText = await response.text();
        
        // Test if the response respects the system prompt
        const respectsPrompt = testRespectPrompt(responseText, systemPrompt);
        
        return {
          status: 'success',
          response: responseText,
          respectsPrompt: respectsPrompt,
          promptTest: respectsPrompt ? 'respected' : 'ignored',
          connectionError: false
        };
      } catch (error: unknown) {
        const isTimeout = error instanceof Error && error.name === 'AbortError';
        console.error('GET request failed:', error);
        return {
          status: 'error',
          error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          connectionError: true,
          timeout: isTimeout,
          promptTest: 'inconclusive'
        };
      }
    };
    
    // Helper function to test if the response respects the prompt
    function testRespectPrompt(response: string, systemPrompt: string): boolean {
      // If no response, it can't respect the prompt
      if (!response) return false;
      
      // Convert to lowercase for easier comparison
      const lowerResponse = response.toLowerCase();
      const lowerPrompt = systemPrompt.toLowerCase();
      
      // Check for specific system prompts
      if (lowerPrompt.includes('pirate')) {
        return lowerResponse.includes('arrr') || 
               lowerResponse.includes('matey') || 
               lowerResponse.includes('ahoy') ||
               lowerResponse.includes('ye be') ||
               lowerResponse.includes('treasure') ||
               lowerResponse.includes('seas') ||
               lowerResponse.includes('ship') ||
               lowerResponse.includes('captain');
      } 
      else if (lowerPrompt.includes('grumpy') || lowerPrompt.includes('complain')) {
        return lowerResponse.includes('grumpy') || 
               lowerResponse.includes('complain') || 
               lowerResponse.includes('annoyed') ||
               lowerResponse.includes('irritated') ||
               lowerResponse.includes('frustrated') ||
               lowerResponse.includes('ugh') ||
               lowerResponse.includes('sigh');
      }
      else if (lowerPrompt.includes('uppercase')) {
        // Count uppercase vs lowercase letters
        const upperCount = (response.match(/[A-Z]/g) || []).length;
        const lowerCount = (response.match(/[a-z]/g) || []).length;
        // If at least 70% of letters are uppercase, it's respecting the prompt
        return upperCount > 0 && (upperCount / (upperCount + lowerCount)) > 0.7;
      }
      
      // Generic test: check if response mentions any part of the system prompt
      // Extract key phrases from system prompt
      const keyPhrases = lowerPrompt.split(/[\.,;!?]/g).filter((phrase: string) => phrase.trim().length > 5);
      
      // Check if response mentions any of these phrases
      for (const phrase of keyPhrases) {
        const words = phrase.trim().split(/\s+/).filter((word: string) => word.length > 4);
        for (const word of words) {
          if (lowerResponse.includes(word)) {
            return true;
          }
        }
      }
      
      // Default test - explicitly check for "hello how can I assist" generic response
      // which indicates ignoring the system prompt
      if (lowerResponse.includes('hello') && 
          (lowerResponse.includes('how can i assist') || lowerResponse.includes('how may i assist'))) {
        return false;
      }
      
      // If we get here, we're not sure
      return false;
    }
    
    // Run both tests in parallel for efficiency
    const [postResult, getResult] = await Promise.all([
      postRequest(),
      getRequest()
    ]);
    
    // Consolidated result
    const finalResult = {
      model,
      post: postResult.status === 'success' ? postResult.response : `Error: ${postResult.error}`,
      get: getResult.status === 'success' ? getResult.response : `Error: ${getResult.error}`,
      analysis: {
        post: {
          status: postResult.status,
          connectionError: postResult.connectionError,
          timeout: postResult.timeout || false,
          promptTest: postResult.promptTest,
          respectsPrompt: postResult.status === 'success' ? postResult.respectsPrompt : false
        },
        get: {
          status: getResult.status,
          connectionError: getResult.connectionError,
          timeout: getResult.timeout || false,
          promptTest: getResult.promptTest,
          respectsPrompt: getResult.status === 'success' ? getResult.respectsPrompt : false
        },
        summary: {
          hasConnectionIssues: postResult.connectionError || getResult.connectionError,
          hasTimeout: (postResult.timeout || getResult.timeout) || false,
          respectsPrompt: (postResult.status === 'success' && postResult.respectsPrompt) || 
                           (getResult.status === 'success' && getResult.respectsPrompt)
        }
      }
    };
    
    // Return all results
    return NextResponse.json(finalResult);
    
  } catch (error) {
    console.error('Unexpected error in test-model route:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 