// Add this function to display the model info
function ModelIndicator({ modelUsed }: { modelUsed?: string }) {
  if (!modelUsed) return null;
  
  return (
    <div className="text-xs text-muted-foreground mt-1 flex items-center">
      <span className="inline-block w-2 h-2 rounded-full mr-1" 
            style={{ 
              backgroundColor: modelUsed.includes('Google') ? '#4285F4' : 
                              modelUsed.includes('Pollinations') ? '#FF5733' : '#888' 
            }} 
      />
      <span>{modelUsed}</span>
    </div>
  );
}

function MessageList() {
  return (
    <div className="flex-1 space-y-6 overflow-y-auto py-6 px-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex ${
            message.role === "assistant" ? "justify-start" : "justify-end"
          }`}
        >
          <div
            className={`max-w-[80%] rounded-lg p-4 ${
              message.role === "assistant"
                ? "bg-muted text-muted-foreground"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {Array.isArray(message.content) ? (
              <div className="space-y-4">
                {message.content.map((item, i) => {
                  if (item.type === "text") {
                    return <p key={i} className="whitespace-pre-wrap">{item.content}</p>;
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
                      </div>
                    );
                  } else if (item.type === "audio") {
                    return (
                      <div key={i} className="mt-2">
                        <audio controls src={item.content} className="w-full" />
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            ) : (
              <p className="whitespace-pre-wrap">{message.content}</p>
            )}
            
            {/* Add model indicator for assistant messages */}
            {message.role === "assistant" && <ModelIndicator modelUsed={message.modelUsed} />}
          </div>
        </div>
      ))}
    </div>
  );
} 