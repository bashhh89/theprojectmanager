# QanDu AI Chat Application - Comprehensive Documentation

## Project Overview

NQQ is a sophisticated Next.js-based AI chat application that leverages the Pollinations.ai API to provide a comprehensive interface for interacting with various AI models. The application supports text generation, image creation, and audio capabilities in a modern, user-friendly interface.

## Technology Stack

### Frontend Framework
- **Next.js 14+**: React framework providing server-side rendering and static site generation capabilities
- **TypeScript**: Ensures type safety and improved developer experience
- **React 18+**: Component-based UI library

### State Management
- **Zustand**: Lightweight state management with persistence capabilities
- **Persist middleware**: Stores chat sessions in browser local storage for session continuity

### Styling
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **CSS Modules**: Component-scoped styling for maintainable code

### API Integration
- **Pollinations.ai API**: Primary AI service provider supporting multiple models and modalities
- **Model Context Protocol (MCP)**: Helper system for structured communication with AI models

## Core Features

### Chat System
- **Multi-model conversations**: Support for 30+ AI models including:
  - OpenAI GPT-4o and GPT-4o-mini
  - Llama 3.3
  - Mistral Large and Small
  - DeepSeek models
  - Qwen models
  - Specialized models (Unity, MidiJourney, etc.)
- **Persistent chat history**: All conversations are saved locally
- **Multiple chat sessions**: Users can create, rename, and switch between chat sessions
- **Real-time text generation**: Streaming responses from AI models

### Multimodal Capabilities

#### Text Generation
- Multiple models with varying capabilities (vision, reasoning, base models)
- Adjustable parameters (temperature, max tokens)
- System prompt customization
- Real-time streaming responses

#### Image Generation
- Integration with image models ("Flux" and "Turbo")
- Customizable image generation parameters:
  - Resolution control (width/height)
  - Seed specification for reproducibility
  - Model selection
  - Watermark toggle

#### Audio Generation
- Text-to-speech functionality with 13 different voice options:
  - Alloy, Echo, Fable, Onyx, Nova, Shimmer, Coral
  - Verse, Ballad, Ash, Sage, Amuch, Dan
- Voice selection for personalized audio output

#### Input Methods
- **Text input**: Traditional keyboard input with support for multiline text
- **Voice input**: Microphone recording capability for speech-to-text
- **File upload**: Support for PDF and image files (implementation in progress)

### User Interface
- **Modern design**: Clean, intuitive interface with light/dark mode support
- **Responsive layout**: Adapts to different screen sizes
- **Sidebar navigation**: Easy access to different chat sessions
- **Settings panel**: Model selection and parameter configuration
- **Toast notifications**: System messages and error reporting

## Technical Implementation

### Chat Store (src/store/chatStore.ts)
- Manages chat sessions and message history
- Supports multiple content types (text, image, audio)
- Persists data using local storage
- Provides methods for chat CRUD operations

### Settings Store (src/store/settingsStore.ts)
- Handles user preferences and model selection
- Persists settings across sessions
- Controls UI preferences and API parameters

### Pollinations API Integration (src/lib/pollinationsApi.ts)
- Comprehensive client for the Pollinations.ai API
- Supports all available models with proper error handling
- Implements timeout mechanisms to prevent hanging requests
- Provides utilities for image URL and audio URL generation

### MCP Helper (src/lib/mcpHelper.ts)
- Facilitates structured communication with AI models
- Handles different request types and response formats
- Processes conversation history for context management

### Component Architecture
- **Layout (src/app/layout.tsx)**: Main application structure
- **Chat Components**:
  - **chat-input.tsx**: User input handling with multimodal support
  - **chat-messages.tsx**: Display of conversation history
- **UI Components**: Reusable interface elements
- **Sidebar**: Navigation and session management

## API Routes

### Chat API (src/app/api/chat/route.ts)
- Handles text generation requests
- Processes conversation history
- Forwards requests to Pollinations API

### Image API (src/app/api/image/route.ts)
- Processes image generation requests
- Handles parameter validation and forwarding

### Audio API (src/app/api/audio/route.ts)
- Manages text-to-speech requests
- Supports different voice options

## Error Handling

The application implements comprehensive error handling:
- API timeout detection and recovery
- Rate limit and credit limitation handling
- Model availability monitoring
- Graceful degradation with informative user feedback
- Network error recovery strategies

## Performance Optimizations

- **Efficient state management**: Minimal re-renders with Zustand
- **Lazy loading**: Components loaded only when needed
- **Resource caching**: Prevents redundant API calls
- **Streaming responses**: Progressive content delivery

