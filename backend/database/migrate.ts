import { neon } from '@neondatabase/serverless';
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
    const sql = neon(databaseUrl);

    try {
        const schemaPath = path.resolve(process.cwd(), 'schema.sql');
        console.log(`Reading ${schemaPath}...`);
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log("Executing schema.sql...");
        // neon-serverless handles multiple statements in one call
        await sql`${sql.raw(schema)}`;

        console.log("✅ Database schema updated successfully!");
    } catch (error: any) {
        console.error("❌ Migration failed:");
        console.error(error.message);
        process.exit(1);
    }
}

// migrate(); // Commented out to prevent accidental runs
