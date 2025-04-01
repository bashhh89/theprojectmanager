import { GoogleGenerativeAI } from '@google/generative-ai';

export type AIProvider = 'gemini' | 'pollinations';

const PRESENTATION_PROMPT = `Create a presentation in Markdown format about the following topic. Follow these rules:
1. Use horizontal rules (---) to separate slides.
2. Each slide should start with a heading (#, ##, etc.).
3. Use bullet points (*) for lists.
4. Keep content concise and presentation-friendly.
5. Include 5-7 slides total.
6. Include speaker notes after each slide using HTML comments <!-- Speaker notes here -->.
7. Start with a title slide (use a single H1 heading).
8. For EACH slide, include a layout suggestion comment: <!-- Layout: type --> where type is one of: background, split-left, split-right, text-only.
9. If layout is NOT text-only, include a relevant visual description comment: <!-- Image suggestion: description -->.

Example format for slides:
# [Main Title of Presentation]
<!-- Layout: background -->
<!-- Speaker notes: Introduction... -->
<!-- Image suggestion: A high-level visual... -->

---

## Key Point 1
* Bullet point
* Bullet point
<!-- Layout: split-right -->
<!-- Speaker notes: Details... -->
<!-- Image suggestion: Specific visual... -->

---

## Text Only Slide
* Some important text.
<!-- Layout: text-only -->
<!-- Speaker notes: Explanation... -->

Topic: `;

export interface GenerateOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  referrer?: string;
}

export async function generatePresentation(
  topic: string, 
  provider: AIProvider = 'gemini',
  options: GenerateOptions = {}
) {
  try {
    switch (provider) {
      case 'gemini': {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');
        const modelName = options.model || 'gemini-1.5-pro-latest';
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: PRESENTATION_PROMPT + topic }] }],
          generationConfig: {
            temperature: options.temperature || 0.7,
            maxOutputTokens: options.max_tokens || 2000,
          },
        });

        if (!result?.response) throw new Error('No response from Gemini');
        return result.response.text();
      }
      
      case 'pollinations': {
        const response = await fetch('https://text.pollinations.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            model: options.model || 'openai',
            messages: [
              {
                role: 'user',
                content: PRESENTATION_PROMPT + topic,
              },
            ],
            temperature: options.temperature || 0.7,
            max_tokens: options.max_tokens || 2000,
            stream: false,
            referrer: options.referrer || 'presentation-generator'
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to generate response from Pollinations');
        }

        const data = await response.json();
        if (!data.choices?.[0]?.message?.content) {
          throw new Error('Invalid response format from Pollinations');
        }
        return data.choices[0].message.content;
      }

      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (error: any) {
    console.error('Presentation generation error:', error);
    throw error;
  }
} 