# React Components

This directory contains all reusable React components organized by type.

## Directory Structure

- `ui/` - UI components built with shadcn/ui and Radix
  - Buttons, inputs, modals, etc.
  - See [UI Components](ui/README.md)
- `forms/` - Form-related components
  - Form fields, validation, etc.
  - See [Form Components](forms/README.md)
- `layouts/` - Layout components
  - Headers, sidebars, etc.
  - See [Layout Components](layouts/README.md)

## Component Guidelines

1. Use TypeScript interfaces for props
2. Implement proper error boundaries
3. Use React Server Components where possible
4. Add JSDoc comments for complex components
5. Include Storybook stories for UI components

## Best Practices

- Keep components small and focused
- Use composition over inheritance
- Implement proper loading states
- Handle edge cases and errors
- Write unit tests for complex logic
