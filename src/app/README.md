# App Router Documentation

This directory uses the Next.js App Router for file-based routing and server components.

## Directory Structure

- `(auth)/` - Authentication routes (grouped)
  - `login/` - Login page
  - `register/` - Registration page
  - See [(auth) README]((auth)/README.md)
- `api/` - API routes
  - `websocket/` - WebSocket connection handling
  - See [API README](api/README.md)
- `layout.tsx` - Root layout with providers
- `page.tsx` - Home page

## Key Features

- Server Components by default
- Route Groups with `(folder)`
- API Routes with `route.ts`
- Layouts with `layout.tsx`
- Pages with `page.tsx`

## Best Practices

1. Use Server Components unless client interactivity is needed
2. Keep client components small and focused
3. Use route groups for logical organization
4. Implement loading states with `loading.tsx`
5. Handle errors with `error.tsx`
