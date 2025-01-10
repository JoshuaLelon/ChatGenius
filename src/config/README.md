# Application Configuration

This directory contains configuration files for various services and features.

## Configuration Files

- `auth.ts` - Auth0 configuration:
  - Client ID and domain
  - Callback URLs
  - Scope settings
- `aws.ts` - AWS service configuration:
  - S3 bucket names
  - API Gateway endpoints
  - Region settings

## Environment Variables

All sensitive configuration should be stored in environment variables:
1. Add variables to `.env.example`
2. Document them in this README
3. Use them in configuration files

## Usage

Import configuration from this directory:
```typescript
import { auth } from '@/config/auth'
import { aws } from '@/config/aws'
```

## Adding New Configuration

1. Create a new TypeScript file
2. Export a configuration object
3. Document it in this README
4. Update `.env.example` if needed
