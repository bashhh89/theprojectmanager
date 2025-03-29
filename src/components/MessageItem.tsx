import React from 'react';
import Image from 'next/image';

type ContentItem = {
  type: string;
  content: string;
};

type ModelIndicatorProps = {
  modelUsed?: string;
};

type MessageItemProps = {
  role: 'user' | 'assistant';
  content: ContentItem[] | string;
  modelUsed?: string;
};

// A small component to show which model was used
const ModelIndicator: React.FC<ModelIndicatorProps> = ({ modelUsed }) => {
  if (!modelUsed) return null;
  
  // Extract model name for display
  const modelName = modelUsed.includes(" ") 
    ? modelUsed.split(" ")[1] 
    : modelUsed;
  
  return (
    <div className="mt-2 text-xs text-muted-foreground/70 flex items-center">
      <div 
        className="w-2 h-2 rounded-full mr-1.5"
        style={{ 
          backgroundColor: modelUsed.toLowerCase().includes('google') || modelUsed.toLowerCase().includes('gemini') 
            ? '#4285F4' 
            : modelUsed.toLowerCase().includes('llama') 
              ? '#19C37D' 
              : '#A259FF'
        }}
      />
      <span>{modelName}</span>
    </div>
  );
};

// A component to parse and render text content properly
const TextContent: React.FC<{ content: string }> = ({ content }) => {
  // Parse JSON if content appears to be JSON
  const processedContent = React.useMemo(() => {
    // Check if content might be JSON
    if (typeof content === 'string' && 
        (content.startsWith('[{') || content.startsWith('{"')) &&
        (content.includes('"type":"text"') || content.includes('"content":'))) {
      try {
        const parsed = JSON.parse(content);
        
        // Handle array format
        if (Array.isArray(parsed)) {
          const textItems = parsed.filter(item => 
            item.type === "text" && typeof item.content === "string"
          );
          
          if (textItems.length > 0) {
            return textItems.map(item => item.content).join("\n");
          }
        } 
        // Handle object format with content property
        else if (parsed.content && typeof parsed.content === "string") {
          return parsed.content;
        }
      } catch (e) {
        // If parsing fails, use the original content
        console.log("Failed to parse potentially JSON content");
      }
    }
    
    return content;
  }, [content]);

  return <p className="whitespace-pre-wrap">{processedContent}</p>;
};

const MessageItem: React.FC<MessageItemProps> = ({ role, content, modelUsed }) => {
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg p-4 ${
          role === "assistant"
            ? "bg-muted text-foreground"
            : "bg-primary text-primary-foreground"
        }`}
      >
        {Array.isArray(content) ? (
          <div className="space-y-4">
            {content.map((item, i) => {
              if (item.type === "text") {
                return <TextContent key={i} content={item.content} />;
              } else if (item.type === "image") {
                return (
                  <div key={i} className="mt-2">
                    <Image 
                      src={item.content} 
                      alt="Generated image" 
                      width={400} 
                      height={400} 
                      className="rounded-md"
                    />
                    <div className="mt-1 text-xs text-muted-foreground">Generated Image</div>
                  </div>
                );
              } else if (item.type === "audio") {
                return (
                  <div key={i} className="mt-2">
                    <audio controls src={item.content} className="w-full" />
                    <div className="mt-1 text-xs text-muted-foreground">Audio Message</div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        ) : (
          <TextContent content={content as string} />
        )}
        
        {role === "assistant" && <ModelIndicator modelUsed={modelUsed} />}
      </div>
    </div>
  );
};

export default MessageItem; 