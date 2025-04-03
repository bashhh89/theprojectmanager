# Component Guide

This document provides detailed information about the UI components available in the project, their usage patterns, and styling guidelines.

## UI Component Library

The project uses a custom UI component library located in `/src/components/ui`. These components are built using Tailwind CSS and Radix UI primitives for accessibility.

### Core UI Components

#### Button

**File:** `/src/components/ui/button.tsx` 

**Variants:**
- Primary: `variant="default"`
- Secondary: `variant="secondary"`
- Outline: `variant="outline"`
- Ghost: `variant="ghost"`
- Destructive: `variant="destructive"`

**Sizes:**
- Default: `size="default"`
- Small: `size="sm"`
- Large: `size="lg"`
- Icon: `size="icon"`

**Example:**
```tsx
<Button variant="default" size="default">
  Click Me
</Button>

<Button variant="outline" size="sm" className="mt-2">
  Small Outline
</Button>
```

#### Input

**File:** `/src/components/ui/input.tsx`

**Example:**
```tsx
<Input 
  type="email" 
  placeholder="Email address" 
  className="w-full"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

#### Select

**File:** `/src/components/ui/select.tsx`

**Example:**
```tsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger className="w-full">
    <SelectValue placeholder="Select an option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
    <SelectItem value="option3">Option 3</SelectItem>
  </SelectContent>
</Select>
```

#### Toast

**File:** `/src/components/ui/toast.tsx` and `/src/components/ui/use-toast.ts`

The project has two toast systems. For consistency, use the `use-toast.ts` implementation:

**Example:**
```tsx
import { useToast } from "@/components/ui/use-toast";

function MyComponent() {
  const { toast } = useToast();
  
  const showToast = () => {
    toast({
      title: "Success",
      description: "Operation completed successfully",
      variant: "default" // or "destructive"
    });
  };
  
  return <Button onClick={showToast}>Show Toast</Button>;
}
```

#### Card

**File:** `/src/components/ui/card.tsx` and `/src/components/ui/card-unified.tsx`

Use `card-unified.tsx` for newer components:

**Example:**
```tsx
<Card className="w-full">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Specialized Components

#### Chat Components

The chat interface consists of several specialized components:

- `/src/components/chat/chat-interface.tsx` - Main chat container
- `/src/components/chat/chat-messages.tsx` - Messages display
- `/src/components/chat/chat-input.tsx` - User input field

When modifying chat components, ensure they work with the following features:
- Voice selection
- Text-to-speech functionality
- Speech-to-text recording
- Markdown rendering

#### Agent Components

Agent management consists of:

- `/src/components/agents/AgentList.tsx` - List of available agents
- `/src/components/agents/AgentForm.tsx` - Create/edit agent form
- `/src/components/agents/AgentSidebar.tsx` - Sidebar for agent management

When working with these components, handle Pollinations API integration carefully.

## Styling Guidelines

### Theme Usage

Always use theme variables from `globals.css` for consistency:

```tsx
// GOOD - Using theme variables
<div className="bg-background text-foreground border-border">
  <p className="text-primary">Themed content</p>
</div>

// BAD - Using hardcoded colors
<div className="bg-zinc-900 text-white border-gray-700">
  <p className="text-blue-500">Hardcoded colors</p>
</div>
```

### Dark Mode

The application uses dark mode by default. When adding new styles:

1. Use CSS variables with the `dark:` modifier when needed
2. Test all components in dark mode
3. Avoid hardcoded light mode colors

### Responsive Design

All components should be responsive:

1. Mobile-first approach (default styles for mobile)
2. Use Tailwind breakpoints for larger screens:
   - `sm`: 640px
   - `md`: 768px
   - `lg`: 1024px
   - `xl`: 1280px
   - `2xl`: 1536px

Example:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Content will be 1 column on mobile, 2 on tablet, 3 on desktop */}
</div>
```

### Animation Guidelines

- Use the provided animation classes from globals.css:
  - `qandu-fade-in`
  - `qandu-slide-in`
  - `animate-fade-in-out`
- Keep animations subtle and purposeful
- Avoid excessive animations that might distract users

## Component Development Best Practices

### Component Structure

Follow this pattern for new components:

```tsx
// ComponentName.tsx
'use client'; // For client components only

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ComponentNameProps {
  // Props definition
  className?: string;
  children?: React.ReactNode;
}

export function ComponentName({ 
  className, 
  children,
  ...props 
}: ComponentNameProps) {
  // Component logic here
  
  return (
    <div className={cn("base-styles", className)} {...props}>
      {children}
    </div>
  );
}
```

### Error Handling

Implement error states for all components that fetch data or perform operations:

```tsx
// Error state example
{isError && (
  <div className="p-4 text-error bg-error-light rounded-md">
    <p>An error occurred: {errorMessage}</p>
  </div>
)}

// Loading state example
{isLoading && (
  <div className="flex items-center justify-center p-4">
    <span className="animate-spin mr-2">
      <LoaderIcon size={18} />
    </span>
    <span>Loading...</span>
  </div>
)}
```

### Performance Optimization

- Use `React.memo()` for components that render often but rarely change
- Use `useMemo()` for expensive calculations
- Use `useCallback()` for functions passed as props to child components

## Accessibility Guidelines

- Ensure proper keyboard navigation
- Use semantic HTML elements (`button`, `a`, etc.)
- Provide proper ARIA attributes where needed
- Ensure sufficient color contrast
- Support screen readers by using proper labels

---

Last updated: [Current Date] 