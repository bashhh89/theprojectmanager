import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface ScrapedData {
  title: string;
  description: string;
  aboutText: string;
  keyPhrases: string[];
  industryHints: string[];
  logoUrl?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    let validatedUrl: string;
    try {
      validatedUrl = new URL(url).toString();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    console.log(`Scraping website: ${validatedUrl}`);

    // Fetch the website content with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      // First try: Direct scraping
      try {
        const response = await fetch(validatedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId); // Clear the timeout if fetch completes

        if (!response.ok) {
          throw new Error(`Failed to fetch website: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Extract relevant data
        const scrapedData: ScrapedData = {
          title: $('title').text().trim(),
          description: $('meta[name="description"]').attr('content') || '',
          aboutText: '',
          keyPhrases: [],
          industryHints: [],
        };

        // Try to find the logo
        // Common selectors for logos
        const logoSelectors = [
          'header img[src*="logo"]',
          'nav img[src*="logo"]',
          '.logo img',
          '#logo img',
          'img.logo',
          'img#logo',
          'a.navbar-brand img',
          'a.brand img',
          '.header img',
          '.site-logo img',
          'img[alt*="logo"]',
          'img[alt*="Logo"]',
          // Fallback to first header image if nothing specific found
          'header img:first-of-type',
          'nav img:first-of-type'
        ];

        // Try to find the logo using common selectors
        for (const selector of logoSelectors) {
          const logoElement = $(selector);
          if (logoElement.length > 0) {
            let logoSrc = logoElement.attr('src');
            if (logoSrc) {
              // Handle relative URLs
              if (logoSrc.startsWith('/')) {
                const urlObj = new URL(validatedUrl);
                logoSrc = `${urlObj.origin}${logoSrc}`;
              } else if (!logoSrc.startsWith('http')) {
                const urlObj = new URL(validatedUrl);
                logoSrc = `${urlObj.origin}/${logoSrc}`;
              }
              scrapedData.logoUrl = logoSrc;
              break;
            }
          }
        }

        // If no logo found with selectors, try using link tags with rel="icon"
        if (!scrapedData.logoUrl) {
          const favicon = $('link[rel="icon"], link[rel="shortcut icon"]').attr('href');
          if (favicon) {
            let faviconUrl = favicon;
            // Handle relative URLs
            if (faviconUrl.startsWith('/')) {
              const urlObj = new URL(validatedUrl);
              faviconUrl = `${urlObj.origin}${faviconUrl}`;
            } else if (!faviconUrl.startsWith('http')) {
              const urlObj = new URL(validatedUrl);
              faviconUrl = `${urlObj.origin}/${faviconUrl}`;
            }
            scrapedData.logoUrl = faviconUrl;
          }
        }

        // Extract about text (common patterns for about sections)
        const aboutSelectors = [
          'section:contains("About")',
          'div:contains("About Us")',
          '#about',
          '.about',
          'section:contains("Who We Are")',
          'div:contains("Our Story")',
        ];

        for (const selector of aboutSelectors) {
          const element = $(selector);
          if (element.length > 0) {
            scrapedData.aboutText += element.text().trim() + ' ';
          }
        }

        // If no about section found, try to get content from the main sections
        if (!scrapedData.aboutText) {
          scrapedData.aboutText = $('main').text().trim() || $('body').text().trim();
          // Limit text length to avoid excessive content
          scrapedData.aboutText = scrapedData.aboutText.slice(0, 2000);
        }

        // Extract key phrases from headings
        $('h1, h2, h3').each((_, el) => {
          const text = $(el).text().trim();
          if (text && text.length > 3 && text.length < 100) {
            scrapedData.keyPhrases.push(text);
          }
        });

        // Extract potential industry hints from keywords, meta tags, classes, etc.
        const industries = [
          'technology', 'tech', 'software', 'IT', 'healthcare', 'health', 'medical', 'finance',
          'financial', 'banking', 'education', 'learning', 'retail', 'e-commerce', 'manufacturing',
          'construction', 'real estate', 'property', 'hospitality', 'restaurant', 'hotel', 
          'travel', 'tourism', 'energy', 'oil', 'gas', 'legal', 'law', 'consulting', 'media',
          'entertainment', 'automotive', 'transportation', 'logistics', 'agriculture', 'farming',
          'telecommunications', 'telecom', 'pharma', 'pharmaceutical', 'insurance'
        ];

        // Get keywords from meta tags
        const keywords = $('meta[name="keywords"]').attr('content') || '';
        
        // Combine all text to search for industry terms
        const allText = (
          scrapedData.title + ' ' + 
          scrapedData.description + ' ' + 
          scrapedData.aboutText + ' ' + 
          keywords
        ).toLowerCase();

        // Find industry hints in the content
        industries.forEach(industry => {
          if (allText.includes(industry.toLowerCase())) {
            scrapedData.industryHints.push(industry);
          }
        });

        // Remove duplicates
        scrapedData.keyPhrases = Array.from(new Set(scrapedData.keyPhrases));
        scrapedData.industryHints = Array.from(new Set(scrapedData.industryHints));

        // Limit the key phrases to the most relevant ones (first 10)
        scrapedData.keyPhrases = scrapedData.keyPhrases.slice(0, 10);

        console.log(`Successfully scraped website: ${validatedUrl}`);
        
        // Process the data with AI for better analysis
        let analysisResponse;
        try {
          analysisResponse = await analyzeScrapedData(scrapedData);
        } catch (analysisError) {
          console.error('Error during data analysis:', analysisError);
          // Provide fallback analysis with basic data
          analysisResponse = {
            industry: scrapedData.industryHints[0] || "Unknown",
            businessFocus: scrapedData.description || "Not detected",
            companySize: "Unknown",
            valuePropositions: scrapedData.keyPhrases.slice(0, 3),
            targetAudience: "General"
          };
        }

        return NextResponse.json({
          originalUrl: validatedUrl,
          scrapedData: scrapedData,
          analysis: analysisResponse
        });

      } catch (directFetchError) {
        // Second try: Use a CORS proxy if direct fetch fails
        console.log(`Direct fetch failed: ${directFetchError.message}. Trying with proxy...`);
        
        clearTimeout(timeoutId);
        
        // Reset the abort controller for a new fetch attempt
        const proxyController = new AbortController();
        const proxyTimeoutId = setTimeout(() => proxyController.abort(), 30000);
        
        try {
          // Try using a proxy service (allOrigins or similar)
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(validatedUrl)}`;
          const proxyResponse = await fetch(proxyUrl, {
            signal: proxyController.signal
          });
          
          clearTimeout(proxyTimeoutId);
          
          if (!proxyResponse.ok) {
            throw new Error(`Proxy fetch failed: ${proxyResponse.status}`);
          }
          
          const html = await proxyResponse.text();
          const $ = cheerio.load(html);
          
          // Extract basic data
          const scrapedData: ScrapedData = {
            title: $('title').text().trim(),
            description: $('meta[name="description"]').attr('content') || '',
            aboutText: $('body').text().trim().substring(0, 500),
            keyPhrases: [],
            industryHints: [],
          };
          
          // Try to find a logo
          const possibleLogoImg = $('img[src*="logo"]').first();
          if (possibleLogoImg.length) {
            let logoSrc = possibleLogoImg.attr('src');
            if (logoSrc) {
              // Fix relative URLs
              if (logoSrc.startsWith('/')) {
                const urlObj = new URL(validatedUrl);
                logoSrc = `${urlObj.origin}${logoSrc}`;
              } else if (!logoSrc.startsWith('http')) {
                const urlObj = new URL(validatedUrl);
                logoSrc = `${urlObj.origin}/${logoSrc}`;
              }
              scrapedData.logoUrl = logoSrc;
            }
          }
          
          // Extract some industry hints
          const pageText = $('body').text().toLowerCase();
          const industries = [
            'technology', 'tech', 'software', 'IT', 'healthcare', 'health', 'medical', 'finance',
            'financial', 'banking', 'education', 'learning', 'retail', 'e-commerce', 'manufacturing',
            'construction', 'real estate', 'property', 'hospitality', 'restaurant', 'hotel'
          ];
          
          industries.forEach(industry => {
            if (pageText.includes(industry.toLowerCase())) {
              scrapedData.industryHints.push(industry);
            }
          });
          
          // Process the data with AI for better analysis
          let analysisResponse;
          try {
            analysisResponse = await analyzeScrapedData(scrapedData);
          } catch (analysisError) {
            console.error('Error during data analysis:', analysisError);
            // Provide fallback analysis with basic data
            analysisResponse = {
              industry: scrapedData.industryHints[0] || "Unknown",
              businessFocus: scrapedData.description || "Not detected",
              companySize: "Unknown",
              valuePropositions: scrapedData.keyPhrases.slice(0, 3),
              targetAudience: "General"
            };
          }
          
          return NextResponse.json({
            originalUrl: validatedUrl,
            scrapedData: scrapedData,
            analysis: analysisResponse,
            note: "Limited data retrieved via proxy method"
          });
          
        } catch (proxyError) {
          console.error('Both direct and proxy fetch failed:', proxyError);
          throw new Error(`Website scraping failed: ${directFetchError.message}. Proxy attempt also failed: ${proxyError.message}`);
        }
      }
    } catch (error: any) {
      console.error('Error scraping website:', error);
      return NextResponse.json({ 
        error: 'Failed to scrape website', 
        details: error.message 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error scraping website:', error);
    return NextResponse.json({ 
      error: 'Failed to scrape website', 
      details: error.message 
    }, { status: 500 });
  }
}

async function analyzeScrapedData(data: ScrapedData) {
  const maxRetries = 2;
  let retries = 0;
  
  while (retries <= maxRetries) {
    try {
      // Construct a prompt for the AI
      const prompt = `
      Analyze this extracted website data and provide insights:
      
      Title: ${data.title}
      Description: ${data.description}
      About Text: ${data.aboutText.substring(0, 500)}... (truncated)
      Key Phrases: ${data.keyPhrases.join(', ')}
      Potential Industry: ${data.industryHints.join(', ')}
      
      Based on this data, determine:
      1. The most likely industry
      2. Company size/maturity hints
      3. Key value propositions
      4. Target audience
      5. Main business focus
      
      Format your response as a JSON object with these fields.
      `;

      // Call the Pollinations API for analysis with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for AI analysis
      
      try {
        const response = await fetch('https://text.pollinations.ai/openai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'openai',
            messages: [
              { 
                role: "system", 
                content: "You are an AI assistant specializing in business analysis. Analyze website data and extract business insights. Respond only with a valid JSON object with the requested fields." 
              },
              { role: "user", content: prompt }
            ]
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`AI analysis API error: ${response.status}`);
        }

        const result = await response.json();
        const analysisText = result?.choices?.[0]?.message?.content;

        if (!analysisText) {
          throw new Error('No analysis content received');
        }

        // Try to parse as JSON
        try {
          // Extract JSON if it's wrapped in backticks or has other text
          const jsonMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```/) || 
                          analysisText.match(/```\s*([\s\S]*?)\s*```/) ||
                          [null, analysisText];
          
          const jsonStr = jsonMatch[1] || analysisText;
          return JSON.parse(jsonStr);
        } catch (parseError) {
          console.warn('Could not parse AI response as JSON, returning raw text');
          // If we can't parse JSON, create a structured object with the raw text
          return {
            rawAnalysis: analysisText,
            industry: data.industryHints[0] || 'Unknown',
            businessFocus: data.description || 'Not detected'
          };
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          console.warn(`AI analysis request timed out (attempt ${retries + 1}/${maxRetries + 1})`);
        } else {
          console.error(`AI analysis fetch error (attempt ${retries + 1}/${maxRetries + 1}):`, fetchError);
        }
        
        // If this was our last retry, throw the error to be caught by outer try/catch
        if (retries === maxRetries) {
          throw fetchError;
        }
        
        // Otherwise, retry
        retries++;
        // Exponential backoff: wait 2^retries seconds before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
        continue;
      }
    } catch (error) {
      if (retries === maxRetries) {
        throw error;
      }
      retries++;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
    }
  }
  
  // This should never be reached given the error handling above, but TypeScript may complain
  throw new Error('Unexpected error in analyzeScrapedData');
} 