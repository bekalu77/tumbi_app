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

type Variables = {
    user: any;
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// --- HELPERS ---
function normalizePhoneForStorage(phone: any): string {
    const phoneStr = String(phone || '');
    let clean = phoneStr.replace(/[^\d]/g, ''); 
    
    if (clean.length === 10 && clean.startsWith('0')) return '+251' + clean.substring(1);
    if (clean.length === 12 && clean.startsWith('251')) return '+' + clean;
    if (clean.length === 9 && (clean.startsWith('9') || clean.startsWith('7'))) return '+251' + clean;
    return phoneStr; 
}

function getLoginVariants(input: any): string[] {
    const inputStr = String(input || '');
    const clean = inputStr.replace(/\D/g, ''); 
    const variants = new Set<string>([inputStr, clean]);
    
    let base = '';
    if (clean.length === 10 && clean.startsWith('0')) base = clean.substring(1);
    else if (clean.length === 12 && clean.startsWith('251')) base = clean.substring(3);
    else if (clean.length === 9) base = clean;

    if (base) {
        variants.add(base);
        variants.add('0' + base);
        variants.add('251' + base);
        variants.add('+251' + base);
    }
    return Array.from(variants).filter(v => v.length > 0);
}

// --- MIDDLEWARE ---
app.use('/*', cors({
  origin: '*', 
  allowHeaders: ['Content-Type', 'x-access-token', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// --- AUTH ---
app.post('/api/register', async (c) => {
    try {
        const { name, email, phone, password, location } = await c.req.json();
        const sql = neon(c.env.DATABASE_URL);
        
        const normPhone = normalizePhoneForStorage(phone);
        const variants = getLoginVariants(phone);
        const cleanEmail = email ? String(email).trim().toLowerCase() : null;

        const existing = await sql`
            SELECT id FROM users 
            WHERE phone = ANY(${variants})
               OR phone = ${normPhone}
               ${cleanEmail ? sql`OR LOWER(email) = ${cleanEmail}` : sql``}
        `;
        
        if (existing.length) return c.json({ message: 'Account already exists' }, 409);
        
        const hashedPassword = await bcrypt.hash(String(password).trim(), 8);
        const result = await sql`
            INSERT INTO users (name, email, phone, password, location) 
            VALUES (${name}, ${cleanEmail}, ${normPhone}, ${hashedPassword}, ${location}) 
            RETURNING id
        `;
        const token = await sign({ id: String(result[0].id) }, c.env.JWT_SECRET);
        return c.json({ auth: true, token, user: { id: String(result[0].id), name, email: cleanEmail, phone: normPhone, location } });
    } catch (e: any) { return c.json({ message: e.message }, 500); }
});

app.post('/api/login', async (c) => {
    try {
        const body = await c.req.json();
        const password = String(body.password || '').trim();
        const input = String(body.identifier || body.email || body.phone || '').trim();
        
        if (!input || !password) return c.json({ message: 'Missing credentials' }, 400);

        const sql = neon(c.env.DATABASE_URL);
        const variants = getLoginVariants(input);
        
        // Correct way to use arrays in Neon/Postgres is = ANY(${array})
        const rows = await sql`
            SELECT * FROM users 
            WHERE (email IS NOT NULL AND LOWER(email) = LOWER(${input})) 
               OR phone = ANY(${variants})
        `;

        if (rows.length === 0) {
            return c.json({ message: 'User not found. Please check your email/phone.' }, 401);
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return c.json({ message: 'Incorrect password. Try again.' }, 401);
        }
        
        const token = await sign({ id: String(user.id) }, c.env.JWT_SECRET);
        const { password: _, ...userData } = user;
        return c.json({ auth: true, token, user: { ...userData, id: String(userData.id) } });
    } catch (e: any) { return c.json({ message: e.message }, 500); }
});

// --- LISTINGS (SIMPLIFIED) ---
app.get('/api/listings', async (c) => {
    const sql = neon(c.env.DATABASE_URL);
    try {
        const rows = await sql`SELECT l.*, u.name as "sellerName", u.phone as "sellerPhone" FROM listings l LEFT JOIN users u ON l.user_id = u.id ORDER BY created_at DESC`;
        return c.json(rows.map(r => ({ ...r, id: String(r.id), price: parseFloat(r.price), imageUrls: r.image_url ? r.image_url.split(',') : [], sellerId: String(r.user_id) })));
    } catch (e: any) { return c.json({ message: e.message }, 500); }
});

export default app;
