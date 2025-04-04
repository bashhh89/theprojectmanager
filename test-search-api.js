// Test our own search API

async function testSearchAPI() {
  try {
    console.log('Testing our Search API endpoint...');
    
    const response = await fetch('http://localhost:3003/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'artificial intelligence trends 2024',
        limit: 5
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    console.log('Our API returned results:', JSON.stringify(data, null, 2));
    console.log(`Found ${data.results?.length || 0} results`);
    
    return true;
  } catch (error) {
    console.error('Error testing our Search API:', error);
    return false;
  }
}

testSearchAPI().then(success => {
  console.log('API test completed:', success ? 'SUCCESS' : 'FAILED');
}); 