# QanDu UI Design System

This document outlines the design system and UI components for the QanDu AI platform. It provides guidelines for creating a consistent, accessible, and visually appealing user experience across the application.

## Table of Contents

1. [Design Principles](#design-principles)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing and Layout](#spacing-and-layout)
5. [Components](#components)
6. [Animation and Motion](#animation-and-motion)
7. [Best Practices](#best-practices)
8. [Usage Examples](#usage-examples)

## Design Principles

The QanDu UI system is built around the following core principles:

- **Consistency**: Ensure a unified look and feel across all parts of the application
- **Clarity**: Present information in a clear, organized manner
- **Efficiency**: Design for user productivity and minimal friction
- **Accessibility**: Make the interface usable by people of all abilities
- **Aesthetics**: Create a visually appealing, modern interface that reflects the QanDu brand

## Color System

Our color system is designed to create a visually cohesive experience while ensuring accessibility.

### Primary Colors

- **QanDu Blue**: Primary brand color used for key UI elements
  - Base: `#0ea5e9` (Primary 500)
  - Range: From 50 (lightest) to 950 (darkest) for different use cases

- **QanDu Purple**: Secondary brand color used for accents and highlights
  - Base: `#8b5cf6` (Secondary 500)
  - Range: From 50 (lightest) to 950 (darkest)

### Semantic Colors

- **Success**: `#22c55e` - Used for success states and positive actions
- **Warning**: `#f97316` - Used for warnings and cautionary states
- **Error**: `#ef4444` - Used for error states and destructive actions
- **Info**: `#06b6d4` - Used for informational states

### Neutral Colors

- Ranges from nearly white (`#f9fafb`) to nearly black (`#030712`) for various UI elements
- Used for text, backgrounds, borders, and other UI elements

### Theme Colors

Our design system supports both light and dark themes with carefully chosen colors for each context:

```css
/* Light theme (default) */
:root {
  --background: 210 20% 98%;
  --foreground: 215 25% 27%;
  /* ...other variables */
}

/* Dark theme */
.dark {
  --background: 220 20% 10%;
  --foreground: 210 20% 98%;
  /* ...other variables */
}
```

## Typography

QanDu uses a typography system designed for readability and hierarchy.

### Font Family

- **Primary**: Inter, with system fallbacks
- **Monospace**: For code blocks and technical content

### Font Sizes

- **xs**: 0.75rem (12px)
- **sm**: 0.875rem (14px)
- **base**: 1rem (16px)
- **lg**: 1.125rem (18px)
- **xl**: 1.25rem (20px)
- **2xl**: 1.5rem (24px)
- **3xl**: 1.875rem (30px)
- **4xl**: 2.25rem (36px)
- **5xl**: 3rem (48px)
- **6xl**: 3.75rem (60px)

### Font Weights

- **light**: 300
- **normal**: 400
- **medium**: 500
- **semibold**: 600
- **bold**: 700
- **extrabold**: 800

### Heading Styles

Use the following utility classes for headings:

```html
<h1 class="qandu-heading-1">Heading 1</h1>
<h2 class="qandu-heading-2">Heading 2</h2>
<h3 class="qandu-heading-3">Heading 3</h3>
```

## Spacing and Layout

QanDu uses a consistent spacing system to create rhythm and hierarchy.

### Spacing Scale

- **0**: 0
- **1**: 0.25rem (4px)
- **2**: 0.5rem (8px)
- **3**: 0.75rem (12px)
- **4**: 1rem (16px)
- **5**: 1.25rem (20px)
- **6**: 1.5rem (24px)
- **8**: 2rem (32px)
- **10**: 2.5rem (40px)
- **12**: 3rem (48px)
- **16**: 4rem (64px)
- **20**: 5rem (80px)
- **24**: 6rem (96px)
- **32**: 8rem (128px)
- **40**: 10rem (160px)
- **48**: 12rem (192px)
- **56**: 14rem (224px)
- **64**: 16rem (256px)

### Layout Containers

Use the `qandu-container` class for a consistent container with appropriate padding:

```html
<div class="qandu-container">
  <!-- Content goes here -->
</div>
```

### Breakpoints

- **xs**: 320px
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

## Components

QanDu offers a set of reusable UI components designed for consistency and accessibility.

### Buttons

The unified button component provides multiple variants and options:

```tsx
// Default button
<Button>Click me</Button>

// Primary gradient button
<Button variant="primary-gradient">Submit</Button>

// Secondary outline button
<Button variant="secondary-outline" size="lg">Learn More</Button>

// Button with loading state
<Button isLoading loadingText="Processing...">Save</Button>

// Button with icon
<Button leftIcon={<PlusIcon />}>Add Item</Button>
```

#### Button Variants

- **default**: Primary color solid button
- **destructive**: Red button for dangerous actions
- **outline**: Outlined button with transparent background
- **secondary**: Secondary color solid button
- **ghost**: Text-only button with hover state
- **link**: Appears as a text link
- **primary-gradient**: Gradient from blue to purple
- **primary-outline**: Blue outlined button
- **secondary-outline**: Purple outlined button

#### Button Sizes

- **default**: Standard size
- **sm**: Small button
- **lg**: Large button
- **xl**: Extra large button
- **icon**: Square button for icons
- **icon-sm**: Small icon button
- **icon-lg**: Large icon button

### Cards

The card component provides consistent styling for content containers:

```tsx
// Default card
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Description goes here</CardDescription>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
  <CardFooter>
    Footer content
  </CardFooter>
</Card>

// Variant with different styles
<Card variant="highlight" size="lg">
  <!-- Card content -->
</Card>
```

#### Card Variants

- **default**: Standard card styling
- **outline**: Card with more prominent border
- **muted**: Subdued styling
- **highlight**: Card with primary color accents
- **primary**: Card with primary color background
- **secondary**: Card with secondary color background

#### Card Properties

- **clickable**: Makes the card interactive with hover effects
- **fullWidth**: Makes the card take the full width of its container
- **noPadding**: Removes the default padding
- **size**: Controls the border radius and shadow (sm, default, lg)

### Other Components

The QanDu UI system includes many other components such as:

- Input fields and forms
- Modal and dialog boxes
- Navigation components
- Tabs and accordion elements
- Toast notifications
- Dropdown menus

For a complete reference, see the component documentation.

## Animation and Motion

QanDu uses subtle animations to enhance user experience without being distracting.

### Transition Helpers

Use these utility classes for transitions:

```html
<div class="qandu-transition-all">
  <!-- Elements with smooth transitions -->
</div>

<div class="qandu-transition-transform">
  <!-- Elements with transform transitions -->
</div>
```

### Animation Classes

Predefined animations for common scenarios:

```html
<div class="qandu-fade-in">
  <!-- Element fades in -->
</div>

<div class="qandu-slide-in">
  <!-- Element slides in from bottom -->
</div>
```

### Animation Timing

- **fast**: 150ms
- **normal**: 250ms
- **slow**: 350ms
- **verySlow**: 500ms

## Best Practices

### Consistency

- Use the predefined components and utility classes rather than creating custom styles
- Maintain consistent spacing using the spacing scale
- Follow the color system for all UI elements

### Accessibility

- Ensure sufficient color contrast (minimum 4.5:1 for text)
- Provide proper focus states for interactive elements
- Include appropriate ARIA attributes for complex components
- Support keyboard navigation for all interactive elements

### Responsive Design

- Design mobile-first, then enhance for larger screens
- Use the breakpoint system for responsive layouts
- Test all interfaces across multiple device sizes

### Dark Mode

- Always ensure components work well in both light and dark mode
- Use the theme variables rather than hard-coded colors
- Test the contrast ratios in both themes

## Usage Examples

### Typical Page Layout

```tsx
export default function PageName() {
  return (
    <div className="qandu-container py-8">
      <h1 className="qandu-heading-1 mb-6">Page Title</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Section Title</CardTitle>
          </CardHeader>
          <CardContent>
            Content goes here
          </CardContent>
          <CardFooter>
            <Button variant="primary">Action</Button>
          </CardFooter>
        </Card>
        
        {/* More cards */}
      </div>
    </div>
  );
}
```

### Form Example

```tsx
export function ExampleForm() {
  return (
    <form className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Email</label>
        <input
          type="email"
          className="w-full rounded-md border border-border bg-background p-2 focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Message</label>
        <textarea
          className="w-full rounded-md border border-border bg-background p-2 focus:border-primary focus:ring-1 focus:ring-primary"
          rows={4}
        />
      </div>
      
      <Button type="submit" variant="primary-gradient">
        Submit
      </Button>
    </form>
  );
}
```

---

This design system documentation serves as a guide for developers and designers working on the QanDu platform. By following these guidelines, we can ensure a consistent, high-quality user experience across the entire application. 