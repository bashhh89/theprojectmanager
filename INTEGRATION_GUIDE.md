# QanDu AI Platform Integration Guide

This document provides comprehensive instructions for integrating the different modules of the QanDu AI Platform to create a cohesive SaaS experience.

## Table of Contents

1. [Module Overview](#module-overview)
2. [Architecture Design](#architecture-design)
3. [Chat + Document Processor Integration](#chat--document-processor-integration)
4. [Projects + Chat Integration](#projects--chat-integration)
5. [Products + Chat Integration](#products--chat-integration)
6. [Cross-Module Data Relationships](#cross-module-data-relationships)
7. [Deployment Considerations](#deployment-considerations)

## Module Overview

The QanDu AI Platform consists of the following modules:

1. **Chat Module**: AI-powered conversations with multiple models
2. **Projects Module**: Project management with Supabase
3. **Products Module**: Product catalog and management
4. **Document Processor**: Document processing and Q&A capabilities

Each module works independently but becomes more powerful when integrated with others.

## Architecture Design

The integration architecture follows these principles:

1. **API Gateway Pattern**: Next.js API routes act as a gateway to underlying services
2. **Shared Authentication**: Supabase Auth provides a unified identity system
3. **Cross-Module Context**: Information flows between modules via context sharing
4. **Consistent UI**: Components maintain visual and UX consistency

![Architecture Diagram](https://image.pollinations.ai/prompt/Software%20architecture%20diagram%20showing%20Next.js%20frontend%20with%20multiple%20modules%20connecting%20to%20API%20Gateway%20and%20shared%20services?width=800&height=500&nologo=true)

## Chat + Document Processor Integration

### API Gateway Implementation

Create API routes in the Next.js application to proxy requests to the Document Processor:

1. **Create file**: `src/app/api/documents/route.ts`

```typescript
// src/app/api/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const DOCUMENT_PROCESSOR_URL = process.env.DOCUMENT_PROCESSOR_URL || 'http://localhost:8000';
const API_KEY = 'qandu-dev-key'; // Store in env variables in production

export async function POST(req: NextRequest) {
  // Authenticate user
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Forward request to document processor
    const formData = await req.formData();
    const response = await fetch(`${DOCUMENT_PROCESSOR_URL}/documents/upload`, {
      method: 'POST',
      headers: {
        'api-key': API_KEY
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Document processor error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Store document metadata in Supabase for cross-referencing
    const { error } = await supabase.from('user_documents').insert({
      user_id: user.id,
      document_id: result.id,
      filename: formData.get('file')?.['name'] || 'unknown',
      workspace_id: formData.get('workspace_id') as string
    });
    
    if (error) {
      console.error('Error storing document metadata:', error);
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
}
```

### Chat UI Update

Add document upload functionality to the chat interface:

1. **Create file**: `src/components/chat/document-upload.tsx`

```typescript
// src/components/chat/document-upload.tsx
import { useState } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentUploadProps {
  onUploadComplete: (documentId: string) => void;
}

export function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setProgress(0);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('workspace_id', 'default'); // Use default workspace or let user select
    
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }
      
      const result = await response.json();
      onUploadComplete(result.id);
    } catch (error) {
      console.error('Upload error:', error);
      // Show error to user
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="relative inline-block">
      <input
        type="file"
        id="document-upload"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleFileChange}
        accept=".pdf,.docx,.txt,.md"
        disabled={isUploading}
      />
      <Button
        variant="outline"
        className="flex items-center gap-2"
        disabled={isUploading}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Uploading...</span>
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            <span>Upload Document</span>
          </>
        )}
      </Button>
    </div>
  );
}
```

2. **Update the chat input component**:

```typescript
// Update src/components/chat/chat-input-new.tsx

// Add import for DocumentUpload
import { DocumentUpload } from './document-upload';

// Inside the component
const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);

// Add to the JSX, near the other control buttons
<DocumentUpload onUploadComplete={setActiveDocumentId} />

// Update the message handling logic to include document context
const handleSendMessage = async () => {
  if (activeDocumentId) {
    // Get document context first
    const documentContext = await fetch(`/api/documents/${activeDocumentId}/context?query=${encodeURIComponent(value)}`)
      .then(res => res.json());
    
    // Modify system prompt to include document context
    const enhancedSystemPrompt = `${systemPrompt}\n\nDocument context: ${documentContext.text}`;
    
    // Use the enhanced system prompt
    // Rest of your message handling logic
  } else {
    // Regular message handling without document context
  }
};
```

### Document Context Retrieval

Create an API route to get document context based on the query:

```typescript
// src/app/api/documents/[id]/context/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query') || '';
  
  try {
    const response = await fetch(
      `${process.env.DOCUMENT_PROCESSOR_URL}/query/search`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': 'qandu-dev-key'
        },
        body: JSON.stringify({
          query,
          document_id: params.id,
          max_results: 3
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to retrieve context: ${response.status}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      text: data.results.map((result: any) => result.text).join('\n\n')
    });
  } catch (error) {
    console.error('Error retrieving document context:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve document context' },
      { status: 500 }
    );
  }
}
```

## Projects + Chat Integration

### Project Context Provider

Create a context provider to make project data available to the chat:

```typescript
// src/contexts/ProjectContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Project {
  id: string;
  title: string;
  description: string;
  // Other project fields
}

interface ProjectContextType {
  projects: Project[];
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  
  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*');
        
      if (error) {
        console.error('Error fetching projects:', error);
        return;
      }
      
      setProjects(data || []);
    };
    
    fetchProjects();
  }, []);
  
  return (
    <ProjectContext.Provider value={{ projects, activeProject, setActiveProject }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  
  return context;
}
```

### Project Chat Command

Add a project-specific command to the chat:

```typescript
// Update src/lib/prompt-service.ts

// Add a new command for projects
const projectCommand = {
  name: 'project',
  description: 'Get information about or update a project',
  usage: '/project [id] [action]',
  execute: async (args: string[]) => {
    const [projectId, action = 'info'] = args;
    
    if (!projectId) {
      return {
        success: false,
        error: 'Project ID is required'
      };
    }
    
    try {
      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
        
      if (error || !project) {
        return {
          success: false,
          error: `Project not found: ${error?.message || 'Unknown error'}`
        };
      }
      
      switch (action) {
        case 'info':
          return {
            success: true,
            content: `Project: ${project.title}\nDescription: ${project.description}\nStatus: ${project.status}\nPriority: ${project.priority}`
          };
          
        case 'tasks':
          const { data: tasks } = await supabase
            .from('tasks')
            .select('*')
            .eq('project_id', projectId);
            
          return {
            success: true,
            content: `Tasks for ${project.title}:\n${tasks?.map(t => `- ${t.title} (${t.status})`).join('\n') || 'No tasks found'}`
          };
          
        default:
          return {
            success: false,
            error: `Unknown action: ${action}`
          };
      }
    } catch (error) {
      console.error('Error executing project command:', error);
      return {
        success: false,
        error: 'Failed to execute project command'
      };
    }
  }
};

// Add to commands array
const commands = [
  // ... existing commands
  projectCommand
];
```

## Products + Chat Integration

Similarly, create a product chat command:

```typescript
// Update src/lib/prompt-service.ts

// Add product command
const productCommand = {
  name: 'product',
  description: 'Get information about products',
  usage: '/product [id] [action]',
  execute: async (args: string[]) => {
    const [productId, action = 'info'] = args;
    
    if (!productId) {
      return {
        success: false,
        error: 'Product ID is required'
      };
    }
    
    try {
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
        
      if (error || !product) {
        return {
          success: false,
          error: `Product not found: ${error?.message || 'Unknown error'}`
        };
      }
      
      switch (action) {
        case 'info':
          return {
            success: true,
            content: `Product: ${product.name}\nDescription: ${product.description}\nFeatures: ${product.features?.map(f => f.title).join(', ') || 'None'}`
          };
          
        case 'features':
          return {
            success: true,
            content: `Features of ${product.name}:\n${product.features?.map(f => `- ${f.title}: ${f.description}`).join('\n') || 'No features defined'}`
          };
          
        default:
          return {
            success: false,
            error: `Unknown action: ${action}`
          };
      }
    } catch (error) {
      console.error('Error executing product command:', error);
      return {
        success: false,
        error: 'Failed to execute product command'
      };
    }
  }
};

// Add to commands array
const commands = [
  // ... existing commands
  productCommand
];
```

## Cross-Module Data Relationships

### Database Schema Updates

To connect data across modules, add these tables to your Supabase database:

1. **User Documents Table**:
```sql
CREATE TABLE user_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, document_id)
);
```

2. **Project Documents Table**:
```sql
CREATE TABLE project_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, document_id)
);
```

3. **Chat Context Table**:
```sql
CREATE TABLE chat_context (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id TEXT NOT NULL,
  context_type TEXT NOT NULL, -- 'project', 'product', 'document'
  context_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Context Selector UI

Add a context selector to the chat interface:

```typescript
// src/components/chat/context-selector.tsx
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProject } from '@/contexts/ProjectContext';
import { supabase } from '@/lib/supabaseClient';

interface ContextSelectorProps {
  onContextChange: (contextType: string, contextId: string) => void;
}

export function ContextSelector({ onContextChange }: ContextSelectorProps) {
  const { projects } = useProject();
  const [products, setProducts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [contextType, setContextType] = useState<string>('none');
  const [selectedId, setSelectedId] = useState<string>('');
  
  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('id, name');
      setProducts(data || []);
    };
    
    const fetchDocuments = async () => {
      const { data } = await supabase.from('user_documents').select('document_id, filename');
      setDocuments(data || []);
    };
    
    fetchProducts();
    fetchDocuments();
  }, []);
  
  const handleTypeChange = (type: string) => {
    setContextType(type);
    setSelectedId('');
  };
  
  const handleIdChange = (id: string) => {
    setSelectedId(id);
    onContextChange(contextType, id);
  };
  
  return (
    <div className="flex flex-col space-y-2">
      <Select onValueChange={handleTypeChange} value={contextType}>
        <SelectTrigger>
          <SelectValue placeholder="Select context type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No Context</SelectItem>
          <SelectItem value="project">Project</SelectItem>
          <SelectItem value="product">Product</SelectItem>
          <SelectItem value="document">Document</SelectItem>
        </SelectContent>
      </Select>
      
      {contextType !== 'none' && (
        <Select onValueChange={handleIdChange} value={selectedId}>
          <SelectTrigger>
            <SelectValue placeholder={`Select ${contextType}`} />
          </SelectTrigger>
          <SelectContent>
            {contextType === 'project' && projects.map(project => (
              <SelectItem key={project.id} value={project.id}>
                {project.title}
              </SelectItem>
            ))}
            
            {contextType === 'product' && products.map(product => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
            
            {contextType === 'document' && documents.map(doc => (
              <SelectItem key={doc.document_id} value={doc.document_id}>
                {doc.filename}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
```

## Deployment Considerations

### Service Architecture

For a production deployment, use this architecture:

1. **Next.js Frontend**: Main application
   - Deploy to Vercel, Netlify, or similar
   - Set environment variables for backend services

2. **Document Processor API**:
   - Deploy as standalone service
   - Use Docker for containerization
   - Set up proper CORS for frontend communication

3. **Supabase Database & Auth**:
   - Use managed Supabase instance
   - Configure Row Level Security (RLS) properly

### Environment Configuration

Create a `.env.production` file with these variables:

```
# Next.js Frontend
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
DOCUMENT_PROCESSOR_URL=<document-processor-url>
API_KEY=<shared-api-key>

# Document Processor
PORT=8000
DATA_DIR=./data
API_KEYS=<comma-separated-api-keys>
LOG_LEVEL=info
```

### Networking & Security

1. **API Gateway**: Use the Next.js API routes as a secure gateway to backend services
2. **Authentication**: All requests should pass through authentication
3. **HTTPS**: Use HTTPS for all communications
4. **API Keys**: Rotate keys regularly and store securely

## Next Steps

After implementing these integrations, consider these improvements:

1. **Unified Dashboard**: Create a dashboard showing data from all modules
2. **Search Integration**: Implement cross-module search functionality
3. **Analytics**: Add usage tracking and analytics
4. **User Management**: Add team and role management

By following this integration guide, you will create a cohesive SaaS experience that leverages the strengths of each module while providing a unified interface for users. 