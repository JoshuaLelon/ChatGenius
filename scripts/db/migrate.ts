import { promises as fs } from 'fs';
import path from 'path';
import { query } from '../../src/lib/db/utils';

async function getCurrentVersion(): Promise<number> {
    try {
        const result = await query(`
            SELECT version FROM schema_migrations
            ORDER BY version DESC
            LIMIT 1
        `);
        return result.rows[0]?.version || 0;
    } catch (error) {
        // If table doesn't exist, create it
        await query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        return 0;
    }
}

async function migrate(): Promise<void> {
    const currentVersion = await getCurrentVersion();
    
    const migrationsDir = path.join(__dirname, '../../db/migrations');
    const files = await fs.readdir(migrationsDir);
    
    const migrations = files
        .filter(f => f.endsWith('.up.sql'))
        .map(f => ({
            version: parseInt(f.split('_')[0]),
            path: path.join(migrationsDir, f)
        }))
        .sort((a, b) => a.version - b.version)
        .filter(m => m.version > currentVersion);

    for (const migration of migrations) {
        const sql = await fs.readFile(migration.path, 'utf-8');
        console.log(`Applying migration ${migration.version}...`);
        
        await query('BEGIN');
        try {
            await query(sql);
            await query(
                'INSERT INTO schema_migrations (version) VALUES ($1)',
                [migration.version]
            );
            await query('COMMIT');
            console.log(`Migration ${migration.version} applied successfully`);
        } catch (error) {
            await query('ROLLBACK');
            console.error(`Error applying migration ${migration.version}:`, error);
            throw error;
        }
    }
}

migrate().catch(console.error); 