# GitHub Actions Workflows

This directory contains our CI/CD pipeline configurations.

## Workflows

- `ci.yml` - Main CI pipeline that runs on every push:
  - Runs TypeScript type checking
  - Runs ESLint for code quality
  - Runs tests
  - Builds the application
  - (Future) Deploys to staging/production environments

## Adding New Workflows

When adding new workflows:
1. Create a new YAML file in this directory
2. Document its purpose in this README
3. Ensure all secrets are properly configured in GitHub repository settings
