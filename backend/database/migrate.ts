import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load variables from .dev.vars if they exist
const devVarsPath = path.resolve(process.cwd(), '.dev.vars');
if (fs.existsSync(devVarsPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(devVarsPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

async function migrate() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error("ERROR: DATABASE_URL not found in .dev.vars or environment.");
        process.exit(1);
    }

    console.log("Connecting to Neon...");
    const pool = new Pool({
        connectionString: databaseUrl,
    });

    const client = await pool.connect();

    try {
        const schemaPath = path.resolve(process.cwd(), 'schema.sql');
        console.log(`Reading ${schemaPath}...`);
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log("Executing schema.sql...");
        // First, add the new columns if they don't exist
        console.log("Adding new columns...");
        await client.query(`
            ALTER TABLE listings
            ADD COLUMN IF NOT EXISTS main_category VARCHAR(100),
            ADD COLUMN IF NOT EXISTS sub_category VARCHAR(100),
            ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20),
            ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS share_slug VARCHAR(255) UNIQUE;
        `);

        // Migrate data from old columns to new ones
        console.log("Migrating data from old columns...");
        await client.query(`
            UPDATE listings
            SET main_category = category_slug,
                sub_category = listing_type
            WHERE main_category IS NULL AND category_slug IS NOT NULL;
        `);

        // Drop old columns
        console.log("Dropping old columns...");
        await client.query(`
            ALTER TABLE listings
            DROP COLUMN IF EXISTS category_slug,
            DROP COLUMN IF EXISTS listing_type;
        `);

        // Execute the rest of the schema
        const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
        for (const statement of statements) {
            const trimmed = statement.trim();
            if (trimmed && !trimmed.startsWith('--') && !trimmed.includes('CREATE TABLE') && !trimmed.includes('listings (')) {
                try {
                    console.log(`Executing: ${trimmed.substring(0, 50)}...`);
                    await client.query(trimmed);
                } catch (error: any) {
                    console.log(`Skipping statement (might already exist): ${error.message}`);
                }
            }
        }

        console.log("✅ Database schema updated successfully!");

        console.log("✅ Database schema updated successfully!");
    } catch (error: any) {
        console.error("❌ Migration failed:");
        console.error(error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

// migrate(); // Commented out to prevent accidental runs
