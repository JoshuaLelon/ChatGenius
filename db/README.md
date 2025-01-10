# Database Documentation

## Overview
PostgreSQL database with migrations-based schema management. This database serves as the primary data store for the application, handling user data and related entities.

## Schema

### Users Table
- `id` (UUID, Primary Key): Unique identifier for each user
- `email` (VARCHAR): User's email address, must be unique
- `created_at` (TIMESTAMP): Record creation timestamp with timezone
- `updated_at` (TIMESTAMP): Record update timestamp with timezone

### Audit Functionality
- Automatic timestamp management through triggers
- `update_updated_at_column()` function updates `updated_at` automatically
- All tables with timestamps have appropriate triggers

## Migrations
Located in `db/migrations/`, following the format:
- `{version}_description.up.sql`: Forward migration
- `{version}_description.down.sql`: Rollback migration

Current migrations:
1. `000001_init.up.sql`: Initial schema setup
   - Creates UUID extension
   - Creates users table
   - Sets up audit logging functionality

## Scripts

### Migration Scripts
Located in `scripts/db/`:
- `migrate.ts`: TypeScript migration runner
  - Tracks migration versions in `schema_migrations` table
  - Supports forward migrations
  - Implements transaction-based migration for safety
  - Automatic rollback on failure

### Database Utilities
Located in `src/lib/db/`:
- `config.ts`: Database connection configuration
- `utils.ts`: Common database utilities
  - Connection pooling
  - Query execution with logging
  - Transaction management

## Development Guidelines

### Adding New Migrations
1. Create new migration files in `db/migrations/`
2. Follow version numbering convention (6-digit)
3. Always create both `.up.sql` and `.down.sql` files
4. Test migrations in development before deployment

### Best Practices
1. Use transactions for data consistency
2. Include appropriate indexes for performance
3. Implement foreign key constraints
4. Follow naming conventions:
   - Table names: plural, snake_case
   - Column names: singular, snake_case
   - Index names: `idx_{table}_{column(s)}`
   - Foreign keys: `fk_{table}_{referenced_table}`

## Environment Configuration
Required environment variables:
- `DB_HOST`: Database host
- `DB_PORT`: Database port (default: 5432)
- `DB_NAME`: Database name
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password
- `DB_SSL`: SSL mode for production 