# Project Structure

This document outlines the key files and directories in our Next.js Chat Application.

## Root Directory

- `.env.local` - Environment variables file (not committed to version control)
- `next.config.js` - Next.js configuration file
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `postcss.config.js` - PostCSS configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `CHANGELOG.md` - Record of project updates and changes
- `README.md` - Project overview and setup instructions

## `/src` Directory

### `/app` - Next.js App Router Pages

- `/app/layout.tsx` - Root layout component with ThemeProvider
- `/app/page.tsx` - Landing page component
- `/app/chat/page.tsx` - Main chat interface page
- `/app/chat/layout.tsx` - Layout for chat pages
- `/app/prompts/page.tsx` - Prompts management page

### `/api` - API Routes

- `/api/chat/route.ts` - API route for chat completions
- `/api/agents/route.ts` - API route for agent management
- `/api/audio/route.ts` - API route for audio transcription
- `/api/image/route.ts` - API route for image generation

### `/components` - React Components

#### `/components/chat` - Chat-related Components

- `/components/chat/chat-interface.tsx` - Main chat UI component
- `/components/chat/chat-input.tsx` - Input component for chat messages
- `/components/chat/chat-messages.tsx` - Component for displaying chat messages
- `/components/chat/prompt-commands.tsx` - Component for slash command functionality

#### `/components/ui` - General UI Components

- `/components/ui/button.tsx` - Button component
- `/components/ui/dialog.tsx` - Dialog/modal component
- `/components/ui/dropdown.tsx` - Dropdown menu component
- `/components/ui/toast.tsx` - Toast notification component

### `/lib` - Utility Functions and Services

- `/lib/prompt-service.ts` - Service for managing prompts
- `/lib/concordCRM.ts` - CRM integration functionality
- `/lib/utils.ts` - General utility functions
- `/lib/validators.ts` - Input validation functions

### `/store` - State Management

- `/store/chatStore.ts` - Chat state management
- `/store/settingsStore.ts` - Application settings state

## Key Components Explained

### Chat Components

#### `chat-interface.tsx`
The main container for the chat UI, including:
- Left sidebar with recent chats and navigation
- Main content area with message display and input
- Right sidebar with settings
- Model selection dropdown

#### `chat-input.tsx`
Handles user input for messages:
- Text input with auto-resizing
- Slash command detection and processing
- File upload functionality
- Voice recording integration

#### `chat-messages.tsx`
Displays the conversation:
- User and assistant messages with different styling
- Code syntax highlighting
- Image rendering
- Loading indicators

#### `prompt-commands.tsx`
UI for slash commands:
- Dropdown display of available commands
- Search and filtering capabilities
- Command selection handling

### Services

#### `prompt-service.ts`
Manages saved prompts:
- State management using Zustand
- Persistent storage with localStorage
- Command processing and parameter replacement

## State Management

The application uses Zustand for state management across different stores:

### `chatStore.ts`
Manages chat-related state:
- Current messages
- Input value
- Generation status
- Chat history

### `settingsStore.ts`
Manages application settings:
- Selected model and provider
- UI preferences
- Agent configuration
- Dark mode settings

## API Integration

The application communicates with various AI providers through API routes:

### `/api/chat/route.ts`
Handles chat completions:
- Forwards requests to the appropriate AI provider
- Manages streaming responses
- Handles errors and rate limiting

### `/api/agents/route.ts`
Manages custom agents:
- CRUD operations for agents
- Agent selection and configuration 