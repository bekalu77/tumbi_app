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
  origin: '*', 
  allowHeaders: ['Content-Type', 'x-access-token', 'Authorization', 'X-Requested-With'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
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
        const users = await sql`SELECT id, name, email, location FROM users WHERE id = ${parseInt(decoded.id as string)}`;
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
        const token = await sign({ id: String(result[0].id) }, c.env.JWT_SECRET);
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
        const token = await sign({ id: String(rows[0].id) }, c.env.JWT_SECRET);
        const { password: _, ...user } = rows[0];
        return c.json({ auth: true, token, user: { ...user, id: String(user.id) } });
    } catch (e: any) { return c.json({ message: e.message }, 500); }
});

// --- LISTINGS ---
app.get('/api/listings', async (c) => {
    const sql = neon(c.env.DATABASE_URL);
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');
    const mainCategory = c.req.query('mainCategory');
    const subCategory = c.req.query('subCategory');
    const city = c.req.query('city');
    const search = c.req.query('search');
    const sortBy = c.req.query('sortBy') || 'date-desc';

    try {
        let query = `
            SELECT l.*, u.name as "sellerName", u.phone as "sellerPhone" 
            FROM listings l 
            LEFT JOIN users u ON l.user_id = u.id 
            WHERE 1=1
        `;
        const params: any[] = [];

        // Map Main Category to listing_type
        if (mainCategory && mainCategory !== 'all') {
            params.push(mainCategory);
            query += ` AND l.listing_type = $${params.length}`;
        }

        // Map Sub Category to category_slug
        if (subCategory && subCategory !== 'all') {
            params.push(subCategory);
            query += ` AND l.category_slug = $${params.length}`;
        }

        if (city && city !== 'All Cities') {
            params.push(city);
            query += ` AND l.location = $${params.length}`;
        }

        if (search) {
            params.push(`%${search.toLowerCase()}%`);
            query += ` AND (LOWER(l.title) LIKE $${params.length} OR LOWER(l.description) LIKE $${params.length})`;
        }

        if (sortBy === 'price-asc') query += ` ORDER BY l.price ASC`;
        else if (sortBy === 'price-desc') query += ` ORDER BY l.price DESC`;
        else if (sortBy === 'date-asc') query += ` ORDER BY l.id ASC`; 
        else query += ` ORDER BY l.id DESC`; 

        params.push(limit);
        query += ` LIMIT $${params.length}`;
        params.push(offset);
        query += ` OFFSET $${params.length}`;

        const rows = await sql(query, params);

        return c.json(rows.map(r => ({
            ...r,
            id: String(r.id),
            price: parseFloat(r.price),
            imageUrls: r.image_url ? r.image_url.split(',') : [],
            isVerified: !!r.is_verified,
            // Map back to frontend names
            mainCategory: r.listing_type,
            subCategory: r.category_slug,
            createdAt: r.created_at || new Date(),
            sellerId: String(r.user_id)
        })));
    } catch (e: any) { return c.json({ message: e.message }, 500); }
});

app.post('/api/listings', async (c) => {
    const user = c.get('user');
    const { title, price, unit, location, mainCategory, subCategory, description, imageUrls } = await c.req.json();
    const sql = neon(c.env.DATABASE_URL);
    try {
        // Map: mainCategory -> listing_type, subCategory -> category_slug
        const result = await sql`
            INSERT INTO listings (title, price, unit, location, listing_type, category_slug, description, image_url, user_id)
            VALUES (${title}, ${price}, ${unit}, ${location}, ${mainCategory}, ${subCategory}, ${description}, ${imageUrls.join(',')}, ${parseInt(user.id)})
            RETURNING *
        `;
        return c.json({ 
            ...result[0], 
            id: String(result[0].id),
            mainCategory: result[0].listing_type,
            subCategory: result[0].category_slug 
        });
    } catch (e: any) { return c.json({ message: e.message }, 500); }
});

app.put('/api/listings/:id', async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');
    const { title, price, unit, location, mainCategory, subCategory, description, imageUrls } = await c.req.json();
    const sql = neon(c.env.DATABASE_URL);
    try {
        // Map: mainCategory -> listing_type, subCategory -> category_slug
        const result = await sql`
            UPDATE listings SET 
                title = ${title}, price = ${price}, unit = ${unit}, location = ${location}, 
                listing_type = ${mainCategory}, category_slug = ${subCategory}, 
                description = ${description}, image_url = ${imageUrls.join(',')}
            WHERE id = ${parseInt(id)} AND user_id = ${parseInt(user.id)}
            RETURNING *
        `;
        if (!result.length) return c.json({ message: 'Listing not found or not authorized' }, 404);
        return c.json({ 
            ...result[0], 
            id: String(result[0].id),
            mainCategory: result[0].listing_type,
            subCategory: result[0].category_slug 
        });
    } catch (e: any) { return c.json({ message: e.message }, 500); }
});

app.delete('/api/listings/:id', async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');
    const sql = neon(c.env.DATABASE_URL);
    try {
        const result = await sql`DELETE FROM listings WHERE id = ${parseInt(id)} AND user_id = ${parseInt(user.id)} RETURNING id`;
        if (!result.length) return c.json({ message: 'Listing not found or not authorized' }, 404);
        return c.json({ message: 'Deleted' });
    } catch (e: any) { return c.json({ message: e.message }, 500); }
});

