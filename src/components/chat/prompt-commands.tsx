import { useState, useEffect } from 'react'
import { usePromptStore, SavedPrompt } from '@/lib/prompt-service'

export interface PromptCommandsProps {
  active: boolean
  onSelectPrompt: (command: string) => void
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
    <div className="absolute bottom-full left-0 w-full max-h-60 overflow-y-auto rounded-t-md bg-gray-800 border border-gray-700 shadow-lg z-10">
      <div className="p-2 border-b border-gray-700 text-gray-300 text-sm flex items-center">
        <span className="mr-2">Saved Prompts</span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search prompts..."
          className="px-2 py-1 text-xs bg-gray-700 rounded-md border-0 ring-0 focus:ring-1 focus:ring-blue-500 text-gray-200 flex-grow"
        />
      </div>
      {filteredPrompts.length > 0 ? (
        filteredPrompts.map((prompt) => (
          <div 
            key={prompt.id}
            className="p-2 hover:bg-gray-700 cursor-pointer flex items-center"
            onClick={() => onSelectPrompt(`/${prompt.command}`)}
          >
            <div className="bg-gray-700 rounded-md px-2 py-1 text-xs text-blue-400 mr-2">/{prompt.command}</div>
            <div className="text-gray-300 text-sm truncate flex-grow">{prompt.prompt}</div>
            {prompt.tags && prompt.tags.length > 0 && (
              <div className="flex space-x-1">
                {prompt.tags.map(tag => (
                  <span key={tag} className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="p-4 text-center text-gray-400">No prompts found</div>
      )}
      <div className="p-2 border-t border-gray-700 hover:bg-gray-700 cursor-pointer text-center">
        <span className="text-blue-400 text-sm">+ Add New Prompt</span>
      </div>
    </div>
  )
} 