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
  origin: '*',
  allowHeaders: ['Content-Type', 'x-access-token'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

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

// --- PROFILE ---
app.put('/api/users/me', async (c) => {
    const user = c.get('user');
    try {
        const { name, email, location } = await c.req.json();
        const sql = neon(c.env.DATABASE_URL);
        
        const existing = await sql`SELECT id FROM users WHERE email = ${email} AND id != ${user.id}`;
        if (existing.length) return c.json({ message: 'Email already in use' }, 409);

        await sql`UPDATE users SET name = ${name}, email = ${email}, location = ${location} WHERE id = ${user.id}`;
        return c.json({ success: true, message: 'Profile updated' });
    } catch (e: any) { return c.json({ message: e.message }, 500); }
});

// --- SAVED LISTINGS ---
app.get('/api/saved', async (c) => {
    const user = c.get('user');
    const sql = neon(c.env.DATABASE_URL);
    try {
        const rows = await sql`SELECT listing_id FROM saved_listings WHERE user_id = ${user.id}`;
        return c.json(rows.map(r => String(r.listing_id)));
    } catch (e: any) { return c.json({ message: e.message }, 500); }
});

app.post('/api/saved/:id', async (c) => {
    const user = c.get('user');
    const listingId = parseInt(c.req.param('id'));
    const sql = neon(c.env.DATABASE_URL);
    try {
        await sql`INSERT INTO saved_listings (user_id, listing_id) VALUES (${user.id}, ${listingId}) ON CONFLICT DO NOTHING`;
        return c.json({ success: true });
    } catch (e: any) { return c.json({ message: e.message }, 500); }
});

app.delete('/api/saved/:id', async (c) => {
    const user = c.get('user');
    const listingId = parseInt(c.req.param('id'));
    const sql = neon(c.env.DATABASE_URL);
    try {
        await sql`DELETE FROM saved_listings WHERE user_id = ${user.id} AND listing_id = ${listingId}`;
        return c.json({ success: true });
    } catch (e: any) { return c.json({ message: e.message }, 500); }
});

// --- LISTINGS ---
app.get('/api/listings', async (c) => {
    const sql = neon(c.env.DATABASE_URL);
    try {
        const rows = await sql`
            SELECT l.*, u.name as "sellerName", u.phone as "sellerPhone" 
            FROM listings l 
            LEFT JOIN users u ON l.user_id = u.id 
            ORDER BY created_at DESC
        `;
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
    } catch (e: any) { return c.json({ message: e.message }, 500); }
});

export default app;
