require('dotenv').config({ path: '.env.local' });

async function testSerperAPI() {
  try {
    console.log('Testing Serper.dev API with key:', process.env.SERPER_API_KEY);
    
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: 'artificial intelligence trends 2024'
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Search results received:', JSON.stringify(data, null, 2));
    console.log(`Found ${data.organic?.length || 0} organic results`);
    
    return true;
  } catch (error) {
    console.error('Error testing Serper API:', error);
    return false;
  }
}

testSerperAPI().then(success => {
  console.log('API test completed:', success ? 'SUCCESS' : 'FAILED');
}); 