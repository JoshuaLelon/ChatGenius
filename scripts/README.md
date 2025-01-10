# Development Scripts

This directory contains utility scripts for development and deployment.

## Available Scripts

- `deploy.sh` - Deployment automation:
  - Builds application
  - Runs tests
  - Deploys to AWS
  - Updates DNS if needed

- `setup-local.sh` - Local development setup:
  - Installs dependencies
  - Sets up database
  - Configures environment
  - Starts services

## Usage

All scripts are executable:
```bash
# Setup local development
./setup-local.sh

# Deploy to production
./deploy.sh
```

## Adding New Scripts

1. Create script file
2. Make it executable:
   ```bash
   chmod +x scripts/new-script.sh
   ```
3. Document it in this README
4. Add shebang line:
   ```bash
   #!/usr/bin/env bash
   ```

## Best Practices

1. Add proper error handling
2. Include usage comments
3. Check prerequisites
4. Use environment variables
5. Add logging for clarity
