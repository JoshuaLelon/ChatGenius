# AWS Lambda Functions

This directory contains our serverless functions for real-time chat functionality.

## WebSocket Functions

Located in `websocket/`:
- `connect.ts` - Handles new WebSocket connections
- `disconnect.ts` - Cleans up when clients disconnect
- `message.ts` - Processes and broadcasts chat messages

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build TypeScript:
   ```bash
   npm run build
   ```

3. Package for deployment:
   ```bash
   npm run package
   ```

## Deployment

Functions are deployed via Terraform:
1. Build and package functions
2. Update Terraform configuration
3. Apply Terraform changes

## Testing

1. Unit tests:
   ```bash
   npm test
   ```

2. Local testing with AWS SAM:
   ```bash
   sam local invoke
   ```

## Best Practices

1. Keep functions small and focused
2. Implement proper error handling
3. Use environment variables
4. Log important events
5. Set appropriate timeouts
