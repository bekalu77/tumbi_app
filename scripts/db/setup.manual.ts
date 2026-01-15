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

async function setupDatabase() {
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
        const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
        for (const statement of statements) {
            const trimmed = statement.trim();
            if (trimmed && !trimmed.startsWith('--')) {
                try {
                    console.log(`Executing: ${trimmed.substring(0, 50)}...`);
                    await client.query(trimmed);
                } catch (error: any) {
                    console.log(`Skipping statement (might already exist): ${error.message}`);
                }
            }
        }

        console.log("✅ Database setup completed successfully!");
    } catch (error: any) {
        console.error("❌ Database setup failed:");
        console.error(error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

setupDatabase();