import { useState, useEffect } from 'react'
import { usePromptStore, SavedPrompt } from '@/lib/prompt-service'

export interface PromptCommandsProps {
  active: boolean
  onSelectPrompt: (command: string | SavedPrompt) => void
}

export function PromptCommands({ active, onSelectPrompt }: PromptCommandsProps) {
  // Use the prompt store instead of local state
  const savedPrompts = usePromptStore(state => state.prompts)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredPrompts, setFilteredPrompts] = useState<SavedPrompt[]>(savedPrompts)

  useEffect(() => {
    if (searchTerm) {
      setFilteredPrompts(
        savedPrompts.filter(prompt => 
          prompt.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prompt.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prompt.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      )
    } else {
      setFilteredPrompts(savedPrompts)
    }
  }, [searchTerm, savedPrompts])

  if (!active) return null

  return (
    <div className="absolute bottom-full left-0 right-0 w-full max-h-[300px] overflow-y-auto rounded-md bg-background border border-border shadow-lg z-10 mb-2">
      <div className="sticky top-0 p-2 border-b border-border bg-background/95 backdrop-blur-sm flex items-center">
        <svg className="w-4 h-4 text-muted-foreground mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search prompts..."
          className="bg-transparent text-sm px-2 py-1 border-0 outline-none flex-1 placeholder-muted-foreground/70"
          autoFocus
        />
      </div>
      
      {filteredPrompts.length > 0 ? (
        <div className="py-1">
          {filteredPrompts.map((prompt) => (
            <div 
              key={prompt.id}
              className="px-3 py-2 hover:bg-muted transition-colors cursor-pointer flex items-center gap-2"
              onClick={() => onSelectPrompt(prompt)}
            >
              <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path>
              </svg>
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <div className="font-medium text-sm mr-2">/{prompt.command}</div>
                  {prompt.tags && prompt.tags.length > 0 && (
                    <div className="flex items-center gap-1 overflow-hidden">
                      {prompt.tags.slice(0, 2).map(tag => (
                        <div key={tag} className="flex items-center text-xs px-1.5 rounded bg-primary/10 text-primary whitespace-nowrap">
                          <svg className="w-3 h-3 mr-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 9h16"></path>
                            <path d="M4 15h16"></path>
                            <path d="M10 3 8 21"></path>
                            <path d="m16 3-2 18"></path>
                          </svg>
                          {tag}
                        </div>
                      ))}
                      {prompt.tags.length > 2 && (
                        <span className="text-xs text-muted-foreground">+{prompt.tags.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-sm text-muted-foreground truncate">{prompt.prompt}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 text-center text-muted-foreground">
          No prompts found
        </div>
      )}
      
      <div className="p-2 border-t border-border sticky bottom-0 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-center hover:bg-muted/50 py-1.5 rounded-md cursor-pointer transition-colors">
          <svg className="w-4 h-4 text-primary mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          <span className="text-sm text-primary">Create a new prompt</span>
        </div>
      </div>
    </div>
  )
} 