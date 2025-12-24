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

// --- MIDDLEWARE ---
app.use('/*', cors({
  origin: (origin) => origin, // Reflect the request origin
  allowHeaders: ['Content-Type', 'x-access-token', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Health check
app.get('/health', (c) => c.text('OK'));

// --- AUTH MIDDLEWARE ---
app.use('/api/*', async (c, next) => {
    const publicPaths = [
        { path: '/api/register', methods: ['POST'] },
        { path: '/api/login', methods: ['POST'] },
        { path: '/api/listings', methods: ['GET'] }
    ];
    const isPublic = publicPaths.some(p => {
        if (p.path.includes(':key')) {
            return c.req.path.startsWith(p.path.replace(':key', '')) && p.methods.includes(c.req.method);
        }
        return p.path === c.req.path && p.methods.includes(c.req.method);
    }) || c.req.method === 'OPTIONS';
    if (isPublic) {
        return await next();
    }

    const authHeader = c.req.header('x-access-token');
    if (!authHeader) return c.json({ message: 'No token provided' }, 401);

    try {
        const decoded = await verify(authHeader, c.env.JWT_SECRET);
        const sql = neon(c.env.DATABASE_URL);
        const users = await sql`SELECT id, name, email, location FROM users WHERE id = ${decoded.id}`;
        if (!users.length) return c.json({ message: 'User not found' }, 401);
        c.set('user', { ...users[0], id: String(users[0].id) });
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
        return c.json({ auth: true, token, user: { id: String(result[0].id), name, email, location } });
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
        return c.json({ auth: true, token, user: { ...user, id: String(user.id) } });
    } catch (e: any) { return c.json({ message: e.message }, 500); }
});

// --- LISTINGS ---
app.get('/api/listings', async (c) => {
    console.log("Fetching listings from Neon...");
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
    } catch (e: any) { 
        console.error("Database Error:", e.message);
        return c.json({ message: e.message }, 500); 
    }
});

// Create listing
app.post('/api/listings', async (c) => {
    const user = c.get('user');
    const { title, price, unit, location, category, type, description, imageUrls } = await c.req.json();
    const sql = neon(c.env.DATABASE_URL);
    try {
        const result = await sql`
            INSERT INTO listings (title, price, unit, location, category_slug, listing_type, description, image_url, user_id)
            VALUES (${title}, ${price}, ${unit}, ${location}, ${category}, ${type}, ${description}, ${imageUrls.join(',')}, ${user.id})
            RETURNING *
        `;
        return c.json({ ...result[0], id: String(result[0].id) });
    } catch (e: any) { return c.json({ message: e.message }, 500); }
});

// Update listing
app.put('/api/listings/:id', async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');
    const { title, price, unit, location, category, type, description, imageUrls } = await c.req.json();
    const sql = neon(c.env.DATABASE_URL);
    try {
        const result = await sql`
            UPDATE listings SET title = ${title}, price = ${price}, unit = ${unit}, location = ${location}, category_slug = ${category}, listing_type = ${type}, description = ${description}, image_url = ${imageUrls.join(',')}
            WHERE id = ${id} AND user_id = ${user.id}
            RETURNING *
        `;
        if (!result.length) return c.json({ message: 'Listing not found or not authorized' }, 404);
        return c.json({ ...result[0], id: String(result[0].id) });
    } catch (e: any) { return c.json({ message: e.message }, 500); }
});

// Delete listing
app.delete('/api/listings/:id', async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');
    const sql = neon(c.env.DATABASE_URL);
    try {
        const result = await sql`DELETE FROM listings WHERE id = ${id} AND user_id = ${user.id} RETURNING id`;
        if (!result.length) return c.json({ message: 'Listing not found or not authorized' }, 404);
        return c.json({ message: 'Deleted' });
    } catch (e: any) { return c.json({ message: e.message }, 500); }
});

// Get saved listings
app.get('/api/saved', async (c) => {
    const user = c.get('user');
    const sql = neon(c.env.DATABASE_URL);
    try {
        const rows = await sql`
            SELECT l.* FROM saved_listings sl
            JOIN listings l ON sl.listing_id::integer = l.id
            WHERE sl.user_id = ${String(user.id)}
        `;
        return c.json(rows.map(r => String(r.id)));
    } catch (e: any) { return c.json({ message: e.message }, 500); }
});

// Save listing
app.post('/api/saved/:id', async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');
    const sql = neon(c.env.DATABASE_URL);
    try {
        await sql`INSERT INTO saved_listings (user_id, listing_id) VALUES (${String(user.id)}, ${parseInt(id)}) ON CONFLICT DO NOTHING`;
        return c.json({ message: 'Saved' });
    } catch (e: any) { return c.json({ message: e.message }, 500); }
});

// Unsave listing
app.delete('/api/saved/:id', async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');
    const sql = neon(c.env.DATABASE_URL);
    try {
        await sql`DELETE FROM saved_listings WHERE user_id = ${String(user.id)} AND listing_id = ${parseInt(id)}`;
        return c.json({ message: 'Unsaved' });
    } catch (e: any) { return c.json({ message: e.message }, 500); }
});

// Upload images
app.post('/api/upload', async (c) => {
    const user = c.get('user');
    const formData = await c.req.formData();
    const files = formData.getAll('photos');
    if (!files || files.length === 0) return c.json({ message: 'No files provided' }, 400);

    const urls: string[] = [];
    for (const fileEntry of files) {
        if (typeof fileEntry === 'string') continue;
        const file = fileEntry as File;
        const key = `${user.id}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        try {
            await c.env.R2_BUCKET.put(key, file, {
                httpMetadata: { contentType: file.type }
            });
            const url = `https://pub-f4faac6ec4e94df08e2c56afbf983bf1.r2.dev/${key}`;
            urls.push(url);
        } catch (error: any) {
            return c.json({ message: `Failed to upload image: ${error.message}` }, 500);
        }
    }
    return c.json({ urls });
});