app.get('/api/saved', async (c) => {
    const user = c.get('user');
    const sql = neon(c.env.DATABASE_URL);
    try {
        const rows = await sql`
            SELECT l.id FROM saved_listings sl
            JOIN listings l ON sl.listing_id = l.id
            WHERE sl.user_id = ${parseInt(user.id)}
        `;
        return c.json(rows.map(r => String(r.id)));
    } catch (e: any) { return c.json({ message: e.message }, 500); }
});

app.post('/api/saved/:id', async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');
    const sql = neon(c.env.DATABASE_URL);
    try {
        await sql`INSERT INTO saved_listings (user_id, listing_id) VALUES (${parseInt(user.id)}, ${parseInt(id)}) ON CONFLICT DO NOTHING`;
        return c.json({ message: 'Saved' });
    } catch (e: any) { return c.json({ message: e.message }, 500); }
});

app.delete('/api/saved/:id', async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');
    const sql = neon(c.env.DATABASE_URL);
    try {
        await sql`DELETE FROM saved_listings WHERE user_id = ${parseInt(user.id)} AND listing_id = ${parseInt(id)}`;
        return c.json({ message: 'Unsaved' });
    } catch (e: any) { return c.json({ message: e.message }, 500); }
});

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
            await c.env.R2_BUCKET.put(key, file, { httpMetadata: { contentType: file.type } });
            urls.push(`https://pub-f4faac6ec4e94df08e2c56afbf983bf1.r2.dev/${key}`);
        } catch (error: any) { return c.json({ message: `Failed to upload image: ${error.message}` }, 500); }
    }
    return c.json({ urls });
});

app.get('/api/users/me', async (c) => c.json(c.get('user')));

app.put('/api/users/me', async (c) => {
    const user = c.get('user');
    const { name, email, location } = await c.req.json();
    const sql = neon(c.env.DATABASE_URL);
    try {
        const existing = await sql`SELECT id FROM users WHERE email = ${email} AND id != ${parseInt(user.id)}`;
        if (existing.length) return c.json({ message: 'Email already in use' }, 409);
        await sql`UPDATE users SET name = ${name}, email = ${email}, location = ${location} WHERE id = ${parseInt(user.id)}`;
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
        const existing = await sql`SELECT id FROM conversations WHERE listing_id = ${parseInt(listingId)} AND buyer_id = ${parseInt(user.id)} AND seller_id = ${parseInt(sellerId)}`;
        if (existing.length) return c.json({ id: String(existing[0].id) });
        const result = await sql`INSERT INTO conversations (listing_id, buyer_id, seller_id) VALUES (${parseInt(listingId)}, ${parseInt(user.id)}, ${parseInt(sellerId)}) RETURNING id`;
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
                CASE WHEN c.buyer_id = ${parseInt(user.id)} THEN c.seller_id ELSE c.buyer_id END as other_user_id,
                CASE WHEN c.buyer_id = ${parseInt(user.id)} THEN u_seller.name ELSE u_buyer.name END as other_user_name,
                m.content as last_message,
                m.timestamp as last_message_date
            FROM conversations c
            JOIN listings l ON c.listing_id = l.id
            LEFT JOIN users u_buyer ON c.buyer_id = u_buyer.id
            LEFT JOIN users u_seller ON c.seller_id = u_seller.id
            LEFT JOIN messages m ON c.id = m.conversation_id AND m.id = (
                SELECT MAX(id) FROM messages WHERE conversation_id = c.id
            )
            WHERE c.buyer_id = ${parseInt(user.id)} OR c.seller_id = ${parseInt(user.id)}
            ORDER BY COALESCE(m.timestamp, TO_TIMESTAMP(0)) DESC, c.id DESC
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
        const conv = await sql`SELECT id FROM conversations WHERE id = ${parseInt(conversationId)} AND (buyer_id = ${parseInt(user.id)} OR seller_id = ${parseInt(user.id)})`;
        if (!conv.length) return c.json({ message: 'Conversation not found' }, 404);
        const rows = await sql`SELECT id, conversation_id, sender_id, receiver_id, content, timestamp FROM messages WHERE conversation_id = ${parseInt(conversationId)} ORDER BY timestamp ASC`;
        return c.json(rows.map(r => ({
            id: String(r.id),
            conversation_id: String(r.conversation_id),
            sender_id: String(r.sender_id),
            receiver_id: String(r.receiver_id),
            content: r.content,
            timestamp: r.timestamp
        })));
    } catch (e: any) { return c.json({ message: e.message }, 500); }
});

app.post('/api/messages', async (c) => {
    const user = c.get('user');
    const { conversationId, receiverId, content } = await c.req.json();
    const sql = neon(c.env.DATABASE_URL);
    try {
        const conv = await sql`SELECT id FROM conversations WHERE id = ${parseInt(conversationId)} AND (buyer_id = ${parseInt(user.id)} OR seller_id = ${parseInt(user.id)})`;
        if (!conv.length) return c.json({ message: 'Conversation not found' }, 404);
        const result = await sql`INSERT INTO messages (conversation_id, sender_id, receiver_id, content) VALUES (${parseInt(conversationId)}, ${parseInt(user.id)}, ${parseInt(receiverId)}, ${content}) RETURNING id, timestamp`;
        return c.json({
            id: String(result[0].id),
            conversation_id: String(conversationId),
            sender_id: String(user.id),
            receiver_id: String(receiverId),
            content: content,
            timestamp: result[0].timestamp
        });
    } catch (e: any) { return c.json({ message: e.message }, 500); }
});

export default app;
