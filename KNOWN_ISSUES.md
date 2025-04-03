# Known Issues & Fixes

This document tracks known issues, implemented fixes, and potential improvements for the project. This should be updated whenever new issues are discovered or fixes are implemented.

## Active Issues

### Authentication

- Website Builder authentication errors in server components need to be handled with redirection to login page, not error throwing
- Supabase client initialization in server components needs to use awaited cookies() call

### Server Issues

- Port conflicts when running development server on default port 3002
  - Error: `listen EADDRINUSE: address already in use :::3002`
  - Workaround: Use alternate ports with npm run dev:alt (port 3003) or npm run dev:fresh (port 3011)

### API Integration

- Pollinations API timeouts and connection issues
  - Error: `API attempt X/3 with model llama` followed by timeout
  - Impact: Affects system prompt generation and testing

### UI/Styling Issues

- Inconsistent theming across components
- Multiple toast notification systems causing type errors:
  - Missing 'duration' property in toast type definition causing linter errors

### Component Issues

- Import error in chat-interface.tsx: `generatePollinationsAudio` is not exported from '@/lib/pollinationsApi'

## Recently Fixed Issues

### Authentication

- Website Builder layout now includes proper auth checks with useAuth() hook
- Server actions in website-builder/actions.ts updated to redirect to login page rather than throwing errors
- Fixed Supabase client initialization in server components to properly await cookies() call
  - Updated createClient() function in src/lib/supabase/server.ts to be async and properly await cookies()
  - Updated all server components to await the createClient() call

### Component Issues

- Fixed import error in chat-interface.tsx by correctly importing the generatePollinationsAudio function
  - Updated imports to include all required functions from pollinationsApi.ts

### UI Fixes

- Removed 'duration' property from toast calls in AgentForm.tsx to fix linter errors

## Recommended Improvements

### Code Organization

- Standardize toast implementation across the application:
  - Choose either custom implementation in use-toast.ts or React Hot Toast
  - Ensure consistent API and styling across all usages

### Performance

- Add proper memory management for NextJS:
  - Current workaround uses `NODE_OPTIONS=--max_old_space_size=4096` in dev:fresh script
  - Investigate webpack caching errors and optimize build process

### Developer Experience

- Improve development scripts:
  - Create kill-node script compatible with Windows PowerShell
  - Add scripts to run on different ports without conflicts

### Theme Implementation

- Consolidate theme variables from:
  - globals.css
  - tailwind.config.js
  - src/lib/design-system.ts
  - Ensure all components use these variables consistently

### Error Handling

- Implement centralized error boundary components
- Add comprehensive error logging
- Create fallback UIs for common error states

## Development Workflow

1. Before implementing any changes, check this document for related known issues
2. After fixing an issue, move it from "Active Issues" to "Recently Fixed Issues" with a brief description
3. Add any new discovered issues to the appropriate section
4. Periodically audit the "Recently Fixed Issues" section and move older items to an archive

## Port Reference

| Script       | Port | Description                                      |
|--------------|------|--------------------------------------------------|
| npm run dev  | 3002 | Default development server                        |
| npm run dev:alt | 3003 | Alternative port for development               |
| npm run dev:fresh | 3011 | Fresh instance with increased memory allocation |
| npm run dev:test99 | 3099 | Test server on port 3099                    |

---

Last updated: June 10, 2024 