// Get user profile
app.get('/api/users/me', async (c) => {
    const user = c.get('user');
    return c.json(user);
});

app.put('/api/users/me', async (c) => {
    const user = c.get('user');
    const { name, email, location } = await c.req.json();
    const sql = neon(c.env.DATABASE_URL);
    try {
        const existing = await sql`SELECT id FROM users WHERE email = ${email} AND id != ${user.id}`;
        if (existing.length) return c.json({ message: 'Email already in use' }, 409);
        
        await sql`UPDATE users SET name = ${name}, email = ${email}, location = ${location} WHERE id = ${user.id}`;
        return c.json({ message: 'Profile updated successfully' });
    } catch (e: any) { return c.json({ message: e.message }, 500); }
});

// --- CHAT ---
app.post('/api/conversations', async (c) => {
    const user = c.get('user');
    const { listingId } = await c.req.json();
    const sql = neon(c.env.DATABASE_URL);
    try {
        const listing = await sql`SELECT user_id FROM listings WHERE id = ${parseInt(listingId)}`;
        if (!listing.length) return c.json({ message: 'Listing not found' }, 404);
        const sellerId = listing[0].user_id;
        const existing = await sql`SELECT id FROM conversations WHERE listing_id = ${parseInt(listingId)} AND buyer_id = ${user.id} AND seller_id = ${sellerId}`;
        if (existing.length) return c.json({ id: String(existing[0].id) });
        const result = await sql`INSERT INTO conversations (listing_id, buyer_id, seller_id) VALUES (${parseInt(listingId)}, ${user.id}, ${sellerId}) RETURNING id`;
        return c.json({ id: String(result[0].id) });
    } catch (e: any) { return c.json({ message: e.message }, 500); }
});

app.get('/api/conversations', async (c) => {
    const user = c.get('user');
    const sql = neon(c.env.DATABASE_URL);
    try {
        const rows = await sql`
            SELECT 
                c.id as conversation_id,
                c.listing_id,
                l.title as listing_title,
                l.image_url,
                CASE WHEN c.buyer_id = ${user.id} THEN c.seller_id ELSE c.buyer_id END as other_user_id,
                CASE WHEN c.buyer_id = ${user.id} THEN u_seller.name ELSE u_buyer.name END as other_user_name,
                m.content as last_message,
                m.created_at as last_message_date
            FROM conversations c
            JOIN listings l ON c.listing_id = l.id
            LEFT JOIN users u_buyer ON c.buyer_id = u_buyer.id
            LEFT JOIN users u_seller ON c.seller_id = u_seller.id
            LEFT JOIN messages m ON c.id = m.conversation_id AND m.id = (
                SELECT MAX(id) FROM messages WHERE conversation_id = c.id
            )
            WHERE c.buyer_id = ${user.id} OR c.seller_id = ${user.id}
            ORDER BY COALESCE(m.created_at, c.created_at) DESC
        `;
        return c.json(rows.map(r => ({
            conversationId: String(r.conversation_id),
            listingId: String(r.listing_id),
            listingTitle: r.listing_title,
            listingImage: r.image_url ? r.image_url.split(',')[0] : '',
            otherUserId: String(r.other_user_id),
            otherUserName: r.other_user_name,
            lastMessage: r.last_message || '',
            lastMessageDate: r.last_message_date || new Date()
        })));
    } catch (e: any) { return c.json({ message: e.message }, 500); }
});

app.get('/api/conversations/:id/messages', async (c) => {
    const user = c.get('user');
    const conversationId = c.req.param('id');
    const sql = neon(c.env.DATABASE_URL);
    try {
        const conv = await sql`SELECT id FROM conversations WHERE id = ${parseInt(conversationId)} AND (buyer_id = ${user.id} OR seller_id = ${user.id})`;
        if (!conv.length) return c.json({ message: 'Conversation not found' }, 404);
        const rows = await sql`SELECT id, conversation_id, sender_id, receiver_id, content, created_at FROM messages WHERE conversation_id = ${parseInt(conversationId)} ORDER BY created_at ASC`;
        return c.json(rows.map(r => ({
            id: String(r.id),
            conversation_id: String(r.conversation_id),
            sender_id: String(r.sender_id),
            receiver_id: String(r.receiver_id),
            content: r.content,
            timestamp: r.created_at
        })));
    } catch (e: any) { return c.json({ message: e.message }, 500); }
});

app.post('/api/messages', async (c) => {
    const user = c.get('user');
    const { conversationId, receiverId, content } = await c.req.json();
    const sql = neon(c.env.DATABASE_URL);
    try {
        const conv = await sql`SELECT id FROM conversations WHERE id = ${parseInt(conversationId)} AND (buyer_id = ${user.id} OR seller_id = ${user.id})`;
        if (!conv.length) return c.json({ message: 'Conversation not found' }, 404);
        const result = await sql`INSERT INTO messages (conversation_id, sender_id, receiver_id, content) VALUES (${parseInt(conversationId)}, ${user.id}, ${parseInt(receiverId)}, ${content}) RETURNING id, created_at`;
        return c.json({
            id: String(result[0].id),
            conversation_id: conversationId,
            sender_id: String(user.id),
            receiver_id: receiverId,
            content: content,
            timestamp: result[0].created_at
        });
    } catch (e: any) { return c.json({ message: e.message }, 500); }
});

export default app;
