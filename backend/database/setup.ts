
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const setupDatabase = async () => {
    const client = await pool.connect();
    try {
        console.log('Ensuring tables exist (without dropping data)...');
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(255),
                password VARCHAR(255) NOT NULL,
                location VARCHAR(255)
            );

            CREATE TABLE IF NOT EXISTS listings (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                price NUMERIC(10, 2) NOT NULL,
                unit VARCHAR(50) NOT NULL,
                location VARCHAR(255) NOT NULL,
                category_slug VARCHAR(255) NOT NULL,
                listing_type VARCHAR(50) NOT NULL,
                description TEXT NOT NULL,
                image_url TEXT NOT NULL,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                is_verified BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS saved_listings (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, listing_id)
            );

            CREATE TABLE IF NOT EXISTS conversations (
                id SERIAL PRIMARY KEY,
                listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
                buyer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
                sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Database verification complete. Existing data preserved.');
    } catch (error) {
        console.error('Error verifying database:', error);
    } finally {
        await client.release();
        await pool.end();
    }
};

setupDatabase();
