# TypeScript Types

This directory contains shared TypeScript types and interfaces.

## Type Categories

- API Types
  - Request/Response types
  - WebSocket message types
- Model Types
  - Database model types
  - Prisma-generated types
- Component Types
  - Props interfaces
  - Event types
- Utility Types
  - Helper types
  - Type guards

## Best Practices

1. Use interfaces for object types
2. Use type for unions and primitives
3. Export all types from index files
4. Keep types DRY (Don't Repeat Yourself)
5. Document complex types with JSDoc

## Usage

Import types from this directory:
```typescript
import type { User, Message, Channel } from '@/types'
```

## Adding New Types

1. Create types in appropriate files
2. Export from index files
3. Document in this README
4. Update related component props
