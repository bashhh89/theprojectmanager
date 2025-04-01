'use client'

import React, { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlusCircle, Loader2, X } from 'lucide-react'
import { createPage } from '@/app/website-builder/actions' // Import the server action (Absolute path)
import { toast } from 'sonner' // Using sonner for toasts

interface AddPageFormProps {
  websiteId: string;
}

export function AddPageForm({ websiteId }: AddPageFormProps) {
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [pageName, setPageName] = useState('')
  const [pageSlug, setPageSlug] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null) // Clear previous errors

    const formData = new FormData()
    formData.append('pageName', pageName)
    formData.append('pageSlug', pageSlug)

    startTransition(async () => {
      const result = await createPage(websiteId, formData)
      if (result?.error) {
        setError(result.error)
        toast.error(`Failed to add page: ${result.error}`)
      } else {
        toast.success(`Page '${pageName}' added successfully!`)
        // Reset form and hide it
        setPageName('')
        setPageSlug('')
        setShowForm(false)
        // The page list will update automatically due to revalidatePath in the action
      }
    })
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setPageName(name);
    // Auto-generate slug from name (basic version)
    const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setPageSlug(slug);
  }

  if (!showForm) {
    return (
      <Button size="sm" onClick={() => setShowForm(true)}>
        <PlusCircle className="h-4 w-4 mr-2" />
        Add New Page
      </Button>
    )
  }

  return (
    <form 
      onSubmit={handleSubmit}
      className="p-4 border rounded bg-card mb-4 space-y-4"
    >
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Add New Page</h3>
        <Button variant="ghost" size="icon" type="button" onClick={() => setShowForm(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="pageName">Page Name</Label>
        <Input 
          id="pageName" 
          name="pageName" 
          value={pageName}
          onChange={handleNameChange}
          placeholder="e.g., About Us"
          required 
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pageSlug">Page Slug (URL Path)</Label>
        <div className="flex items-center">
          <span className="text-sm text-muted-foreground p-2 bg-muted border border-r-0 rounded-l-md">/</span>
          <Input 
            id="pageSlug" 
            name="pageSlug"
            value={pageSlug}
            onChange={(e) => setPageSlug(e.target.value)} 
            placeholder="e.g., about-us"
            required 
            disabled={isPending}
            className="rounded-l-none"
          />
        </div>
        <p className="text-xs text-muted-foreground">Should be unique. Use lowercase letters, numbers, and hyphens.</p>
      </div>
      
      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Adding...</>
        ) : (
          'Add Page'
        )}
      </Button>
    </form>
  )
} 