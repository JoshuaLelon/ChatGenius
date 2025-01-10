# Docker Configuration

This directory contains Docker configuration for local development.

## Files

- `Dockerfile.dev` - Development Dockerfile for the Next.js application
- `docker-compose.yml` - Compose file that sets up the development environment

## Services

- `app` - Next.js application running in development mode
- `db` - PostgreSQL database for local development

## Usage

Start the development environment:
```bash
docker-compose up -d
```

Stop the development environment:
```bash
docker-compose down
```

View logs:
```bash
docker-compose logs -f
```

## Environment Variables

The following environment variables are set in the docker-compose.yml:

### App Service
- `NODE_ENV=development`
- `DATABASE_URL=postgresql://postgres:postgres@db:5432/chatgenius`

### Database Service
- `POSTGRES_USER=postgres`
- `POSTGRES_PASSWORD=postgres`
- `POSTGRES_DB=chatgenius`

## Volumes

- `postgres_data` - Persistent volume for PostgreSQL data
- Application code is mounted at `/app`
- `node_modules` is preserved in a Docker volume
