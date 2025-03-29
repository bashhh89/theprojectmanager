"use client"

export default function Navigation() {
  return (
    <nav className="border-b border-gray-200 dark:border-gray-800 py-3 px-4 bg-background">
      <div className="container mx-auto flex justify-between items-center">
        <a href="/" className="font-semibold text-primary">Agent Builder</a>
        <div className="flex gap-4">
          <a href="/agents" className="text-sm hover:text-primary">Agents</a>
          <a href="/chat" className="text-sm hover:text-primary">Chat</a>
          <a href="/test-tools" className="text-sm hover:text-primary">Test Tools</a>
        </div>
      </div>
    </nav>
  )
} 