## Security Considerations

- **Client-side storage**: User data remains on their device
- **API request sanitization**: Prevention of injection attacks
- **Content filtering options**: Available through model selection

## User Experience Features

- **Auto-resizing text input**: Adapts to content length
- **Loading indicators**: Visual feedback during generation
- **Error notifications**: Clear communication of issues
- **Keyboard shortcuts**: Enhanced navigation and input
- **Chat session management**: Easy organization of conversations

## Future Enhancement Roadmap

### Planned Features
- **Advanced file handling**: Improved PDF and image processing
- **Authentication system**: User accounts for cloud synchronization
- **Collaborative sessions**: Multi-user conversation capabilities
- **Export/import functionality**: Portability of chat sessions
- **Advanced search**: Content-based search across conversations
- **Custom model fine-tuning**: Personalized AI model adaptation
- **Webhook integrations**: Connection with external services

### Technical Improvements
- **Database integration**: Server-side storage option
- **Progressive Web App**: Offline capabilities
- **Mobile app versions**: Native mobile experience
- **API key management**: User-provided API keys

## Installation and Setup

### Prerequisites
- Node.js 18.17.0 or later
- npm or yarn package manager

### Installation Steps
1. Clone the repository
2. Run `npm install` or `yarn install`
3. Create `.env.local` file with required API keys
4. Run `npm run dev` or `yarn dev` to start the development server
5. Access the application at `http://localhost:3000`

### Configuration Options
- Environment variables for API endpoints and keys
- Tailwind configuration for styling customization
- Next.js configuration for build and deployment settings

## Development Guidelines

### Code Structure
- Component-based architecture
- Clear separation of concerns
- TypeScript for type safety
- Modular design for extensibility

### Best Practices
- Comprehensive error handling
- Responsive design principles
- Accessibility considerations
- Performance optimization

## Deployment

### Deployment Options
- Vercel (recommended for Next.js)
- Netlify
- Self-hosted Node.js server
- Docker container deployment

### Environment Requirements
- Node.js runtime
- Environment variables for API keys
- Adequate memory for Next.js optimization

## Support and Maintenance

### Issue Tracking
- GitHub Issues for bug tracking and feature requests
- Internal documentation for common problems and solutions

### Update Process
- Regular dependency updates
- Security patch application
- Feature addition based on roadmap

## License and Credits

### License
- MIT License (open source)

### Dependencies
- Next.js by Vercel
- React
- Zustand
- Tailwind CSS
- Pollinations.ai API services
- Supabase (for Auth, Brand Profiles, Projects)
- Reveal.js (for presentation display)
- Marked (for Markdown parsing)

## AI Presentation Generator

### Overview
This tool allows users to generate presentations automatically based on a topic or a sales proposal structure. It leverages AI for content generation (text and image prompts) and integrates with the user's brand profile for consistent styling.

### Core Features
- **Presentation Type Selection**: Users can choose between generating a 'General Topic' presentation or a 'Sales Proposal'.
- **Input Fields**: Dynamic input fields based on the selected type (Topic/Audience for General, Client/Goal for Proposal).
- **Brand Integration**: Fetches the selected brand profile (via `brandId` query parameter) to apply:
    - Colors (background, text, accent)
    - Typography (heading and body fonts)
- **Brand Styling Toggle**: Allows users to disable brand styling for a neutral look.
- **AI Content Generation**: Calls the `/api/generate-presentation-slides` endpoint to get:
    - Slide titles
    - Slide content (Markdown)
    - Slide layouts (e.g., `title-slide`, `image-left`, `text-only`)
    - Image prompts for relevant slides
- **AI Image Generation**: Calls the `/api/generate-image` endpoint using the prompts to fetch images from Pollinations.
- **Reveal.js Display**: Renders the generated slides using the `RevealPresentation` component, which wraps Reveal.js.
- **Consistent Sizing**: Presentation view is constrained to a 16:9 aspect ratio box for consistent display.
- **Synchronized Loading**: The presentation view now waits until all slide content and images are fetched before displaying, showing a loading indicator in the interim.
- **PDF Export**: (Placeholder) Button exists but functionality is not yet implemented.

### API Routes Used
- **`/api/generate-presentation-slides` (POST)**: 
    - Takes presentation type, topic/proposal details, audience, additional info, and optional brand profile.
    - Returns an array of slide objects containing title, content (Markdown), layout, and imagePrompt.
