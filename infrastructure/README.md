# Infrastructure Configuration

This directory contains infrastructure-as-code and deployment configurations.

## Directory Structure

- `terraform/` - Terraform configurations:
  - `environments/` - Environment-specific configurations
    - `dev/` - Development environment
    - `prod/` - Production environment
  - `modules/` - Reusable Terraform modules
    - `rds/` - Database configuration
    - `s3/` - Storage configuration
    - `api-gateway/` - API Gateway setup
    - `lambda/` - Lambda functions configuration
- `docker/` - Docker configurations:
  - `Dockerfile.dev` - Development container
  - `docker-compose.yml` - Local development services

## Getting Started

1. Install prerequisites:
   - Terraform
   - Docker
   - AWS CLI

2. Initialize Terraform:
   ```bash
   cd terraform/environments/dev
   terraform init
   ```

3. Start local development environment:
   ```bash
   docker-compose -f docker/docker-compose.yml up -d
   ```

## Deployment

See subdirectory READMEs for specific deployment instructions:
- [Terraform Configuration](terraform/README.md)
- [Docker Configuration](docker/README.md)
