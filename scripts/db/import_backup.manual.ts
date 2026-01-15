import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
const devVarsPath = path.resolve(process.cwd(), '.dev.vars');
if (fs.existsSync(devVarsPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(devVarsPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

async function importBackup(backupFilePath: string) {
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
        // Read the backup file
        console.log(`Reading backup file: ${backupFilePath}`);
        const backupData = fs.readFileSync(backupFilePath, 'utf8');
        const data = JSON.parse(backupData);

        console.log("Starting data import...");

        // Begin transaction
        await client.query('BEGIN');

        // Clear existing data (optional - uncomment if you want to replace all data)
        // console.log("Clearing existing data...");
        // await client.query('DELETE FROM messages');
        // await client.query('DELETE FROM conversations');
        // await client.query('DELETE FROM saved_listings');
        // await client.query('DELETE FROM listings');
        // await client.query('DELETE FROM users');

        // Import users
        if (data.users && data.users.length > 0) {
            console.log(`Importing ${data.users.length} users...`);
            for (const user of data.users) {
                // Provide default email if null
                const email = user.email || `${user.phone.replace(/[^a-zA-Z0-9]/g, '')}@temp.com`;
                await client.query(`
                    INSERT INTO users (
                        id, name, company_name, email, phone, password,
                        location, profile_image, is_verified, is_admin, created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    ON CONFLICT (id) DO UPDATE SET
                        name = EXCLUDED.name,
                        company_name = EXCLUDED.company_name,
                        email = EXCLUDED.email,
                        phone = EXCLUDED.phone,
                        password = EXCLUDED.password,
                        location = EXCLUDED.location,
                        profile_image = EXCLUDED.profile_image,
                        is_verified = EXCLUDED.is_verified,
                        is_admin = EXCLUDED.is_admin,
                        created_at = EXCLUDED.created_at
                `, [
                    user.id, user.name, user.company_name, email, user.phone, user.password,
                    user.location, user.profile_image, user.is_verified, false, // is_admin defaults to false
                    user.created_at || new Date().toISOString()
                ]);
            }
        }

        // Import listings
        if (data.listings && data.listings.length > 0) {
            console.log(`Importing ${data.listings.length} listings...`);
            for (const listing of data.listings) {
                await client.query(`
                    INSERT INTO listings (
                        id, user_id, title, description, price, unit, location,
                        contact_phone, main_category, sub_category, image_url,
                        status, views, share_slug, created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                    ON CONFLICT (id) DO UPDATE SET
                        user_id = EXCLUDED.user_id,
                        title = EXCLUDED.title,
                        description = EXCLUDED.description,
                        price = EXCLUDED.price,
                        unit = EXCLUDED.unit,
                        location = EXCLUDED.location,
                        contact_phone = EXCLUDED.contact_phone,
                        main_category = EXCLUDED.main_category,
                        sub_category = EXCLUDED.sub_category,
                        image_url = EXCLUDED.image_url,
                        status = EXCLUDED.status,
                        views = EXCLUDED.views,
                        share_slug = EXCLUDED.share_slug,
                        created_at = EXCLUDED.created_at
                `, [
                    listing.id, listing.user_id, listing.title, listing.description,
                    parseFloat(listing.price), listing.unit, listing.location,
                    listing.contact_phone, listing.main_category, listing.sub_category,
                    listing.image_url, listing.status || 'active', listing.views || 0,
                    listing.share_slug, listing.created_at
                ]);
            }
        }

        // Import conversations
        if (data.conversations && data.conversations.length > 0) {
            console.log(`Importing ${data.conversations.length} conversations...`);
            for (const conversation of data.conversations) {
                await client.query(`
                    INSERT INTO conversations (
                        id, listing_id, buyer_id, seller_id, created_at
                    ) VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (id) DO UPDATE SET
                        listing_id = EXCLUDED.listing_id,
                        buyer_id = EXCLUDED.buyer_id,
                        seller_id = EXCLUDED.seller_id,
                        created_at = EXCLUDED.created_at
                `, [
                    conversation.id, conversation.listing_id, conversation.buyer_id,
                    conversation.seller_id, conversation.created_at
                ]);
            }
        }

        // Import messages
        if (data.messages && data.messages.length > 0) {
            console.log(`Importing ${data.messages.length} messages...`);
            for (const message of data.messages) {
                await client.query(`
                    INSERT INTO messages (
                        id, conversation_id, sender_id, content, created_at
                    ) VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (id) DO UPDATE SET
                        conversation_id = EXCLUDED.conversation_id,
                        sender_id = EXCLUDED.sender_id,
                        content = EXCLUDED.content,
                        created_at = EXCLUDED.created_at
                `, [
                    message.id, message.conversation_id, message.sender_id,
                    message.content, message.created_at
                ]);
            }
        }

        // Import saved listings
        if (data.saved_listings && data.saved_listings.length > 0) {
            console.log(`Importing ${data.saved_listings.length} saved listings...`);
            for (const saved of data.saved_listings) {
                await client.query(`
                    INSERT INTO saved_listings (user_id, listing_id, created_at)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (user_id, listing_id) DO NOTHING
                `, [saved.user_id, saved.listing_id, saved.created_at]);
            }
        }

        // Commit transaction
        await client.query('COMMIT');
        console.log("✅ Backup import completed successfully!");

    } catch (error) {
        // Rollback on error
        await client.query('ROLLBACK');
        console.error("❌ Error importing backup:", error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Check command line arguments
const backupFile = process.argv[2];
if (!backupFile) {
    console.error("Usage: npx tsx import_backup.ts <backup-file.json>");
    console.error("Example: npx tsx import_backup.ts 'Neon database_backup-2026-01-07T00-00-23-249Z.json'");
    process.exit(1);
}

// Resolve the backup file path
const backupFilePath = path.resolve(process.cwd(), backupFile);

// Check if file exists
if (!fs.existsSync(backupFilePath)) {
    console.error(`❌ Backup file not found: ${backupFilePath}`);
    console.error("Please make sure the file exists and the path is correct.");
    process.exit(1);
}

importBackup(backupFilePath).catch(console.error);