- **`/api/generate-image` (POST)**:
    - Takes an image prompt.
    - Constructs and returns a Pollinations image URL.

### Frontend Components
- **`src/app/tools/presentation-generator/page.tsx`**: The main page component handling user input, state management, API calls, and rendering the presentation view.
- **`src/components/presentation/RevealPresentation.tsx`**: A wrapper component for Reveal.js that processes slide data (including fetching images via API), initializes Reveal.js, and handles rendering logic based on slide layouts and styles.

### Recent Fixes & Improvements (May/June 2024)
- Implemented Proposal generation type alongside General Topic.
- Added Brand styling integration and toggle switch.
- Fixed inconsistent slide height issues by setting fixed dimensions and aspect ratio.
- Resolved missing image issue by implementing image fetching based on prompts in `RevealPresentation`.
- Improved loading experience by ensuring all content (text & images) loads before the presentation is shown.

## Project Management

### Overview
The project management system allows users to create, view, and manage projects. Projects are stored in a Supabase database table and are associated with the authenticated user.

### Database Structure
Projects are stored in a `projects` table with the following schema:

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed'))
);
```

### Row Level Security
Projects are secured using Supabase Row Level Security (RLS) policies that ensure users can only access their own projects:

```sql
-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policy for users to select their own projects
CREATE POLICY "Users can view their own projects"
  ON projects
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own projects
CREATE POLICY "Users can insert their own projects"
  ON projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own projects
CREATE POLICY "Users can update their own projects"
  ON projects
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy for users to delete their own projects
CREATE POLICY "Users can delete their own projects"
  ON projects
  FOR DELETE
  USING (auth.uid() = user_id);
```

### Authentication Flow
The authentication system uses Supabase Auth with additional session persistence:

1. Users sign in via the login form
2. Sessions are stored both in Supabase and as a backup in localStorage
3. When accessing protected routes like the dashboard, `requireAuth()` checks authentication
4. If authenticated, user projects are fetched based on their user ID
5. If not authenticated, they are redirected to the login page

### Components

#### Dashboard Page
Located at `/src/app/dashboard/page.tsx`, this component:
- Checks user authentication on mount
- Fetches and displays the user's projects
- Shows loading state while fetching
- Displays empty state if no projects exist
- Shows the user's email in the header

#### Authentication Utilities
Located at `/src/lib/authUtils.ts`, these utilities handle:
- User sign-in/sign-out
- Session management and persistence
- Route protection
- Session refresh

### Setup Instructions

1. **Create Supabase Projects Table:**
   - Navigate to the Supabase SQL Editor
   - Run the SQL below to create the projects table and security policies:

```sql
-- Create the projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed'))
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policy for users to select their own projects
CREATE POLICY "Users can view their own projects"
  ON projects
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own projects
CREATE POLICY "Users can insert their own projects"
  ON projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own projects
CREATE POLICY "Users can update their own projects"
  ON projects
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy for users to delete their own projects
CREATE POLICY "Users can delete their own projects"
  ON projects
  FOR DELETE
  USING (auth.uid() = user_id);

-- Optional: Create an index on user_id for performance
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
```

2. **Create a Test Project:**
   - To test the dashboard, create a project for your user:
   - Get your user ID by checking console logs after login
   - Run the SQL query, replacing `REPLACE_WITH_USER_ID` with your actual user ID:

```sql
INSERT INTO projects (name, description, user_id, status)
VALUES ('Test Project', 'This is a test project created to verify the dashboard functionality.', 'REPLACE_WITH_USER_ID', 'active');
```

3. **Access the Dashboard:**
   - Navigate to `/dashboard` in your application
   - If you're authenticated, you should see your projects
   - If not, you'll be redirected to the login page

### Troubleshooting

If you encounter issues with the project dashboard:

1. **Session Persistence Issues:**
   - Clear browser cookies/cache and try logging in again
   - Check browser console for authentication debugging logs

2. **Missing Projects:**
   - Verify project records exist in the Supabase table
   - Confirm the user_id in the projects table matches your authenticated user ID

3. **Database Errors:**
   - Check that the projects table exists and has the correct schema
   - Ensure RLS policies are properly configured

## Task Management

The project now includes a complete task management system integrated with the projects feature. This allows users to create, view, and manage tasks within their projects.

### Database Structure

The task system is built on a Supabase database table with the following structure:

```sql
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE
);
```

The task table uses RLS (Row Level Security) policies to ensure users can only access their own tasks or tasks within projects they own:

```sql
-- Policy for users to view their own tasks
CREATE POLICY "Users can view their own tasks"
  ON public.tasks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for users to view tasks in projects they own
