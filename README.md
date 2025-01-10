# ChatGenius - A Modern Slack Clone

A real-time chat application built with modern web technologies, featuring a robust architecture and comprehensive feature set.

## Technology Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: AWS Lambda, API Gateway (WebSocket), RDS
- **Infrastructure**: AWS Amplify, Terraform
- **Authentication**: Auth0
- **Database**: Prisma with PostgreSQL
- **Testing**: End-to-end, Integration, and Unit tests

## Project Structure

Below is a tree of the documentation for all subdirectories:

- [.github/workflows](.github/workflows/README.md) - CI/CD pipelines
- [.vscode](.vscode/README.md) - VS Code configuration
- [amplify](amplify/README.md) - AWS Amplify configuration
- [infrastructure](infrastructure/README.md) - Terraform and Docker setup
- [src/app](src/app/README.md) - Next.js App Router pages and API routes
- [src/components](src/components/README.md) - React components
- [src/config](src/config/README.md) - Application configuration
- [src/lib](src/lib/README.md) - Utilities and store
- [src/styles](src/styles) - Global styles and Tailwind configuration
- [src/types](src/types/README.md) - TypeScript type definitions
- [prisma](prisma/README.md) - Database schema and migrations
- [lambda](lambda/README.md) - AWS Lambda functions
- [scripts](scripts/README.md) - Development and deployment scripts
- [tests](tests/README.md) - Test suites

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run lint` - Run linter

## Deployment

See [infrastructure/README.md](infrastructure/README.md) for detailed deployment instructions.
