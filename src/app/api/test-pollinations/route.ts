import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const prompt = searchParams.get('prompt');
    const model = searchParams.get('model');
    const systemPrompt = searchParams.get('systemPrompt');

    // Validate parameters
    if (!prompt || !model) {
      return NextResponse.json(
        { error: 'Missing required parameters: prompt or model' },
        { status: 400 }
      );
    }

    // Log request details
    console.log(`Test-Pollinations API Route - Testing with model: ${model}`);
    console.log(`Test-Pollinations API Route - Prompt: ${prompt}`);
    console.log(`Test-Pollinations API Route - System prompt: ${systemPrompt}`);

    // Test 1: Standard OpenAI format using the POST endpoint
    const postRequest = async () => {
      console.log(`Test-Pollinations API Route - Testing POST endpoint with model: ${model}`);
      
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
      
      console.log('Test-Pollinations API Route - POST request payload:', JSON.stringify(requestBody));
      
      // Make the POST request to Pollinations
      const response = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP error from POST endpoint! Status: ${response.status}`);
      }
      
      // Parse response
      let responseData;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
        console.log('Test-Pollinations API Route - POST response (JSON):', JSON.stringify(responseData));
        return responseData.text || JSON.stringify(responseData);
      } else {
        const text = await response.text();
        console.log('Test-Pollinations API Route - POST response (text):', text);
        return text;
      }
    };
    
    // Test 2: GET endpoint with system parameter
    const getRequest = async () => {
      console.log(`Test-Pollinations API Route - Testing GET endpoint with model: ${model}`);
      
      // Construct URL for GET endpoint
      const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=${encodeURIComponent(model)}&system=${encodeURIComponent(systemPrompt || '')}`;
      
      console.log(`Test-Pollinations API Route - GET URL: ${url}`);
      
      // Make the GET request to Pollinations
      const response = await fetch(url);
      
      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP error from GET endpoint! Status: ${response.status}`);
      }
      
      // Get response text
      const text = await response.text();
      console.log('Test-Pollinations API Route - GET response:', text);
      
      return text;
    };
    
    // Try both methods and return the results
    try {
      // Try POST request first (preferred method for system prompts)
      const postResult = await postRequest();
      
      try {
        // Also try GET request for comparison
        const getResult = await getRequest();
        
        // Return both results
        return NextResponse.json({
          post: postResult,
          get: getResult,
          conclusion: 'Both methods tested successfully. Check logs for details.'
        });
      } catch (getError) {
        console.error('Test-Pollinations API Route - GET request failed:', getError);
        
        // If GET fails, still return POST result
        return NextResponse.json({
          post: postResult,
          get: `Error: ${getError instanceof Error ? getError.message : 'Unknown error'}`,
          conclusion: 'POST request succeeded but GET request failed. Check logs for details.'
        });
      }
    } catch (postError) {
      console.error('Test-Pollinations API Route - POST request failed:', postError);
      
      try {
        // If POST fails, try GET
        const getResult = await getRequest();
        
        return NextResponse.json({
          post: `Error: ${postError instanceof Error ? postError.message : 'Unknown error'}`,
          get: getResult,
          conclusion: 'POST request failed but GET request succeeded. Check logs for details.'
        });
      } catch (getError) {
        console.error('Test-Pollinations API Route - Both requests failed:', getError);
        
        // Both methods failed
        return NextResponse.json(
          {
            error: 'Both POST and GET requests failed',
            postError: postError instanceof Error ? postError.message : 'Unknown error',
            getError: getError instanceof Error ? getError.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Test-Pollinations API Route - Unexpected error:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 