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

// --- HELPERS ---
function getLoginVariants(input: string): string[] {
    const clean = input.replace(/\D/g, ''); // Digits only
    const variants = new Set<string>([input, clean]);
    
    let base = '';
    if (clean.length === 10 && clean.startsWith('0')) {
        base = clean.substring(1);
    } else if (clean.length === 12 && clean.startsWith('251')) {
        base = clean.substring(3);
    } else if (clean.length === 9) {
        base = clean;
    }

    if (base) {
        variants.add(base);
        variants.add('0' + base);
        variants.add('251' + base);
        variants.add('+251' + base);
    }
    
    return Array.from(variants);
}

function normalizePhoneForStorage(phone: string | undefined): string {
    if (!phone) return '';
    let clean = phone.replace(/[^\d]/g, '');
    if (clean.length === 10 && clean.startsWith('0')) return '+251' + clean.substring(1);
    if (clean.length === 12 && clean.startsWith('251')) return '+' + clean;
    if (clean.length === 9 && (clean.startsWith('9') || clean.startsWith('7'))) return '+251' + clean;
    if (clean.length === 12) return '+' + clean;
    return phone;
}

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
        const users = await sql`SELECT id, name, email, phone, location FROM users WHERE id = ${decoded.id}`;
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
        
        const normPhone = normalizePhoneForStorage(phone);
        const variants = getLoginVariants(phone);
        
        const existing = await sql`
            SELECT id FROM users 
            WHERE phone IN (${variants}) 
               OR phone = ${normPhone} 
               OR (email IS NOT NULL AND email = ${email})
        `;
        
        if (existing.length) return c.json({ message: 'User already exists' }, 409);
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await sql`INSERT INTO users (name, email, phone, password, location) VALUES (${name}, ${email || null}, ${normPhone}, ${hashedPassword}, ${location}) RETURNING id`;
        const token = await sign({ id: result[0].id }, c.env.JWT_SECRET);
        return c.json({ auth: true, token, user: { id: result[0].id, name, email, phone: normPhone, location } });
    } catch (e: any) { return c.json({ message: e.message }, 500); }
});

app.post('/api/login', async (c) => {
    try {
        const body = await c.req.json();
        const password = body.password;
        const input = (body.identifier || body.email || body.phone || '').trim();

        if (!input || !password) {
            return c.json({ message: 'Email/Phone and Password are required' }, 400);
        }

        const sql = neon(c.env.DATABASE_URL);
        const variants = getLoginVariants(input);
        
        // Search by email OR any phone variant
        const rows = await sql`
            SELECT * FROM users 
            WHERE email = ${input} 
               OR phone IN (${variants})
        `;

        if (!rows.length || !(await bcrypt.compare(password, rows[0].password))) {
            return c.json({ message: 'Invalid credentials' }, 401);
        }
        
        const token = await sign({ id: rows[0].id }, c.env.JWT_SECRET);
        const { password: _, ...user } = rows[0];
        return c.json({ auth: true, token, user });
    } catch (e: any) { return c.json({ message: e.message }, 500); }
});

// ... rest of the file ...
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
