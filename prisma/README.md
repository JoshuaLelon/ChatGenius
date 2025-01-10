# Database Schema

This directory contains Prisma schema and migrations for our PostgreSQL database.

## Files

- `schema.prisma` - Database schema definition
- `migrations/` - Database migrations history

## Schema Models

Our Slack clone includes these main models:
- User (profile, settings)
- Workspace (teams)
- Channel (chat rooms)
- Message (chat content)
- Attachment (files, images)

## Development Workflow

1. Modify `schema.prisma`
2. Generate migration:
   ```bash
   npx prisma migrate dev --name what_changed
   ```
3. Apply to database:
   ```bash
   npx prisma migrate deploy
   ```
4. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

## Environment Setup

1. Set `DATABASE_URL` in `.env`
2. Run migrations
3. Seed database if needed:
   ```bash
   npx prisma db seed
   ```

## Best Practices

1. Always use migrations (no direct schema push)
2. Version control all migrations
3. Test migrations before deployment
4. Back up database before migrating
5. Use meaningful migration names
