
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_PWh13GNCltza@ep-delicate-recipe-agnq91f0-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
});

const setupDatabase = async () => {
    const client = await pool.connect();
    try {
        console.log('Clearing existing tables...');
        await client.query('DROP TABLE IF EXISTS messages, conversations, listings, users CASCADE');
        
        console.log('Creating tables...');
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
        console.log('Database setup complete.');
    } catch (error) {
        console.error('Error setting up database:', error);
    } finally {
        await client.release();
        await pool.end();
    }
};

setupDatabase();
