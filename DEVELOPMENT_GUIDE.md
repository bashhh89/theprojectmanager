# Development Guide

This document provides guidance for developers working on this project, outlining best practices, coding standards, and workflow recommendations.

## Getting Started

### Development Environment Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env.local` file with required environment variables (see below)
4. Start the development server using one of the available scripts:
   - `npm run dev:alt` - Port 3003 (recommended for most development)
   - `npm run dev:fresh` - Port 3011 with increased memory allocation
   - `npm run dev:test99` - Port 3099 for testing specific features

### Environment Variables

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Pollinations API
NEXT_PUBLIC_POLLINATIONS_API_KEY=your-pollinations-api-key

# Other Services
NEXT_PUBLIC_ANYTHINGLLM_BASE_URL=https://your-anythingllm-instance.com
ANYTHINGLLM_API_KEY=your_api_key_here
```

## Project Architecture

### Key Directories

- `/src/app` - Next.js app router pages
- `/src/components` - Reusable UI components
- `/src/lib` - Utility functions and API clients
- `/src/context` - React context providers
- `/src/store` - State management (Zustand)
- `/src/hooks` - Custom React hooks
- `/src/types` - TypeScript type definitions

### Authentication Flow

The application uses Supabase for authentication with the following components:

1. `AuthProvider` in `/src/context/AuthContext.tsx` - Context provider for auth state
2. `useAuth()` hook - Provides access to auth state in components
3. `AuthWrapper` in `/src/components/AuthWrapper.tsx` - Route protection component
4. `<ClientLayout>` - Handles main application layout and sidebar visibility based on auth status

## Coding Standards

### TypeScript Best Practices

- Always define proper types for props, state, and function parameters
- Use interfaces for complex object structures
- Avoid using `any` type - prefer `unknown` when type is uncertain
- Use type guards and assertions where appropriate

### Component Structure

- Use functional components with hooks
- Keep components focused on a single responsibility
- Extract reusable UI elements to the `/src/components/ui` directory
- Follow naming conventions:
  - Component files: PascalCase.tsx
  - Utility files: kebab-case.ts
  - Hook files: useHookName.ts

### State Management

- Use React Context for global state that changes infrequently
- Use Zustand stores for complex state management
- Keep component state local when possible using useState/useReducer

## UI Components and Theming

### Theme Implementation

The application uses a customized dark theme with the following key files:

- `src/app/globals.css` - CSS variables and global styles
- `tailwind.config.js` - Tailwind CSS configuration
- `src/lib/design-system.ts` - Design tokens and component-specific styles

### Component Library

The project includes a custom UI component library in `/src/components/ui`, built with:

- Tailwind CSS for styling
- Radix UI for accessible primitives
- class-variance-authority for component variants

When building new UI components:
1. Check if a similar component already exists
2. Follow the established pattern for implementation
3. Use CSS variables from the theme system
4. Ensure proper dark mode support

## API Integration Best Practices

### Supabase

- Use the appropriate client:
  - `createClient()` from `/src/lib/supabase/server.ts` for server components
  - `supabase` from `/src/lib/supabaseClient.ts` for client components
- Implement proper error handling for all Supabase operations
- Use Row Level Security (RLS) policies to protect data

### Pollinations API

- Use the utility functions in `/src/lib/pollinationsApi.ts`
- Implement proper retry logic for unreliable endpoints
- Handle timeouts gracefully with user feedback

## Error Handling

- Use try/catch blocks for async operations
- Provide meaningful error messages to users via toast notifications
- Log detailed errors for debugging purposes
- Implement fallback UI for error states

## Testing

- Write unit tests for utility functions
- Create integration tests for complex components
- Use mock services for external APIs during testing
- Ensure comprehensive test coverage for critical paths

## Performance Optimization

- Use Next.js built-in optimizations:
  - Image optimization with `next/image`
  - Font optimization with `next/font`
  - Script optimization with `next/script`
- Implement proper code splitting with dynamic imports
- Optimize large component renders with `useMemo` and `useCallback`
- Monitor and optimize bundle size

## Deployment

- Build the production version: `npm run build`
- Preview production build locally: `npm run start`
- Use proper environment variables for production deployment

## Troubleshooting Common Issues

- Check the `KNOWN_ISSUES.md` file for documented issues and fixes
- For port conflicts, use alternate dev scripts or manually specify a port
- For Supabase auth issues, verify proper cookie handling and RLS policies
- For Pollinations API timeouts, implement proper fallback mechanisms

---

Last updated: [Current Date] 