CREATE POLICY "Users can view tasks from their projects"
  ON public.tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = tasks.project_id
      AND projects.user_id = auth.uid()
    )
  );
```

### Features

The task management system includes:

1. **Task Creation**: Users can add new tasks to projects with details like title, description, priority, status, and due date
2. **Task Listing**: Tasks are displayed in a table view within the project details page
3. **Status Tracking**: Tasks can be marked as "pending", "in progress", or "completed"
4. **Priority Levels**: Tasks can be assigned "low", "medium", or "high" priority
5. **Project Progress**: The system automatically calculates project progress based on completed tasks

### Setup Instructions

To set up the task management system:

1. Execute the SQL script `supabase-tasks-setup.sql` in your Supabase SQL Editor to create the tasks table and set up RLS policies
2. The application UI is already configured to interact with the tasks table

### Components

- **Project Detail Page** (`src/app/projects/[id]/page.tsx`): Displays project details and lists all tasks for the project
- **Add Task Page** (`src/app/projects/[id]/add-task/page.tsx`): Form for creating new tasks within a project

### Usage

1. Navigate to any project detail page
2. View existing tasks in the task table
3. Click "Add Task" to create a new task
4. Fill in the task details and submit the form
5. The new task will appear in the task list and project progress will be updated

## AnythingLLM Integration

The project now includes a comprehensive integration with AnythingLLM, providing AI-powered document management and chat capabilities for each project.

### Integration Overview

- Each project is associated with its own AnythingLLM workspace
- Project-specific document processing and storage
- AI-powered chat interface using the project's documents as context
- Vector search across all project documents

### Technical Implementation

#### Database Schema Additions

The following fields have been added to the `projects` table:

```sql
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS anythingllm_workspace_id TEXT,
ADD COLUMN IF NOT EXISTS anythingllm_workspace_slug TEXT;
```

A new `project_documents` table has been created for tracking documents:

```sql
CREATE TABLE IF NOT EXISTS project_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size BIGINT NOT NULL,
  type TEXT,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'processed', 'failed')),
  anythingllm_doc_id TEXT,
  tokens INTEGER DEFAULT 0,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

#### Key Components

1. **AnythingLLM Client** (`src/lib/anythingllm-client.ts`):
   - API client for communication with AnythingLLM
   - Handles workspace creation, document upload, and chat

2. **AnythingLLM Service** (`src/lib/anythingllm-service.ts`):
   - High-level service for integrating AnythingLLM with the project system
   - Manages workspace creation, document upload, and chat with project context

3. **Configuration** (`src/lib/anythingllm-config.ts`):
   - Configuration settings for the AnythingLLM integration
   - Environment variable handling for API access

4. **API Routes**:
   - `/api/document-upload`: Upload documents to projects
   - `/api/project-chat`: Chat with project documents
   - `/api/project-chat-stream`: Stream chat responses for real-time interaction

#### Workflow

1. **Project Creation**:
   - When a project is created, a corresponding AnythingLLM workspace is created
   - The workspace ID and slug are stored in the project record

2. **Document Upload**:
   - Documents are uploaded to the project's AnythingLLM workspace
   - Document metadata is stored in the `project_documents` table
   - AnythingLLM handles document processing, embedding, and storage

3. **Chat**:
   - User sends a message to a project
   - The message is routed to the project's AnythingLLM workspace
   - AnythingLLM processes the message and returns a response based on the project's documents
   - Streaming responses provide real-time feedback

### Configuration

The integration requires the following environment variables:

```
NEXT_PUBLIC_ANYTHINGLLM_BASE_URL=https://your-anythingllm-instance.com
ANYTHINGLLM_API_KEY=your_api_key_here
ANYTHINGLLM_SIMILARITY_THRESHOLD=0.7
ANYTHINGLLM_MAX_RESULTS=5
ANYTHINGLLM_HISTORY_MESSAGE_COUNT=20
```

### Supported Document Types

The integration supports the following document types:
- PDF (.pdf)
- Microsoft Word (.docx, .doc)
- Plain Text (.txt)
- Markdown (.md)
- CSV (.csv)

### Future Enhancements

- Support for more document types
- Advanced document search functionality
- Custom model parameters for different project types
- Batch document processing
- Document versioning and history

---

*Last updated: March 28, 2025*

This documentation is continuously updated as the project evolves.