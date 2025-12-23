import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { sign, verify } from 'hono/jwt';

type Bindings = {
    DATABASE_URL: string;
    JWT_SECRET: string;
    R2_BUCKET: R2Bucket;
}

const app = new Hono<{ Bindings: Bindings }>();

// --- MIDDLEWARE ---
app.use('/*', cors({
  origin: (origin) => origin, // Reflect the request origin
  allowHeaders: ['Content-Type', 'x-access-token', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Health check
app.get('/health', (c) => c.text('OK'));

app.use('/api/*', async (c, next) => {
    const publicPaths = ['/api/register', '/api/login', '/api/listings'];
    if (publicPaths.includes(c.req.path) || c.req.method === 'OPTIONS') {
        return await next();
    }

    const authHeader = c.req.header('x-access-token');
    if (!authHeader) return c.json({ message: 'No token provided' }, 401);

    try {
        const decoded = await verify(authHeader, c.env.JWT_SECRET);
        const sql = neon(c.env.DATABASE_URL);
        const users = await sql`SELECT id, name, email, location FROM users WHERE id = ${decoded.id}`;
        if (!users.length) return c.json({ message: 'User not found' }, 401);
        c.set('user', users[0]);
        return await next();
    } catch (err) {
        return c.json({ message: 'Invalid session' }, 401);
    }
});

// --- AUTH ---
app.post('/api/register', async (c) => {
    try {
        const { name, email, phone, password, location } = await c.req.json();
        const sql = neon(c.env.DATABASE_URL);
        const existing = await sql`SELECT id FROM users WHERE email = ${email} OR phone = ${phone}`;
        if (existing.length) return c.json({ message: 'User already exists' }, 409);
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await sql`INSERT INTO users (name, email, phone, password, location) VALUES (${name}, ${email}, ${phone}, ${hashedPassword}, ${location}) RETURNING id`;
        const token = await sign({ id: result[0].id }, c.env.JWT_SECRET);
        return c.json({ auth: true, token, user: { id: result[0].id, name, email, location } });
    } catch (e: any) { return c.json({ message: e.message }, 500); }
});

app.post('/api/login', async (c) => {
    try {
        const { email, password } = await c.req.json();
        const sql = neon(c.env.DATABASE_URL);
        const rows = await sql`SELECT * FROM users WHERE email = ${email}`;
        if (!rows.length || !(await bcrypt.compare(password, rows[0].password))) {
            return c.json({ message: 'Invalid credentials' }, 401);
        }
        const token = await sign({ id: rows[0].id }, c.env.JWT_SECRET);
        const { password: _, ...user } = rows[0];
        return c.json({ auth: true, token, user });
    } catch (e: any) { return c.json({ message: e.message }, 500); }
});

// --- LISTINGS ---
app.get('/api/listings', async (c) => {
    console.log("Local Backend: Fetching listings from Neon...");
    const sql = neon(c.env.DATABASE_URL);
    try {
        const rows = await sql`
            SELECT l.*, u.name as "sellerName", u.phone as "sellerPhone" 
            FROM listings l 
            LEFT JOIN users u ON l.user_id = u.id 
            ORDER BY created_at DESC
        `;
        console.log(`Local Backend: Found ${rows.length} listings.`);
        return c.json(rows.map(r => ({
            ...r,
            id: String(r.id),
            price: parseFloat(r.price),
            imageUrls: r.image_url ? r.image_url.split(',') : [],
            isVerified: !!r.is_verified,
            listingType: r.listing_type,
            category: r.category_slug,
            createdAt: r.created_at,
            sellerId: String(r.user_id)
        })));
    } catch (e: any) { 
        console.error("Local Backend Error:", e.message);
        return c.json({ message: e.message }, 500); 
    }
});

export default app;
