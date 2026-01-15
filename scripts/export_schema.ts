// scripts/export_schema.ts
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

dotenv.config();

// Fix for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Backup folder in project root
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Timestamp for file
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(BACKUP_DIR, `tumbi_schema_${timestamp}.sql`);

// Neon/Postgres connection string from environment
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in .env or environment variables');
  process.exit(1);
}

// Function to run pg_dump via child_process
async function exportSchema() {
  console.log(`💾 Exporting schema to ${backupFile} ...`);

  // Command: schema only, no owner, no privileges, use connection string
  const cmd = `pg_dump --schema-only --no-owner --no-privileges "${connectionString}" -f "${backupFile}"`;

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Error exporting schema:', error.message);
      return;
    }
    if (stderr) {
      console.warn('⚠️ Warning:', stderr);
    }
    console.log(`✅ Backup completed! File saved at: ${backupFile}`);
  });
}

exportSchema();
