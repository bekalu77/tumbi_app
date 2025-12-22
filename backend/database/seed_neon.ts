
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const MOCK_USERS = [
    { name: 'Dangote Distributors', email: 'dangote@distro.com', phone: '+251911000001', password: 'password123', location: 'Addis Ababa' },
    { name: 'QuickFix Plumbing', email: 'plumber@quick.com', phone: '+251911000002', password: 'password123', location: 'Addis Ababa' }
];

const INITIAL_LISTINGS = [
    {
        title: 'High Quality Red Bricks (5000 pcs)',
        price: 45000,
        unit: 'trip',
        location: 'Addis Ababa',
        category: 'materials',
        type: 'product',
        description: 'Premium burnt clay bricks suitable for structural walls.',
        imageUrls: 'https://picsum.photos/400/300?random=1',
        isVerified: true,
    },
    {
        title: 'Professional Plumbing Service',
        price: 500,
        unit: 'hr',
        location: 'Addis Ababa',
        category: 'services',
        type: 'service',
        description: 'Experienced plumber available for repairs and installations.',
        imageUrls: 'https://picsum.photos/400/300?random=2',
        isVerified: true,
    }
];

async function seed() {
    console.log('Connecting to Neon to seed data...');
    const client = await pool.connect();
    try {
        // Clear existing data (Optional: Uncomment if you want a clean start)
        // await client.query('TRUNCATE users, listings, saved_listings RESTART IDENTITY CASCADE');

        for (const u of MOCK_USERS) {
            const hashedPassword = await bcrypt.hash(u.password, 10);
            const userRes = await client.query(
                'INSERT INTO users (name, email, phone, password, location) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING id',
                [u.name, u.email, u.phone, hashedPassword, u.location]
            );
            const userId = userRes.rows[0].id;

            // Seed a listing for this user
            const listing = INITIAL_LISTINGS[u.name === 'Dangote Distributors' ? 0 : 1];
            await client.query(
                'INSERT INTO listings (title, price, unit, location, category_slug, listing_type, description, image_url, user_id, is_verified) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                [listing.title, listing.price, listing.unit, listing.location, listing.category, listing.type, listing.description, listing.imageUrls, userId, listing.isVerified]
            );
        }

        console.log('Successfully seeded Neon Database!');
    } catch (err) {
        console.error('Error seeding database:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
